import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

function validateTarget(baseUrl, expectedCommit) {
  let origin;
  try {
    origin = new URL(baseUrl);
  } catch {
    throw new Error("BASE_URL must be a verified public HTTPS Pages origin.");
  }
  if (
    origin.protocol !== "https:" ||
    !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.pages\.dev$/.test(origin.hostname) ||
    origin.port ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  ) {
    throw new Error(
      "BASE_URL must be a verified public HTTPS Pages origin without credentials, paths or query parameters.",
    );
  }
  if (!/^[a-f0-9]{40}$/i.test(expectedCommit ?? ""))
    throw new Error("EXPECTED_COMMIT must be a full 40-character Git SHA.");
  return { origin: origin.origin, commit: expectedCommit.toLowerCase() };
}

/** Read-only HTTP verification. Does not run game JavaScript or replace device testing. */
export async function verifyLive({
  baseUrl,
  expectedCommit,
  fetchImpl = fetch,
  timeoutMs = 120_000,
  intervalMs = 5_000,
  now = Date.now,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}) {
  const { origin, commit } = validateTarget(baseUrl, expectedCommit);
  if (
    !Number.isFinite(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 120_000 ||
    !Number.isFinite(intervalMs) ||
    intervalMs < 1
  )
    throw new Error("Invalid verification retry bounds.");
  const deadline = now() + timeoutMs;
  const maxAttempts = Math.min(25, Math.ceil(timeoutMs / intervalMs));
  let lastError = "No response received";

  for (let attempt = 1; attempt <= maxAttempts && now() < deadline; attempt++) {
    try {
      const checked = new Set();
      const hashes = new Map();
      async function get(resource, type) {
        let url = new URL(resource, origin + "/");
        if (url.origin !== origin || url.username || url.password)
          throw new Error("Catalog references an unexpected external origin.");
        if (now() >= deadline)
          throw new Error("Verification deadline reached.");
        // Cache-bust public content only; do not use or transmit any credentials.
        url.searchParams.set("verify_commit", commit);
        let response;
        for (let redirectCount = 0; redirectCount <= 3; redirectCount++) {
          if (now() >= deadline)
            throw new Error("Verification deadline reached.");
          try {
            response = await fetchImpl(url.href, {
              method: "GET",
              redirect: "manual",
              headers: { "Cache-Control": "no-cache" },
              signal: AbortSignal.timeout(
                Math.max(1, Math.min(15_000, deadline - now())),
              ),
            });
          } catch {
            throw new Error(`Network error checking ${url.pathname}`);
          }
          if (![301, 302, 303, 307, 308].includes(response.status)) break;
          const location = response.headers.get("location");
          if (!location || redirectCount === 3)
            throw new Error("Invalid or excessive redirects.");
          const redirected = new URL(location, url);
          if (
            redirected.origin !== origin ||
            redirected.username ||
            redirected.password
          )
            throw new Error("Redirect to unexpected origin refused.");
          url = redirected;
          url.searchParams.set("verify_commit", commit);
        }
        if (response.status !== 200)
          throw new Error(`HTTP ${response.status} checking ${url.pathname}`);
        const contentType = response.headers.get("content-type") ?? "";
        if (type && !contentType.includes(type))
          throw new Error(`Unexpected content type for ${url.pathname}`);
        const bytes = Buffer.from(await response.arrayBuffer());
        hashes.set(
          new URL(resource, origin + "/").pathname,
          createHash("sha256").update(bytes).digest("hex"),
        );
        const body = bytes.toString("utf8");
        if (!body.trim()) throw new Error(`Empty resource: ${url.pathname}`);
        checked.add(url.pathname);
        return body;
      }
      const metadata = JSON.parse(await get("/build.json", "application/json"));
      if (metadata.sourceCommit !== commit)
        throw new Error(
          "Production revision has not reached EXPECTED_COMMIT yet.",
        );
      const lobby = await get("/", "text/html");
      if (!lobby.includes('id="game-list"'))
        throw new Error("Lobby marker missing.");
      const catalog = JSON.parse(await get("/games.json", "application/json"));
      if (!Array.isArray(catalog) || !catalog.length || catalog.length > 100)
        throw new Error("Invalid or empty game catalog.");
      const assets = new Set();
      function collect(html, documentUrl) {
        for (const match of html.matchAll(
          /<(?:script|link|img)\b[^>]*\b(?:src|href)=["']([^"']+)["']/gi,
        )) {
          const url = new URL(match[1], documentUrl);
          if (url.origin !== origin)
            throw new Error("Unexpected external asset origin.");
          assets.add(url.pathname);
        }
      }
      collect(lobby, origin + "/");
      for (const game of catalog) {
        if (
          !/^\/games\/[a-z0-9-]+\/.+\.html$/.test(game.url ?? "") ||
          !/^\/games\/[a-z0-9-]+\/.+/.test(game.cover ?? "") ||
          /[\\?#%]/.test(game.url + game.cover)
        )
          throw new Error("Invalid game resource paths.");
        const html = await get(game.url, "text/html");
        if (
          !/^[a-f0-9]{64}$/.test(game.entrySha256 ?? "") ||
          hashes.get(game.url) !== game.entrySha256
        ) {
          throw new Error(
            "Deployed game bytes do not match the build manifest SHA-256.",
          );
        }
        if (!/<html\b/i.test(html)) throw new Error("Invalid game HTML.");
        collect(html, origin + game.url);
        assets.add(game.cover);
      }
      // These static learning resources are part of the published portal, not games.json.
      const learningPaths = [
        "/learning/",
        "/learning/math/",
        "/learning/chinese/",
        "/learning/english/",
        "/learning/science/",
        "/learning/computing/",
        "/learning/math/report.html",
        "/learning/math/practice.html",
      ];
      for (const resource of learningPaths) {
        const html = await get(resource, "text/html");
        if (!/<html\b/i.test(html))
          throw new Error(`Invalid learning HTML: ${resource}`);
        collect(html, origin + resource);
      }
      // Follow local static ES-module imports so engine.js is checked as well as game.js.
      for (const asset of assets) {
        if (assets.size > 200)
          throw new Error("Asset verification bound exceeded.");
        const type = asset.endsWith(".js")
          ? "javascript"
          : asset.endsWith(".css")
            ? "text/css"
            : undefined;
        const text = await get(asset, type);
        if (asset.endsWith(".js")) {
          for (const match of text.matchAll(
            /\b(?:from\s*|import\s*)["'](\.[^"']+)["']/g,
          )) {
            const dependency = new URL(match[1], origin + asset);
            if (dependency.origin !== origin)
              throw new Error("Unexpected module origin.");
            assets.add(dependency.pathname);
          }
        }
      }
      return {
        origin,
        sourceCommit: commit,
        games: catalog.length,
        learningPages: learningPaths.length,
        gameHashes: catalog.map((game) => ({
          url: game.url,
          sha256: hashes.get(game.url),
        })),
        resources: checked.size,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error.message;
      const remaining = deadline - now();
      if (attempt >= maxAttempts || remaining <= 0) break;
      await sleep(Math.min(intervalMs, remaining));
    }
  }
  throw new Error(
    `Live verification did not pass within its bounded window: ${lastError}`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const result = await verifyLive({
      baseUrl: process.env.BASE_URL,
      expectedCommit: process.env.EXPECTED_COMMIT,
    });
    console.log(
      `Verified ${result.origin}: commit ${result.sourceCommit}, ${result.games} game(s), ${result.resources} resources, ${result.attempts} attempt(s).`,
    );
    for (const game of result.gameHashes)
      console.log(`Verified game ${game.url} SHA-256 ${game.sha256}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

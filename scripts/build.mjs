import { createHash } from "node:crypto";
import {
  readdir,
  readFile,
  mkdir,
  cp,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const safePath = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  !value.startsWith(".") &&
  !value.includes("\\") &&
  !path.isAbsolute(value) &&
  !value.split("/").some((p) => p === ".." || !p) &&
  !/[?#%:]/.test(value);
async function assertTree(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink())
      throw new Error(`Symlink forbidden: ${entry.name}`);
    if (
      entry.name.startsWith(".") ||
      /^(node_modules|package-lock.json|package.json)$/.test(entry.name)
    )
      throw new Error(`Private/build file in game: ${entry.name}`);
    if (entry.isDirectory()) await assertTree(path.join(directory, entry.name));
  }
}
export async function scanGames(directory) {
  const games = [],
    ids = new Set();
  for (const dir of await readdir(directory, { withFileTypes: true })) {
    if (dir.isSymbolicLink())
      throw new Error("Game directories must not be symlinks");
    if (!dir.isDirectory() || dir.name.startsWith(".")) continue;
    const base = path.join(directory, dir.name);
    const game = JSON.parse(
      await readFile(path.join(base, "game.json"), "utf8"),
    );
    if (typeof game.published !== "boolean")
      throw new Error(`published must be boolean: ${dir.name}`);
    if (!game.published) continue;
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.id) ||
      game.id !== dir.name ||
      ids.has(game.id)
    )
      throw new Error(`Invalid/duplicate id: ${game.id}`);
    for (const key of ["name", "description"])
      if (
        typeof game[key] !== "string" ||
        !game[key].trim() ||
        game[key].length > 200
      )
        throw new Error(`Invalid ${key}`);
    if (
      !Array.isArray(game.tags) ||
      game.tags.length > 5 ||
      game.tags.some((t) => typeof t !== "string" || t.length > 30)
    )
      throw new Error("Invalid tags");
    if (game.order !== undefined && !Number.isFinite(game.order))
      throw new Error("Invalid order");
    await assertTree(base);
    for (const key of ["entry", "cover"]) {
      if (!safePath(game[key])) throw new Error(`Unsafe ${key}`);
      if (!(await stat(path.join(base, game[key]))).isFile())
        throw new Error(`Missing ${key}`);
    }
    if (!/\.html$/.test(game.entry)) throw new Error("Entry must be HTML");
    const entrySha256 = createHash("sha256")
      .update(await readFile(path.join(base, game.entry)))
      .digest("hex");
    if (
      game.sourceSha256 !== undefined &&
      (!/^[a-f0-9]{64}$/.test(game.sourceSha256) ||
        game.sourceSha256 !== entrySha256)
    ) {
      throw new Error(`Original game checksum mismatch: ${game.id}`);
    }
    ids.add(game.id);
    games.push({
      id: game.id,
      entrySha256,
      name: game.name,
      description: game.description,
      tags: game.tags,
      order: game.order ?? 100,
      url: `/games/${game.id}/${game.entry}`,
      cover: `/games/${game.id}/${game.cover}`,
    });
  }
  return games.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}
export async function build(base = root) {
  const games = await scanGames(path.join(base, "games"));
  if (!games.length) throw new Error("At least one published game is required");
  const out = path.join(base, "dist");
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await cp(path.join(base, "portal"), out, { recursive: true });
  for (const game of games)
    await cp(
      path.join(base, "games", game.id),
      path.join(out, "games", game.id),
      { recursive: true },
    );
  await writeFile(
    path.join(out, "games.json"),
    JSON.stringify(games, null, 2) + "\n",
  );
  await writeFile(
    path.join(out, "_headers"),
    "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n",
  );
  const sourceCommit = /^[a-f0-9]{40}$/i.test(process.env.GITHUB_SHA ?? "")
    ? process.env.GITHUB_SHA.toLowerCase()
    : "local";
  await writeFile(
    path.join(out, "build.json"),
    JSON.stringify(
      { sourceCommit, builtAt: new Date().toISOString() },
      null,
      2,
    ) + "\n",
  );
  console.log(`Built ${games.length} game(s) into dist/`);
  return games;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await build();

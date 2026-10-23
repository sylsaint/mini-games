import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT = "mini-games";
const BRANCH = "main";
const API_ORIGIN = "https://api.cloudflare.com/client/v4";
// Cloudflare's own Wrangler recognizes 8000007 as Pages project not found:
// https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/pages/deploy.ts
const PROJECT_NOT_FOUND = 8000007;

/** Create-only bootstrap. Never adopts, edits, deletes or deploys a project. */
export async function bootstrapPages({
  accountId,
  apiToken,
  fetchImpl = fetch,
}) {
  if (!/^[a-f0-9]{32}$/i.test(accountId ?? "")) {
    throw new Error(
      "A valid CLOUDFLARE_ACCOUNT_ID repository secret is required.",
    );
  }
  if (
    typeof apiToken !== "string" ||
    !apiToken.trim() ||
    /[\r\n]/.test(apiToken)
  ) {
    throw new Error(
      "A valid CLOUDFLARE_API_TOKEN repository secret is required.",
    );
  }
  const collection = `${API_ORIGIN}/accounts/${accountId}/pages/projects`;
  const headers = {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };

  async function request(url, method, body) {
    let response;
    try {
      response = await fetchImpl(url, {
        method,
        headers,
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      // Never emit exception bodies: they can contain URLs, request headers or tokens.
      throw new Error(
        method === "POST"
          ? "Creation outcome is uncertain after a network error. Stop and inspect the project in Cloudflare before any retry."
          : "Project lookup failed. No creation attempted; check access and connectivity.",
      );
    }
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error(
        method === "POST"
          ? "Creation outcome is uncertain: invalid API response. Inspect Cloudflare before any retry."
          : "Project lookup returned invalid JSON. No creation attempted.",
      );
    }
    return { response, payload };
  }

  const lookup = await request(`${collection}/${PROJECT}`, "GET");
  if (lookup.response.ok) {
    throw new Error(
      "mini-games already exists. Refusing to adopt or overwrite it. No creation or deployment attempted.",
    );
  }
  const confirmedMissing =
    lookup.response.status === 404 &&
    lookup.payload?.success === false &&
    lookup.payload?.result === null &&
    Array.isArray(lookup.payload.errors) &&
    lookup.payload.errors.length === 1 &&
    lookup.payload.errors[0]?.code === PROJECT_NOT_FOUND;
  if (!confirmedMissing) {
    throw new Error(
      "Project absence is not confirmed (authorization, unexpected status or unknown error). No creation attempted.",
    );
  }

  // Exactly one POST. A conflict, timeout or ambiguous reply must never trigger retry.
  const created = await request(collection, "POST", {
    name: PROJECT,
    production_branch: BRANCH,
  });
  if (!created.response.ok || created.payload?.success !== true) {
    throw new Error(
      "Creation was not confirmed. Stop and inspect Cloudflare before any retry; no deployment attempted.",
    );
  }
  const project = created.payload.result;
  if (
    project?.name !== PROJECT ||
    project.production_branch !== BRANCH ||
    project.source != null ||
    !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.pages\.dev$/.test(
      project.subdomain ?? "",
    )
  ) {
    throw new Error(
      "Creation response has unexpected project properties. Inspect Cloudflare before any retry or deployment.",
    );
  }
  return { name: PROJECT, subdomain: project.subdomain };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const project = await bootstrapPages({
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
    });
    console.log(`Created Pages project: ${project.name}`);
    console.log(`Pages subdomain: ${project.subdomain}`);
    console.log(
      "Remove the one-time bootstrap workflow step before future runs.",
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

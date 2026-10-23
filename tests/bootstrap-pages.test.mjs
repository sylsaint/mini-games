import test from "node:test";
import assert from "node:assert/strict";
import { bootstrapPages } from "../scripts/bootstrap-pages.mjs";

const accountId = "0123456789abcdef0123456789abcdef";
const apiToken = "test-only-fake-token-never-valid";
const missing = {
  result: null,
  success: false,
  errors: [{ code: 8000007, message: "Project not found" }],
};
const created = {
  success: true,
  result: {
    name: "mini-games",
    production_branch: "main",
    subdomain: "mini-games-abc.pages.dev",
    source: null,
  },
};
const reply = (status, payload) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => payload,
});
function harness(sequence) {
  const calls = [];
  return {
    calls,
    options: {
      accountId,
      apiToken,
      fetchImpl: async (url, options) => {
        calls.push({ url, ...options });
        const next = sequence.shift();
        assert.ok(next, "Unexpected extra request/retry");
        if (next instanceof Error) throw next;
        return next;
      },
    },
  };
}
test("confirmed missing creates exactly one named Direct Upload project", async () => {
  const { calls, options } = harness([
    reply(404, missing),
    reply(200, created),
  ]);
  assert.deepEqual(await bootstrapPages(options), {
    name: "mini-games",
    subdomain: "mini-games-abc.pages.dev",
  });
  assert.equal(calls.length, 2);
  assert.equal(
    calls[0].url,
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/mini-games`,
  );
  assert.equal(calls[0].method, "GET");
  assert.equal(
    calls[1].url,
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`,
  );
  assert.equal(calls[1].method, "POST");
  assert.equal(calls[1].redirect, "error");
  assert.deepEqual(JSON.parse(calls[1].body), {
    name: "mini-games",
    production_branch: "main",
  });
});
test("existing project refuses adoption or deployment", async () => {
  const { calls, options } = harness([reply(200, created)]);
  await assert.rejects(bootstrapPages(options), /already exists/);
  assert.equal(calls.length, 1);
});
for (const status of [401, 403, 500]) {
  test(`HTTP ${status} does not create even with a misleading not-found code`, async () => {
    const { calls, options } = harness([reply(status, missing)]);
    await assert.rejects(bootstrapPages(options), /absence is not confirmed/);
    assert.equal(calls.length, 1);
  });
}
for (const payload of [
  null,
  { success: false, result: null, errors: [{ code: 10000 }] },
  { ...missing, errors: [...missing.errors, { code: 10000 }] },
  { ...missing, success: true },
]) {
  test("unknown or ambiguous 404 refuses creation", async () => {
    const { calls, options } = harness([reply(404, payload)]);
    await assert.rejects(bootstrapPages(options), /absence is not confirmed/);
    assert.equal(calls.length, 1);
  });
}
test("lookup network failure never retries or exposes raw error", async () => {
  const { calls, options } = harness([new Error(apiToken)]);
  await assert.rejects(
    bootstrapPages(options),
    (error) =>
      !error.message.includes(apiToken) && /lookup failed/.test(error.message),
  );
  assert.equal(calls.length, 1);
});
test("uncertain creation network outcome never retries", async () => {
  const { calls, options } = harness([
    reply(404, missing),
    new Error(apiToken),
  ]);
  await assert.rejects(
    bootstrapPages(options),
    (error) =>
      !error.message.includes(apiToken) &&
      /outcome is uncertain/.test(error.message),
  );
  assert.equal(calls.length, 2);
});
test("creation conflict and server errors stop without adoption", async () => {
  for (const status of [409, 500]) {
    const { calls, options } = harness([
      reply(404, missing),
      reply(status, { success: false }),
    ]);
    await assert.rejects(bootstrapPages(options), /Creation was not confirmed/);
    assert.equal(calls.length, 2);
  }
});
test("malformed creation response stops without retry", async () => {
  const { calls, options } = harness([
    reply(404, missing),
    {
      ok: true,
      status: 200,
      json: async () => {
        throw Error(apiToken);
      },
    },
  ]);
  await assert.rejects(bootstrapPages(options), /outcome is uncertain/);
  assert.equal(calls.length, 2);
});
test("unexpected project/source/subdomain refuses success", async () => {
  for (const result of [
    { ...created.result, name: "another-project" },
    { ...created.result, source: { type: "github" } },
    { ...created.result, subdomain: "attacker.example" },
  ]) {
    const { calls, options } = harness([
      reply(404, missing),
      reply(200, { success: true, result }),
    ]);
    await assert.rejects(
      bootstrapPages(options),
      /unexpected project properties/,
    );
    assert.equal(calls.length, 2);
  }
});
test("invalid credentials are rejected before a request", async () => {
  const { calls, options } = harness([]);
  await assert.rejects(
    bootstrapPages({ ...options, accountId: "../other" }),
    /valid CLOUDFLARE_ACCOUNT_ID/,
  );
  await assert.rejects(
    bootstrapPages({ ...options, apiToken: "" }),
    /valid CLOUDFLARE_API_TOKEN/,
  );
  assert.equal(calls.length, 0);
});

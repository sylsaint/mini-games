import { createHash } from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import { verifyLive } from "../scripts/verify-live.mjs";
const commit = "a".repeat(40);
// A test-only Pages-shaped origin. All requests below are mocked; never fetched.
const baseUrl = "https://example-test.pages.dev";
const files = {
  "/build.json": ["application/json", JSON.stringify({ sourceCommit: commit })],
  "/": [
    "text/html",
    '<html><div id="game-list"></div><script src="/app.js"></script><link rel="stylesheet" href="/style.css"></html>',
  ],
  "/games.json": [
    "application/json",
    JSON.stringify([
      {
        url: "/games/test/index.html",
        cover: "/games/test/cover.svg",
        entrySha256: createHash("sha256")
          .update('<html><script src="./game.js"></script></html>')
          .digest("hex"),
      },
    ]),
  ],
  "/games/test/index.html": [
    "text/html",
    '<html><script src="./game.js"></script></html>',
  ],
  "/app.js": ["application/javascript", "const app = true;"],
  "/style.css": ["text/css", "body{margin:0}"],
  "/games/test/game.js": [
    "application/javascript",
    'import { value } from "./engine.js";',
  ],
  "/games/test/engine.js": ["application/javascript", "export const value=24;"],
  "/games/test/cover.svg": ["image/svg+xml", "<svg/>"],
};
function mock(overrides = {}) {
  const calls = [];
  return {
    calls,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      const [type, body, status = 200] = overrides[new URL(url).pathname] ??
        files[new URL(url).pathname] ?? ["text/plain", "Not found", 404];
      return {
        status,
        headers: new Headers({ "content-type": type }),
        text: async () => body,
        arrayBuffer: async () => Buffer.from(body),
      };
    },
  };
}
test("live verifier checks revision, lobby, catalog, game, cover and module assets", async () => {
  const { calls, fetchImpl } = mock();
  const result = await verifyLive({
    baseUrl,
    expectedCommit: commit,
    fetchImpl,
  });
  assert.equal(result.resources, 9);
  assert.equal(result.games, 1);
  assert.ok(
    calls.some(
      (call) => new URL(call.url).pathname === "/games/test/engine.js",
    ),
  );
  assert.ok(
    calls.every(
      (call) =>
        call.options.method === "GET" &&
        call.options.redirect === "manual" &&
        !call.options.headers.Authorization,
    ),
  );
});
test("stale revision fails within bounded attempts", async () => {
  const { calls, fetchImpl } = mock({
    "/build.json": [
      "application/json",
      JSON.stringify({ sourceCommit: "b".repeat(40) }),
    ],
  });
  let clock = 0;
  await assert.rejects(
    verifyLive({
      baseUrl,
      expectedCommit: commit,
      fetchImpl,
      timeoutMs: 10,
      intervalMs: 5,
      now: () => clock,
      sleep: async (ms) => {
        clock += ms;
      },
    }),
    /revision/,
  );
  assert.equal(calls.length, 2);
});
test("propagation retry can succeed without creating or modifying anything", async () => {
  const normal = mock();
  let calls = 0,
    clock = 0;
  const fetchImpl = async (...args) => {
    calls++;
    if (calls === 1)
      return {
        status: 503,
        headers: new Headers(),
        text: async () => "unavailable",
      };
    return normal.fetchImpl(...args);
  };
  const result = await verifyLive({
    baseUrl,
    expectedCommit: commit,
    fetchImpl,
    timeoutMs: 10,
    intervalMs: 5,
    now: () => clock,
    sleep: async (ms) => {
      clock += ms;
    },
  });
  assert.equal(result.attempts, 2);
});
test("missing assets and wrong content types fail", async () => {
  for (const overrides of [
    { "/games/test/engine.js": ["text/plain", "Not found", 404] },
    { "/games.json": ["text/html", "<html>not a catalog</html>"] },
  ]) {
    await assert.rejects(
      verifyLive({
        baseUrl,
        expectedCommit: commit,
        fetchImpl: mock(overrides).fetchImpl,
        timeoutMs: 1,
        intervalMs: 5,
      }),
      /did not pass/,
    );
  }
});
test("external assets and credential-shaped URLs are rejected", async () => {
  for (const url of [
    "http://example-test.pages.dev",
    "https://other.example",
    "https://user:pass@example-test.pages.dev",
    "https://example-test.pages.dev/?token=value",
  ]) {
    await assert.rejects(
      verifyLive({
        baseUrl: url,
        expectedCommit: commit,
        fetchImpl: async () => {
          throw Error("must not fetch");
        },
      }),
      /BASE_URL/,
    );
  }
  const { fetchImpl } = mock({
    "/": [
      "text/html",
      '<html><div id="game-list"></div><script src="https://other.example/a.js"></script></html>',
    ],
  });
  await assert.rejects(
    verifyLive({
      baseUrl,
      expectedCommit: commit,
      fetchImpl,
      timeoutMs: 1,
      intervalMs: 5,
    }),
    /did not pass/,
  );
});

test("same-origin Pages HTML canonical redirects are followed safely", async () => {
  const normal = mock();
  const fetchImpl = async (url, options) => {
    if (new URL(url).pathname === "/games/test/index.html")
      return {
        status: 308,
        headers: new Headers({ location: "/games/test/" }),
      };
    if (new URL(url).pathname === "/games/test/")
      return {
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        text: async () => files["/games/test/index.html"][1],
        arrayBuffer: async () =>
          Buffer.from(files["/games/test/index.html"][1]),
      };
    return normal.fetchImpl(url, options);
  };
  assert.equal(
    (await verifyLive({ baseUrl, expectedCommit: commit, fetchImpl })).games,
    1,
  );
});

test("cross-origin redirects never trigger an external request", async () => {
  const calls = [];
  await assert.rejects(
    verifyLive({
      baseUrl,
      expectedCommit: commit,
      timeoutMs: 1,
      intervalMs: 5,
      fetchImpl: async (url) => {
        calls.push(url);
        return {
          status: 302,
          headers: new Headers({ location: "https://other.example/" }),
        };
      },
    }),
    /unexpected origin/,
  );
  assert.equal(calls.length, 1);
});

test("live verification rejects changed original HTML bytes", async () => {
  const { fetchImpl } = mock({
    "/games/test/index.html": ["text/html", "<html>substituted game</html>"],
  });
  await assert.rejects(
    verifyLive({
      baseUrl,
      expectedCommit: commit,
      fetchImpl,
      timeoutMs: 100,
      intervalMs: 100,
    }),
    /SHA-256/,
  );
});

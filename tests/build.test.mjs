import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  rm,
  readFile,
  symlink,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { scanGames, build, root } from "../scripts/build.mjs";
async function fixture(t, overrides = {}) {
  const base = await mkdtemp(path.join(os.tmpdir(), "mini-games-test-"));
  t.after(() => rm(base, { recursive: true, force: true }));
  const dir = path.join(base, "sample");
  await mkdir(dir);
  await writeFile(
    path.join(dir, "game.json"),
    JSON.stringify({
      id: "sample",
      name: "Sample",
      description: "A game",
      entry: "index.html",
      cover: "cover.svg",
      published: true,
      tags: [],
      ...overrides,
    }),
  );
  await writeFile(path.join(dir, "index.html"), "<!doctype html>");
  await writeFile(path.join(dir, "cover.svg"), "<svg/>");
  return { base, dir };
}
test("build creates registered catalog and independent game resource", async () => {
  const games = await build();
  assert.equal(games[0].id, "twenty-four");
  assert.match(
    await readFile(
      path.join(root, "dist/games/twenty-four/index.html"),
      "utf8",
    ),
    /24 点实验室/,
  );
});
test("valid new game automatically registers", async (t) => {
  const { base } = await fixture(t);
  assert.equal((await scanGames(base))[0].url, "/games/sample/index.html");
});
test("unpublished game excluded", async (t) => {
  const { base } = await fixture(t, { published: false });
  assert.deepEqual(await scanGames(base), []);
});
test("path traversal rejected", async (t) => {
  const { base } = await fixture(t, { entry: "../secret.html" });
  await assert.rejects(scanGames(base), /Unsafe entry/);
});
test("missing entry rejected", async (t) => {
  const { base } = await fixture(t, { entry: "missing.html" });
  await assert.rejects(scanGames(base));
});
test("mismatched ID rejected", async (t) => {
  const { base } = await fixture(t, { id: "other" });
  await assert.rejects(scanGames(base), /Invalid/);
});
test("symlinks rejected", async (t) => {
  const { base, dir } = await fixture(t);
  await symlink("/tmp", path.join(dir, "escape"));
  await assert.rejects(scanGames(base), /Symlink/);
});
test("credential-shaped hidden files rejected", async (t) => {
  const { base, dir } = await fixture(t);
  await writeFile(path.join(dir, ".env"), "secret");
  await assert.rejects(scanGames(base), /Private/);
});

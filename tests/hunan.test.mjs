import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const base = new URL("../portal/travel/hunan/", import.meta.url);
test("Hunan progressive source has bounded shell and complete content", async () => {
  const html = await readFile(new URL("index.html", base), "utf8");
  const raw = await readFile(new URL("data/guide.json", base), "utf8");
  const data = JSON.parse(raw);
  assert.ok(Buffer.byteLength(html) < 25000);
  assert.ok(Buffer.byteLength(raw) < 70000);
  assert.ok(!html.includes(";base64,"));
  assert.equal(data.stations.length, 7);
  assert.equal(data.people.length, 16);
  assert.equal(data.poems.length, 7);
  assert.equal(data.stations.flatMap((s) => s.quiz).length, 14);
  assert.equal(data.photos.length, 9);
  for (const photo of data.photos) {
    assert.match(photo.src, /^\.\/assets\/[a-f0-9]{16}\.jpg$/);
    const bytes = await readFile(new URL(photo.src, base));
    assert.ok(
      photo.src.includes(
        createHash("sha256").update(bytes).digest("hex").slice(0, 16),
      ),
    );
    assert.ok(photo.license && photo.sourceUrl && photo.author);
  }
});

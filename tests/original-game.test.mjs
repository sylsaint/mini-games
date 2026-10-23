import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const source = await readFile(
  new URL("../games/twenty-four/index.html", import.meta.url),
);
const html = source.toString("utf8");
const SOURCE_SHA =
  "8251778d3900e59886ceae173a4d30e157fef336150256177c6a35739d1bbc86";
const bank = JSON.parse(html.match(/const BANK=(.*);/)[1]);
const gcd = (a, b) => (b ? gcd(b, a % b) : a < 0n ? -a : a);
function rational(n, d = 1n) {
  assert.notEqual(d, 0n, "Reference solution divides by zero");
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const factor = gcd(n, d);
  return [n / factor, d / factor];
}
function evaluate(tree, leaves) {
  if (Number.isInteger(tree)) {
    leaves.push(tree);
    return [BigInt(tree), 1n];
  }
  assert.ok(Array.isArray(tree) && tree.length === 3);
  const [op, left, right] = tree,
    [a, b] = evaluate(left, leaves),
    [c, d] = evaluate(right, leaves);
  if (op === "+") return rational(a * d + c * b, b * d);
  if (op === "-") return rational(a * d - c * b, b * d);
  if (op === "*") return rational(a * c, b * d);
  assert.equal(op, "/");
  return rational(a * d, b * c);
}
test("imported original version 3 preserves its exact bytes", () => {
  assert.equal(source.length, 164499);
  assert.equal(createHash("sha256").update(source).digest("hex"), SOURCE_SHA);
});
test("original bank has 50 levels, 500 distinct puzzles and 1658 valid solutions", () => {
  assert.equal(bank.length, 50);
  const seen = new Set();
  let solutions = 0;
  for (const level of bank) {
    assert.equal(level.length, 10);
    for (const puzzle of level) {
      const expected = [...puzzle.nums].sort((a, b) => a - b);
      assert.equal(expected.length, 4);
      assert.ok(
        expected.every((n) => Number.isInteger(n) && n >= 1 && n <= 13),
      );
      seen.add(expected.join(","));
      assert.ok(puzzle.solutions.length > 0);
      for (const tree of puzzle.solutions) {
        const leaves = [];
        assert.deepEqual(evaluate(tree, leaves), [24n, 1n]);
        assert.deepEqual(
          leaves.sort((a, b) => a - b),
          expected,
        );
        solutions++;
      }
    }
  }
  assert.equal(seen.size, 500);
  assert.equal(solutions, 1658);
});
test("original is self-contained and does not contain external network endpoints", () => {
  assert.doesNotMatch(
    html,
    /<(?:script|link|img|iframe|audio|video)\b[^>]*\b(?:src|href)=["'](?:https?:)?\/\//i,
  );
  assert.doesNotMatch(
    html,
    /\b(?:fetch\s*\(|XMLHttpRequest|sendBeacon|serviceWorker)\b/,
  );
  assert.doesNotMatch(html, /https?:\/\//i);
  assert.match(html, /AudioContext/);
  assert.match(html, /localStorage/);
});

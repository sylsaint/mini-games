import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  answerKey,
  completion,
  errorHint,
  examKey,
  grade,
  isCorrect,
  newProgress,
  paperIds,
  validProgress,
} from "../src/multiplication/exam.js";

const bank = JSON.parse(
  readFileSync(new URL("../src/multiplication/bank.json", import.meta.url)),
);
const independentNumeric = {
  a01: [70 * 300],
  a03: [30 * 20, 4 * 6],
  a04: [236 * 4, 236 * 30, 236 * 34],
  a05: [307 * 26],
  a06: [460 * 30],
  a09: [6789 * 24],
  a10: [123 * 9 + 4, 1234 * 9 + 5],
  a11: [24 * 36, 24 * 36 - 850],
  a12: [104 * 28 - 37],
  a13: [21 * 48],
  a14: [26 * 32 + 18],
  a15: [38 * 24 - 46 * 19],
  b03: [64 * 28, 64 * 28 - 640],
  b04: [2, 326 * 20, 326 * 27],
  b05: [408 * 57],
  b07: [32 * 97, 32 * 103],
  b08: [2 * 27, 198 * 27],
  b09: [37648 * 29],
  b10: [9999 * 9],
  b11: [28 * 36 - 4 * 6, 990 - (28 * 36 - 4 * 6)],
  b12: [Math.ceil(2150 / 18)],
  b13: [Math.ceil(680 / 36)],
  b14: [8, Math.max(850 * 2, 820 * 5, 520 * 8)],
  b15: [Math.ceil((128 * 27 + 96 * 18 - 5000) / 96), 128 * 27 + 96 * 16],
};

test("two separate 15-question papers each cover five domains and score exactly 100", () => {
  const seen = new Set();
  for (const id of paperIds) {
    const list = bank[id];
    assert.equal(list.length, 15);
    assert.equal(new Set(list.map((q) => q.tag)).size, 5);
    assert.equal(
      list.reduce((sum, q) => sum + q.points, 0),
      100,
    );
    assert.equal(list.filter((q) => q.visual === "calc").length, 1);
    const perfect = {};
    for (const q of list) {
      assert.ok(!seen.has(q.id));
      seen.add(q.id);
      assert.equal(q.points % q.parts.length, 0);
      assert.deepEqual(
        q.parts.filter((p) => !p.opts).map((p) => p.key),
        independentNumeric[q.id] || [],
      );
      q.parts.forEach((p, j) => {
        if (p.opts) {
          assert.equal(p.opts.filter((option) => option === p.key).length, 1);
          for (const option of p.opts.filter((x) => x !== p.key))
            assert.ok(errorHint(p, option));
        }
        assert.ok(p.why);
        perfect[answerKey(q, j)] = String(p.key);
      });
    }
    const result = grade(list, perfect);
    assert.equal(result.score, 100);
    assert.equal(result.needsReview, 0);
    assert.equal(result.incomplete, 0);
    assert.equal(grade(list, {}).score, 0);
  }
});

test("partial scoring identifies wrong place value without exposing it in completion", () => {
  const q = bank.A[3],
    values = { "a04-0": "９４４", "a04-1": "708", "a04-2": "8,024" };
  assert.equal(completion(q, values), "part");
  assert.equal(grade([q], values).score, 4);
  assert.match(errorHint(q.parts[1], "708"), /十位/);
  assert.equal(errorHint(q.parts[1], "constructor"), "");
  assert.equal(isCorrect(q.parts[2], "8 024"), true);
  assert.equal(isCorrect(q.parts[2], "8,02,4"), false);
  assert.equal(isCorrect(q.parts[2], "8024 人"), false);
});

test("local save has independent papers and rejects malformed indexes and cross-paper keys", () => {
  const progress = newProgress();
  assert.match(examKey, /integer-multiplication/);
  progress.A.answers["a04-0"] = "944";
  assert.equal(validProgress(progress), true);
  assert.deepEqual(progress.B.answers, {});
  progress.B.answers["a01-0"] = "21000";
  assert.equal(validProgress(progress), false);
  delete progress.B.answers["a01-0"];
  progress.A.index = 15;
  assert.equal(validProgress(progress), false);
});

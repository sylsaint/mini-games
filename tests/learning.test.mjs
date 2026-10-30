import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateRecord } from "../portal/learning/learning.js";
const base = {
  title: "第二单元",
  date: "2026-10-30",
  score: "82",
  total: "100",
  reflection: "先画图",
};
test("exam record validates date, score range and required fields", () => {
  assert.deepEqual(validateRecord(base).record, {
    ...base,
    score: 82,
    total: 100,
  });
  for (const patch of [
    { title: "" },
    { date: "2026-02-30" },
    { score: "" },
    { total: "" },
    { score: -1 },
    { score: 101 },
    { total: 0 },
    { total: "Infinity" },
    { reflection: "a".repeat(1001) },
  ])
    assert.ok(
      validateRecord({ ...base, ...patch }).error,
      JSON.stringify(patch),
    );
  assert.equal(validateRecord({ ...base, score: 0 }).record.score, 0);
});
test("all five subject pages offer local exam record form and navigation", async () => {
  for (const subject of [
    "math",
    "chinese",
    "english",
    "science",
    "computing",
  ]) {
    const html = await readFile(
      new URL(`../portal/learning/${subject}/index.html`, import.meta.url),
      "utf8",
    );
    assert.match(html, /id="record-form"/);
    assert.match(html, /href="\/learning\/"/);
    assert.match(html, /不会上传/);
  }
});
test("learning hub exists without modifying original game catalog", async () => {
  const html = await readFile(
    new URL("../portal/index.html", import.meta.url),
    "utf8",
  );
  assert.match(html, /class="learning-entry"/);
  const hub = await readFile(
    new URL("../portal/learning/index.html", import.meta.url),
    "utf8",
  );
  assert.equal((hub.match(/class="subject-card"/g) || []).length, 5);
});

test("backup import validates subject and every record, merges exact duplicates safely", async () => {
  const { validateBackup } = await import("../portal/learning/learning.js");
  const record = validateRecord(base).record;
  const backup = {
    format: "yoyo-learning-records",
    version: 1,
    subject: "math",
    records: [record, record],
  };
  assert.deepEqual(validateBackup(backup, "math", []), {
    additions: [record],
    duplicates: 1,
  });
  assert.deepEqual(validateBackup(backup, "math", [record]), {
    additions: [],
    duplicates: 2,
  });
  assert.ok(validateBackup(backup, "english").error);
  assert.ok(validateBackup({ ...backup, version: 2 }, "math").error);
  assert.ok(
    validateBackup(
      { ...backup, records: [record, { ...record, score: 999 }] },
      "math",
    ).error,
  );
  assert.ok(
    validateBackup({ ...backup, records: Array(501).fill(record) }, "math")
      .error,
  );
});

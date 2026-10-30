import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const report = readFileSync(
  new URL("../portal/learning/chinese/report.html", import.meta.url),
  "utf8",
);
const code = report.match(/<script>([\s\S]*?)<\/script>/)[1];
const KEY = "yoyo-chinese-report-v1";
function harness(raw = null, fail = false) {
  const storage = new Map(raw === null ? [] : [[KEY, raw]]);
  const make = (dataset = {}) => ({
    dataset,
    textContent: "",
    value: "",
    checked: false,
    listeners: {},
    addEventListener(name, handler) {
      this.listeners[name] = handler;
    },
    click() {
      this.clicked = true;
    },
  });
  const days = Array.from({ length: 14 }, (_, i) => make({ day: String(i) }));
  const answers = Array.from({ length: 5 }, (_, i) =>
    make({ save: `answer-${i}` }),
  );
  const nodes = new Map(
    [
      "#save-status",
      "#plan-count",
      "#plan-progress",
      "#print-report",
      "#export-notes",
    ].map((id) => [id, make()]),
  );
  let printCount = 0;
  const context = {
    document: {
      querySelector: (s) => nodes.get(s),
      querySelectorAll: (s) => (s === "[data-day]" ? days : answers),
      createElement: () => make(),
    },
    localStorage: {
      getItem: (k) => {
        if (fail) throw Error("denied");
        return storage.get(k) ?? null;
      },
      setItem: (k, v) => {
        if (fail) throw Error("denied");
        storage.set(k, v);
      },
    },
    window: {
      print() {
        printCount++;
      },
    },
    Blob,
    URL,
    setTimeout(fn) {
      fn();
    },
  };
  vm.runInNewContext(code, context);
  return { days, answers, nodes, storage, printCount: () => printCount };
}
test("Chinese report has clear evidence categories, 14-day plan and five original diagnostics", () => {
  for (const text of [
    "82",
    "100",
    "不清",
    "作文",
    "反问",
    "字音",
    "原始试卷照片",
    "14 天",
    "优先",
  ])
    assert.ok(report.includes(text), text);
  assert.equal((report.match(/data-day="\d+"/g) || []).length, 14);
  assert.equal((report.match(/data-save="answer-\d"/g) || []).length, 5);
  assert.match(report, /不是自动评分/);
  assert.match(report, /不提供导入恢复/);
  assert.doesNotMatch(
    report,
    /<(?:script|link|img)[^>]+(?:src|href)=["']https?:/i,
  );
});
test("Chinese report state is isolated, editable and restored with deduplicated safe values", () => {
  const h = harness(
    JSON.stringify({
      version: 1,
      days: [0, 0, -1, 14, 3, "4"],
      answers: {
        "answer-0": "<img src=x>",
        "answer-1": "a".repeat(3500),
        bad: "discard",
      },
    }),
  );
  assert.equal(h.nodes.get("#plan-count").textContent, "2/14 天");
  assert.equal(h.answers[0].value, "<img src=x>");
  assert.equal(h.answers[1].value.length, 3000);
  h.days[0].checked = false;
  h.days[0].listeners.change();
  h.days[13].checked = true;
  h.days[13].listeners.change();
  h.answers[2].value = "先找依据，再解释。";
  h.answers[2].listeners.input();
  const saved = JSON.parse(h.storage.get(KEY));
  assert.deepEqual(saved.days, [3, 13]);
  assert.equal(saved.answers["answer-2"], "先找依据，再解释。");
  assert.equal(saved.answers.bad, undefined);
  assert.equal(h.storage.size, 1);
  const restored = harness(h.storage.get(KEY));
  assert.equal(restored.days[13].checked, true);
  assert.equal(restored.answers[2].value, "先找依据，再解释。");
});
test("Chinese report remains usable when storage is corrupt or unavailable", () => {
  for (const raw of [
    "{bad",
    "null",
    "[]",
    JSON.stringify({ version: 999, days: [], answers: {} }),
  ]) {
    const h = harness(raw);
    assert.match(h.nodes.get("#save-status").textContent, /损坏/);
    h.days[2].checked = true;
    h.days[2].listeners.change();
    assert.equal(h.nodes.get("#plan-count").textContent, "1/14 天");
  }
  const h = harness(null, true);
  h.days[1].checked = true;
  h.days[1].listeners.change();
  assert.equal(h.nodes.get("#plan-count").textContent, "1/14 天");
  assert.match(h.nodes.get("#save-status").textContent, /无法保存/);
  assert.doesNotThrow(() => h.nodes.get("#export-notes").listeners.click());
  h.nodes.get("#print-report").listeners.click();
  assert.equal(h.printCount(), 1);
});
test("Chinese subject and hub link to analysis and practice without changing original game catalog", () => {
  const subject = readFileSync(
    new URL("../portal/learning/chinese/index.html", import.meta.url),
    "utf8",
  );
  const hub = readFileSync(
    new URL("../portal/learning/index.html", import.meta.url),
    "utf8",
  );
  assert.match(subject, /href="\/learning\/chinese\/report.html"/);
  assert.match(subject, /href="\/learning\/chinese\/practice.html"/);
  assert.doesNotMatch(subject, /目前还没有语文考试分析|我会算角度了/);
  assert.match(hub, /语文闯关已开启/);
  assert.match(report, /href="\/learning\/"/);
  assert.match(report, /min-width: ?0/);
});

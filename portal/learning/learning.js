const SUBJECTS = {
  math: {
    name: "数学",
    tip: "复盘三步：圈出已知与问题 → 画简图或列式 → 用一句话解释依据。挑一道相似但数字或方向不同的题，再试一次。",
  },
  chinese: {
    name: "语文",
    tip: "复盘三步：找到原文依据 → 对照题目要求 → 用完整句子重答。字词问题可分成音、形、义，隔一天再回想。",
  },
  english: {
    name: "英语",
    tip: "复盘三步：读出完整句子 → 找到关键词和句式 → 换一个生活情境造句。词汇不要只背中文意思，也要放进句子中使用。",
  },
  science: {
    name: "科学",
    tip: "复盘三步：写出问题 → 区分观察结果与自己的猜想 → 找证据解释。实验题先想清楚哪些条件改变、哪些条件保持不变。",
  },
  computing: {
    name: "计算机",
    tip: "复盘三步：说清目标 → 拆成小步骤 → 用一个具体例子逐步检查。记录出错的一步，并换一组输入再验证。",
  },
};
export function validateRecord(raw) {
  if (!raw || typeof raw !== "object") return { error: "记录格式不正确。" };
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const date = typeof raw.date === "string" ? raw.date : "";
  const reflection =
    typeof raw.reflection === "string" ? raw.reflection.trim() : "";
  if (!title || title.length > 80)
    return { error: "请填写 1～80 字的考试名称。" };
  const parsed = new Date(date + "T00:00:00Z");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date ||
    +date.slice(0, 4) < 1900
  )
    return { error: "请选择有效的考试日期。" };
  if (
    raw.score === "" ||
    raw.total === "" ||
    raw.score == null ||
    raw.total == null
  )
    return { error: "请填写分数和满分。" };
  const numeric = (value) =>
    typeof value === "number" ||
    (typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value));
  if (!numeric(raw.score) || !numeric(raw.total))
    return { error: "分数和满分必须是有效数字。" };
  if (raw.reflection !== undefined && typeof raw.reflection !== "string")
    return { error: "复盘内容必须是文字。" };
  const score = Number(raw.score),
    total = Number(raw.total);
  if (
    !Number.isFinite(score) ||
    !Number.isFinite(total) ||
    score < 0 ||
    total < 1 ||
    total > 10000 ||
    score > total
  )
    return { error: "分数应在 0 和满分之间；满分应为 1～10000。" };
  if (reflection.length > 1000)
    return { error: "复盘内容请控制在 1000 字以内。" };
  return { record: { title, date, score, total, reflection } };
}
export function validateBackup(data, subject, existing = []) {
  if (
    !data ||
    data.format !== "yoyo-learning-records" ||
    data.version !== 1 ||
    data.subject !== subject ||
    !Array.isArray(data.records)
  )
    return { error: "请选择当前学科的有效备份（版本 1）。" };
  if (data.records.length > 500)
    return { error: "单份备份最多包含 500 条记录。" };
  const seen = new Set(existing.map((record) => JSON.stringify(record)));
  const additions = [];
  let duplicates = 0;
  for (const item of data.records) {
    const { record, error } = validateRecord(item);
    if (error) return { error: "备份包含无效记录，未导入任何内容：" + error };
    const signature = JSON.stringify(record);
    if (seen.has(signature)) duplicates++;
    else {
      seen.add(signature);
      additions.push(record);
    }
  }
  if (existing.length + additions.length > 500)
    return { error: "合并后会超过 500 条记录，未导入任何内容。" };
  return { additions, duplicates };
}
if (typeof document !== "undefined") init();
function init() {
  const subject = document.body.dataset.subject;
  if (!SUBJECTS[subject]) return;
  const list = document.querySelector("#record-list");
  const status = document.querySelector("#storage-status");
  const form = document.querySelector("#record-form");
  const feedback = document.querySelector("#form-status");
  const key = `yoyo.learning.records.v1.${subject}`;
  let records = [],
    canStore = true;
  function warn(message) {
    status.hidden = false;
    status.textContent = message;
  }
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length > 500)
        throw new Error("Invalid storage");
      records = parsed
        .map((item) => validateRecord(item).record)
        .filter(Boolean);
      if (records.length !== parsed.length)
        warn(
          "部分本机记录格式异常，已跳过。新记录仍可保存，请及时导出有效记录。",
        );
    }
  } catch {
    canStore = false;
    warn(
      "当前浏览器无法读取或保存记录。本次仍可临时记录，请在离开页面前导出；刷新后可能丢失。",
    );
  }
  function save() {
    if (!canStore) return;
    try {
      localStorage.setItem(key, JSON.stringify(records));
    } catch {
      canStore = false;
      warn(
        "浏览器存储不可用或空间不足。本次记录仅临时保留，请立即导出备份，刷新后可能丢失。",
      );
    }
  }
  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function render() {
    list.replaceChildren();
    if (subject === "math") {
      const source = node("article", undefined, "record");
      const left = node("div");
      left.append(
        node("h3", "第二单元学业质量测评 · 已收录分析"),
        node("p", "报告生成：2026-10-30 · 考试日期未提供", "record-date"),
      );
      const score = node("div", "82", "record-score");
      score.append(node("small", " / 100"));
      source.append(
        left,
        score,
        node(
          "p",
          "成绩来自提供的分析报告。单次成绩只是一条观察记录，不能代表固定能力。",
          "record-reflection",
        ),
      );
      list.append(source);
    }
    for (const record of [...records].reverse()) {
      const article = node("article", undefined, "record");
      const left = node("div");
      left.append(
        node("h3", record.title),
        node("p", `考试日期：${record.date} · 仅存于本机`, "record-date"),
      );
      const score = node("div", String(record.score), "record-score");
      score.append(node("small", ` / ${record.total}`));
      article.append(left, score);
      if (record.reflection)
        article.append(node("p", record.reflection, "record-reflection"));
      list.append(article);
    }
    if (!records.length)
      list.append(
        node(
          "p",
          subject === "math"
            ? "还没有新增的本机记录。下一次考试后，回来记录新的发现吧。"
            : "还没有考试记录。先留下第一份发现，慢慢看见自己的变化。",
          "empty-records",
        ),
      );
    document.querySelector("#export-records").disabled = records.length === 0;
  }
  const suggestion = node("aside", undefined, "note");
  suggestion.append(
    node("strong", "复盘小工具（通用方法，不是自动诊断）："),
    node("span", SUBJECTS[subject].tip),
  );
  form.before(suggestion);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(form));
    const result = validateRecord(raw);
    feedback.className = result.error ? "error" : "";
    if (result.error) {
      feedback.textContent = result.error;
      return;
    }
    if (records.length >= 500) {
      feedback.className = "error";
      feedback.textContent = "本机记录已达 500 条，请先导出备份。";
      return;
    }
    records.push(result.record);
    save();
    render();
    form.reset();
    feedback.textContent = canStore
      ? "已保存到当前浏览器。给愿意复盘的自己一个赞！"
      : "已临时记录，请导出备份后再离开。";
  });
  document.querySelector("#export-records").addEventListener("click", () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            format: "yoyo-learning-records",
            version: 1,
            subject,
            exportedAt: new Date().toISOString(),
            records,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = node("a");
    link.href = url;
    link.download = `悠悠-${SUBJECTS[subject].name}-考试记录.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  });
  const importer = document.querySelector("#import-records");
  const preview = document.querySelector("#import-preview");
  const importStatus = document.querySelector("#import-status");
  let pendingBackup = null,
    importSequence = 0;
  importer.addEventListener("change", async () => {
    const sequence = ++importSequence;
    pendingBackup = null;
    preview.hidden = true;
    importStatus.textContent = "";
    const file = importer.files[0];
    importer.value = "";
    if (!file) return;
    if (file.size > 1024 * 1024) {
      importStatus.textContent = "备份文件不能超过 1 MB。";
      return;
    }
    try {
      const data = JSON.parse(await file.text());
      if (sequence !== importSequence) return;
      const result = validateBackup(data, subject, records);
      if (result.error) {
        importStatus.textContent = result.error;
        return;
      }
      if (!result.additions.length) {
        importStatus.textContent = `没有新记录可导入，已跳过 ${result.duplicates} 条重复记录。`;
        return;
      }
      pendingBackup = data;
      document.querySelector("#import-summary").textContent =
        `将新增 ${result.additions.length} 条记录，跳过 ${result.duplicates} 条重复记录。现有记录与公开报告不会被替换。确认后仅保存在当前浏览器。`;
      preview.hidden = false;
    } catch {
      if (sequence === importSequence)
        importStatus.textContent =
          "无法读取备份，请选择有效的 JSON 文件。没有修改现有记录。";
    }
  });
  document.querySelector("#cancel-import").addEventListener("click", () => {
    ++importSequence;
    pendingBackup = null;
    preview.hidden = true;
    importStatus.textContent = "已取消，现有记录保持不变。";
  });
  document.querySelector("#confirm-import").addEventListener("click", () => {
    if (!pendingBackup) return;
    const result = validateBackup(pendingBackup, subject, records);
    pendingBackup = null;
    preview.hidden = true;
    if (result.error) {
      importStatus.textContent = result.error;
      return;
    }
    records.push(...result.additions);
    save();
    render();
    importStatus.textContent =
      `已合并 ${result.additions.length} 条记录，跳过 ${result.duplicates} 条重复记录。` +
      (canStore ? "已保存到当前浏览器。" : "仅临时保留，请导出备份后再离开。");
  });
  render();
}

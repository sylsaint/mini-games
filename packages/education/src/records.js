export const SUBJECTS = {
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

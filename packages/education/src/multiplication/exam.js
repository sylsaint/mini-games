export const examKey = "yoyo-math-integer-multiplication-v1";
export const paperIds = ["A", "B"];
export const newPaper = () => ({ index: 0, answers: {}, submitted: false });
export const newProgress = () => ({ version: 1, A: newPaper(), B: newPaper() });

export function validProgress(value) {
  const plain = (x) => x != null && typeof x === "object" && !Array.isArray(x);
  return (
    plain(value) &&
    value.version === 1 &&
    paperIds.every((id) => {
      const paper = value[id];
      return (
        plain(paper) &&
        Number.isInteger(paper.index) &&
        paper.index >= 0 &&
        paper.index < 15 &&
        typeof paper.submitted === "boolean" &&
        plain(paper.answers) &&
        Object.entries(paper.answers).every(
          ([key, v]) =>
            new RegExp(`^${id.toLowerCase()}(?:0[1-9]|1[0-5])-[0-3]$`).test(
              key,
            ) &&
            typeof v === "string" &&
            v.length <= 160,
        )
      );
    })
  );
}

export const answerKey = (q, i) => `${q.id}-${i}`;
export const normalize = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .trim();
export const hasAnswer = (value) => normalize(value) !== "";
export const displayAnswer = (value) =>
  typeof value === "number" ? value.toLocaleString("zh-CN") : value;

function asInteger(value) {
  const raw = normalize(value);
  if (
    !/^\d+$/.test(raw) &&
    !/^\d{1,3}(?:,\d{3})+$/.test(raw) &&
    !/^\d{1,3}(?: +\d{3})+$/.test(raw)
  )
    return null;
  const n = Number(raw.replace(/[, ]/g, ""));
  return Number.isSafeInteger(n) ? n : null;
}

export function isCorrect(part, value) {
  return part.opts ? value === part.key : asInteger(value) === part.key;
}

export function errorHint(part, value) {
  const key = part.opts ? value : asInteger(value);
  return key != null && Object.hasOwn(part.miss, key) ? part.miss[key] : "";
}

export function completion(q, answers) {
  const answered = q.parts.filter((_, i) =>
    hasAnswer(answers[answerKey(q, i)]),
  ).length;
  return answered === q.parts.length ? "full" : answered ? "part" : "empty";
}

export function grade(questions, answers) {
  const topics = {};
  let score = 0;
  let incomplete = 0;
  let needsReview = 0;
  const rows = questions.map((q) => {
    const partPoints = q.points / q.parts.length;
    const earned = q.parts.reduce(
      (sum, part, i) =>
        sum + (isCorrect(part, answers[answerKey(q, i)]) ? partPoints : 0),
      0,
    );
    score += earned;
    if (completion(q, answers) !== "full") incomplete++;
    if (earned < q.points) needsReview++;
    const topic = (topics[q.tag] ??= { earned: 0, max: 0 });
    topic.earned += earned;
    topic.max += q.points;
    return { q, earned };
  });
  return { score, incomplete, needsReview, topics, rows };
}

export const examKey = 'yoyo-math-grade4-fall-v1';
export const normalize = value => String(value ?? '').normalize('NFKC').replace(/[,，\s]/g, '').trim();
export function isCorrect(question, value) {
  if (normalize(value) === '') return false;
  return question.type === 'number' ? Number(normalize(value)) === Number(question.answer) : normalize(value) === normalize(question.answer);
}
export function summarize(questions, answers) {
  const core = questions.filter(q => !q.bonus);
  return { total: core.length, answered: core.filter(q => normalize(answers[q.id]) !== '').length,
    correct: core.filter(q => isCorrect(q, answers[q.id])).length,
    score: core.reduce((sum,q) => sum + (isCorrect(q, answers[q.id]) ? q.points : 0),0),
    maximum: core.reduce((sum,q) => sum + q.points,0) };
}
export function validProgress(value) {
  return value && value.version === 1 && typeof value.answers === 'object' && value.answers !== null && !Array.isArray(value.answers) && Object.values(value.answers).every(x => typeof x === 'string' && x.length <= 200) && Number.isInteger(value.index) && value.index >= 0 && typeof value.submitted === 'boolean' && typeof value.started === 'boolean' && typeof value.extension === 'boolean';
}

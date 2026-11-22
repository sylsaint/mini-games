/** Simulated instrument. The showroom's historic robe weight is the target,
 * but the player UI only reveals it after a measured equilibrium. */
export const weights = Object.freeze([30, 15, 8, 4, 2, 1]);
export const CLOSE_BRACKET = 5;
const specimenMass = 49;

export function sumWeights(selection) {
  return weights.reduce((sum, weight) => sum + (selection.includes(weight) ? weight : 0), 0);
}

export function measure(selection) {
  const grams = sumWeights(selection);
  if (grams === 0) return null;
  return {
    grams,
    compare: grams === specimenMass ? "balanced" : grams < specimenMass ? "lighter" : "heavier",
  };
}

export function recordTrial(trials, comparison) {
  if (!comparison || trials.some((trial) => trial.grams === comparison.grams)) return trials;
  return [...trials, comparison];
}

export function bounds(trials) {
  let lower = null;
  let upper = null;
  for (const { grams, compare } of trials) {
    if (compare === "lighter") lower = lower === null ? grams : Math.max(lower, grams);
    if (compare === "heavier") upper = upper === null ? grams : Math.min(upper, grams);
  }
  return { lower, upper, bracketProven: lower !== null && upper !== null && upper - lower <= CLOSE_BRACKET };
}

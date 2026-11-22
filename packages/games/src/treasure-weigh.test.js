import { test } from "node:test";
import assert from "node:assert/strict";
import { bounds, measure, recordTrial, sumWeights, weights } from "./treasure-weigh.js";

test("the scale does not measure an empty right pan, or accept duplicate/unknown weights", () => {
  assert.equal(measure([]), null);
  assert.equal(measure([11]), null);
  assert.equal(sumWeights([30, 30, 100]), 30);
});

test("the six weights support a tight two-sided bracket and an exact balance", () => {
  const below = measure([30, 15, 2, 1]);
  const above = measure([30, 15, 4, 2]);
  const exact = measure([30, 15, 4]);
  assert.deepEqual(below, { grams: 48, compare: "lighter" });
  assert.deepEqual(above, { grams: 51, compare: "heavier" });
  assert.deepEqual(exact, { grams: 49, compare: "balanced" });
  assert.deepEqual(bounds([below, exact, above]), { lower: 48, upper: 51, bracketProven: true });
});

test("the journal only adds new results; bounds use the closest independent comparisons", () => {
  const exact = measure([30, 15, 4]);
  assert.deepEqual(bounds([exact]), { lower: null, upper: null, bracketProven: false });
  const initial = [measure([30]), measure(weights)];
  assert.deepEqual(bounds(initial), { lower: 30, upper: 60, bracketProven: false });
  const next = recordTrial(initial, measure([30, 15, 2]));
  assert.deepEqual(bounds(next), { lower: 47, upper: 60, bracketProven: false });
  assert.equal(recordTrial(next, measure([30])), next);
  assert.deepEqual(bounds(recordTrial(next, measure([30, 15, 4, 2]))), { lower: 47, upper: 51, bracketProven: true });
});

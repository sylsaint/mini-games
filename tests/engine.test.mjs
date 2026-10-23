import test from "node:test";
import assert from "node:assert/strict";
import {
  fraction,
  calculate,
  is24,
  display,
  solve,
  puzzles,
} from "../games/twenty-four/engine.js";
test("exact rational arithmetic, signs, zero and division", () => {
  assert.deepEqual(fraction(6, -8), { n: -3, d: 4 });
  assert.deepEqual(calculate(fraction(1, 3), fraction(2, 3), "+"), fraction(1));
  assert.deepEqual(calculate(fraction(2), fraction(5), "-"), fraction(-3));
  assert.deepEqual(calculate(fraction(3, 4), fraction(8), "*"), fraction(6));
  assert.throws(() => calculate(fraction(1), fraction(0), "/"));
  assert.equal(display(fraction(8, 3)), "8/3");
  assert.ok(
    is24(
      calculate(fraction(8), calculate(fraction(3), fraction(8, 3), "-"), "/"),
    ),
  );
});
test("every published puzzle has a solution", () => {
  for (const p of puzzles) {
    assert.equal(p.length, 4);
    assert.ok(solve(p), `Unsolvable: ${p}`);
  }
});
test("unsolvable puzzle is rejected", () => {
  assert.equal(solve([1, 1, 1, 1]), null);
});

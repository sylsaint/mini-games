import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkSeam,
  fragmentEdge,
  fragments,
  supportedClaims,
} from "./treasure-restore.js";

test("only one fragment and orientation can align all three seams", () => {
  const matches = [];
  for (const [index, piece] of fragments.entries()) {
    for (const turn of [0, 180]) {
      for (let level = -32; level <= 32; level++) {
        if (checkSeam(fragmentEdge(piece, turn, level)) === "matched") {
          matches.push({ index, turn, level });
        }
      }
    }
  }
  assert.ok(
    matches.length > 2,
    "touch adjustments should not require one precise pixel",
  );
  assert.ok(matches.every((row) => row.index === 0 && row.turn === 180));
  assert.ok(matches.some((row) => row.level === 13));
});

test("seam review differentiates incorrect order from misalignment", () => {
  assert.equal(checkSeam(fragmentEdge(fragments[0], 0, 0)), "pattern");
  assert.equal(checkSeam(fragmentEdge(fragments[0], 180, 0)), "position");
  assert.equal(checkSeam(fragmentEdge(fragments[0], 180, 13)), "matched");
});

test("an exhibit claim cannot be inferred from a similar label or material alone", () => {
  assert.ok(supportedClaims([2, 0]));
  assert.ok(!supportedClaims([0, 1]));
  assert.ok(!supportedClaims([1, 3]));
  assert.ok(!supportedClaims([0, 2, 3]));
});

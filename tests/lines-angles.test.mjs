import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isCorrect, summarize, validProgress, examKey } from '../packages/education/src/math-exam.js';
import { linesAnglesKey } from '../packages/education/src/lines-angles/contract.js';
const bank = JSON.parse(readFileSync(new URL('../packages/education/src/lines-angles/bank.json', import.meta.url)));
const byId = Object.fromEntries(bank.map(q => [q.id, q]));

test('independent lines-and-angles bank: 20 five-point core questions and four zero-point extensions', () => {
  assert.equal(linesAnglesKey, 'yoyo-math-lines-angles-v1');
  assert.notEqual(linesAnglesKey, examKey);
  assert.equal(bank.length, 24);
  assert.deepEqual(bank.map(q => q.id), Array.from({ length: 24 }, (_, i) => `la${String(i + 1).padStart(2, '0')}`));
  for (const [i, q] of bank.entries()) {
    assert.equal(q.bonus, i >= 20); assert.equal(q.points, i >= 20 ? 0 : 5);
    assert.ok(q.prompt && q.topic && q.explanation);
    assert.ok(['choice', 'number'].includes(q.type));
    if (q.type === 'choice') { assert.equal(new Set(q.options).size, 4); assert.ok(q.options.includes(q.answer)); }
    else assert.ok(Number.isFinite(q.answer));
  }
});

test('independently calculated key mathematical answers, including reversed starting ray and extensions', () => {
  const calculated = { la05: 360 / 4, la12: 90 + 40, la13: 6 * 15, la14: 55, la15: 100 - 25,
    la16: 180 - 120, la17: 90, la18: 360 / 12 * 7, la19: 180 - 64,
    la21: (90 - 24) / 2, la22: 5 * 4 / 2, la23: (180 - 48) / 3, la24: 270 - (145 - 70) };
  for (const [id, expected] of Object.entries(calculated)) assert.equal(byId[id].answer, expected, id);
  assert.equal(byId.la14.interaction.angle - byId.la14.interaction.startAngle, 55);
  assert.equal(byId.la15.interaction.angle - byId.la15.interaction.startAngle, 75);
  assert.equal(byId.la16.interaction.mode, 'draw'); assert.equal(byId.la16.interaction.base, 'left');
  assert.ok(!isCorrect(byId.la16, '120')); assert.ok(!isCorrect(byId.la15, '100'));
});

test('100-point scoring excludes extensions and does not reward unanswered or unit-bearing input', () => {
  const correct = Object.fromEntries(bank.map(q => [q.id, String(q.answer)]));
  assert.deepEqual(summarize(bank, correct), { total: 20, answered: 20, correct: 20, score: 100, maximum: 100 });
  const extensions = Object.fromEntries(bank.filter(q => q.bonus).map(q => [q.id, String(q.answer)]));
  assert.deepEqual(summarize(bank, extensions), { total: 20, answered: 0, correct: 0, score: 0, maximum: 100 });
  for (const q of bank.filter(q => q.bonus)) correct[q.id] = 'wrong';
  assert.equal(summarize(bank, correct).score, 100);
  correct.la05 = '91'; assert.equal(summarize(bank, correct).score, 95);
  assert.ok(isCorrect(byId.la05, '９０')); assert.ok(isCorrect(byId.la05, ' 90 '));
  for (const v of ['', ' ', '90°', '90abc', 'null']) assert.ok(!isCorrect(byId.la05, v));
});

test('saved independent progress retains shared validation and rejects malformed answers', () => {
  const good = { version: 1, answers: { la01: '线段', la16: '60' }, index: 15, started: true, submitted: false, extension: false };
  assert.ok(validProgress(good));
  for (const bad of [null, [], {}, { ...good, version: 2 }, { ...good, index: -1 }, { ...good, index: 1.5 },
    { ...good, answers: [] }, { ...good, answers: null }, { ...good, answers: { la16: 60 } },
    { ...good, answers: { la01: 'x'.repeat(201) } }, { ...good, submitted: 'false' }]) assert.ok(!validProgress(bad));
});

import '../packages/education/src/lines-angles/protractor-math.test.js';

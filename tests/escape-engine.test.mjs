import assert from 'node:assert/strict';
import test from 'node:test';
import { CELL_COUNT, DEADLINE_MS, LEVEL_MS, MAX_ACTIVE, MAX_WORKERS, createGame, tick, recruit, merge, buyFood, rescueAndFeed, buyTool, getDuration } from '../packages/games/src/escape-engine.js';

test('starts with four distinct cells and each L1 cell gives exactly one coin after ten seconds', () => {
  const s = createGame(1000);
  assert.deepEqual(s.workers.map(w => w.level), [1, 1, 1, 1]);
  assert.equal(new Set(s.workers.map(w => w.cell)).size, 4);
  assert.equal(s.cells.length, CELL_COUNT);
  assert.equal(recruit(s), false);
  tick(s, 10999);
  assert.equal(s.coins, 0);
  tick(s, 11000);
  assert.equal(s.completed, 4);
  assert.equal(s.coins, 4);
  tick(s, 11000);
  assert.equal(s.coins, 4);
});

test('inactivity and a delayed background tick time out with exactly 240 excavated cells', () => {
  const s = createGame(5000);
  tick(s, s.deadlineAt - 1);
  assert.equal(s.completed, 240);
  assert.equal(s.status, 'running');
  tick(s, s.deadlineAt + 32000);
  assert.equal(s.status, 'lost');
  assert.equal(s.now - s.startedAt, DEADLINE_MS);
  assert.equal(s.completed, 240);
  assert.equal(s.coins, 240);
  assert.equal(recruit(s), false);
  assert.equal(merge(s, 1), false);
});

test('six early recruits make escape achievable; large catchup equals frequent ticks', () => {
  const s = createGame(0);
  for (let now = 10000; now <= 60000; now += 10000) {
    tick(s, now);
    if (s.coins >= s.recruitCost) assert.equal(recruit(s), true);
  }
  for (let now = 360000; now <= 660000; now += 100000) {
    tick(s, now);
    if (s.status === 'running') {
      for (let i = 0; i < 3; i++) assert.equal(buyFood(s), true);
      for (let i = 0; i < 3; i++) rescueAndFeed(s);
    }
  }
  const clone = JSON.parse(JSON.stringify(s));
  for (let now = s.now + 100; now <= DEADLINE_MS; now += 100) tick(clone, now);
  tick(s, DEADLINE_MS + 1);
  assert.deepEqual(s, clone);
  assert.equal(s.status, 'won');
  assert.ok(s.now < DEADLINE_MS);
  assert.equal(s.completed, CELL_COUNT);
  assert.ok(s.coins < CELL_COUNT);
});

test('level rates are exact, including the one-second top-level rate and partial cells survive merging', () => {
  assert.deepEqual(LEVEL_MS, [10000, 7000, 5000, 3000, 1000]);
  const s = createGame(0);
  tick(s, 5000);
  assert.equal(merge(s, 1), true);
  assert.equal(s.cells[0], 0.5);
  assert.equal(s.cells[1], 0.5);
  assert.equal(s.workers[0].level, 2);
  tick(s, 8499);
  assert.equal(s.completed, 0);
  tick(s, 8500);
  assert.equal(s.completed, 1);
  assert.equal(s.coins, 1);
  assert.equal(s.cells[1], 0.5);
  assert.equal(merge(s, 2), false);
  assert.equal(merge(s, 5), false);
  assert.equal(merge(s, '1'), false);
});

test('recruit price rises and active slots, roster capacity, and merges remain distinct', () => {
  const s = createGame(0);
  tick(s, 600000);
  assert.equal(s.coins, 240);
  for (let price = 1; price <= 12; price++) {
    assert.equal(s.recruitCost, price);
    const balance = s.coins;
    assert.equal(recruit(s), true);
    assert.equal(s.coins, balance - price);
  }
  assert.equal(s.workers.length, MAX_WORKERS);
  assert.equal(recruit(s), false);
  assert.equal(s.recruitCost, 13);
  assert.equal(s.workers.filter(w => w.cell !== null).length, MAX_ACTIVE);
  assert.equal(new Set(s.workers.filter(w => w.cell !== null).map(w => w.cell)).size, MAX_ACTIVE);
  for (const level of [1, 2, 3, 4]) {
    while (s.workers.filter(w => w.level === level).length >= 2) assert.equal(merge(s, level), true);
  }
  assert.deepEqual(s.workers.map(w => w.level), [5]);
  assert.equal(merge(s, 5), false);
  const cellAtMerge = s.workers[0].cell;
  tick(s, 600999);
  assert.ok(s.cells[cellAtMerge] < 1);
  tick(s, 601000);
  assert.equal(s.cells[cellAtMerge], 1);
  assert.equal(s.completed, 241);
});

test('ignores backwards clocks and an exact deadline finish does not count as an escape', () => {
  const s = createGame(1000);
  tick(s, 11000);
  const snapshot = JSON.parse(JSON.stringify(s));
  tick(s, 10001);
  assert.deepEqual(s, snapshot);
  const last = createGame(0);
  last.cells.fill(1);
  last.cells[0] = 0;
  last.completed = CELL_COUNT - 1;
  last.now = DEADLINE_MS - 10000;
  last.workers = [last.workers[0]];
  tick(last, DEADLINE_MS);
  assert.equal(last.completed, CELL_COUNT);
  assert.equal(last.status, 'lost');
});

test('tool purchases and feeding apply to workers, reject repeats and consume actual paid portions', () => {
  const s = createGame(0);
  assert.equal(buyFood(s), false);
  assert.equal(buyTool(s, 1, 1), false);
  assert.equal(rescueAndFeed(s), 0);
  tick(s, 20000);
  assert.equal(buyTool(s, 1, 1), true);
  assert.equal(getDuration(s.workers.find(w => w.id === 1)), 8000);
  assert.equal(buyTool(s, 1, 1), false);
  assert.equal(buyTool(s, 1, 2), true);
  assert.equal(getDuration(s.workers.find(w => w.id === 1)), 10000 / 1.5);
  assert.equal(buyTool(s, 1, 1), false);
  assert.equal(buyFood(s), false);
  tick(s, 40000);
  const coins = s.coins;
  assert.equal(buyFood(s), true);
  assert.equal(s.coins, coins - 2);
  assert.equal(s.food, 3);
  assert.equal(rescueAndFeed(s), 3);
  assert.equal(s.food, 0);
  assert.equal(rescueAndFeed(s), 0);
  assert.equal(s.workers.filter(w => w.energy === 60).length, 3);
});

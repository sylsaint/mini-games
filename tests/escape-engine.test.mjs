import assert from 'node:assert/strict';
import test from 'node:test';
import { CELL_COUNT, DEADLINE_MS, LEVEL_MS, MAX_ACTIVE, MAX_WORKERS, createGame, tick as advance, recruit, merge, buyFood, rescueAndFeed, buyTool, getDuration, beginRescue, TREASURES, LOOT_CHANCES, FIRST_FIND_CELL, redeemTreasure, claimRescuer } from '../packages/games/src/escape-engine.js';

const tick = (state, now) => advance(state, now, () => 0.5);

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
  tick(s, 30000);
  const coins = s.coins;
  assert.equal(buyFood(s), true);
  assert.equal(s.coins, coins - 2);
  assert.equal(s.food, 3);
  assert.equal(rescueAndFeed(s), 3);
  assert.equal(s.food, 0);
  assert.equal(rescueAndFeed(s), 0);
  assert.equal(s.workers.filter(w => w.energy === 60).length, 3);
});

test('rope passengers stop digging and eat only on surface',()=>{const s=createGame(0);tick(s,10000);buyFood(s);const ids=beginRescue(s);assert.equal(ids.length,3);for(const id of ids)assert.equal(s.workers.find(w=>w.id===id).cell,null);tick(s,12000);assert.equal(s.food,3);assert.equal(rescueAndFeed(s,ids),3);assert.equal(s.food,0);for(const id of ids){const w=s.workers.find(w=>w.id===id);assert.equal(w.energy,60);assert.equal(w.onRope,false);}});


test('loot is an independent optional bonus after the guaranteed coin, with disjoint published chances', () => {
  const s = createGame(1000);
  const chances = LOOT_CHANCES;
  assert.deepEqual(chances, { food: 0.02, worker: 0.006, treasure: 0.01 });
  const rolls = [0, chances.treasure, 0.016, 0.036];
  let calls = 0;
  const random = () => rolls[calls++];
  advance(s, 10999, random);
  assert.equal(calls, 0);
  advance(s, 11000, random);
  assert.equal(calls, 4);
  assert.equal(s.completed, 4);
  assert.equal(s.coins, 4);
  assert.equal(s.food, 3);
  assert.equal(s.treasures['lacquer-cup'], 1);
  assert.equal(s.queuedRescuers, 0);
  assert.equal(s.recruitCost, 1);
  assert.equal(s.workers.length, 5);
  assert.deepEqual(s.workers.find(w => w.id === 5), { id: 5, level: 1, tool: 0, energy: 60, cell: 8 });
  assert.deepEqual(s.recentFinds, [{ kind: 'treasure', cell: 0, at: 11000, treasureId: 'lacquer-cup' }, { kind: 'worker', cell: 1, at: 11000 }, { kind: 'food', cell: 2, at: 11000 }]);
  assert.deepEqual(s.bonusCounts, { food: 1, worker: 1, treasure: 1 });
  advance(s, 11000, random);
  assert.equal(calls, 4);
  assert.equal(redeemTreasure(s, 'lacquer-cup'), true);
  assert.equal(s.coins, 4 + TREASURES['lacquer-cup'].value);
  assert.equal(redeemTreasure(s, 'lacquer-cup'), false);
  assert.equal(s.coins, 4 + TREASURES['lacquer-cup'].value);
  const ids = beginRescue(s);
  assert.equal(ids.length, 3);
  assert.equal(rescueAndFeed(s, ids), 3);
  assert.equal(s.food, 0);
});

test('discovered level-one helpers queue when full and can join for free when a merge opens space', () => {
  const s = createGame(0);
  tick(s, 600000);
  for (let i = 4; i < MAX_WORKERS; i++) assert.equal(recruit(s), true);
  advance(s, 610000, () => 0.012);
  assert.equal(s.workers.length, MAX_WORKERS);
  assert.equal(s.workers.filter(w => w.cell !== null).length, MAX_ACTIVE);
  assert.equal(s.queuedRescuers, 8);
  assert.equal(s.recentFinds.every(x => x.kind === 'worker' && x.queued), true);
  assert.equal(claimRescuer(s), false);
  assert.equal(merge(s, 1), true);
  const coins = s.coins, price = s.recruitCost, helperId = s.nextWorkerId;
  assert.equal(claimRescuer(s), true);
  assert.equal(s.queuedRescuers, 7);
  assert.equal(s.coins, coins);
  assert.equal(s.recruitCost, price);
  assert.equal(s.workers.find(w => w.id === helperId).level, 1);
  assert.equal(s.workers.length, MAX_WORKERS);
});

test('the last tile always awards its base coin and a treasure can still be redeemed after escaping', () => {
  const s = createGame(0);
  s.cells.fill(1);
  s.cells[0] = 0;
  s.completed = CELL_COUNT - 1;
  s.workers = [s.workers[0]];
  advance(s, 10000, () => 0);
  assert.equal(s.status, 'won');
  assert.equal(s.completed, CELL_COUNT);
  assert.equal(s.coins, 1);
  assert.equal(s.treasures['lacquer-cup'], 1);
  assert.equal(redeemTreasure(s, 'lacquer-cup'), true);
  assert.equal(s.coins, 1 + TREASURES['lacquer-cup'].value);
  assert.equal(redeemTreasure(s, 'lacquer-cup'), false);
});

test('loot remains deterministic across tick sizes for the same random sequence and caps its visible journal', () => {
  const makeRandom = () => {
    let i = -1;
    return () => [0.5, 0, 0.012, 0.02, 0.5, 0.5][++i % 6];
  };
  const regular = createGame(0);
  const paused = createGame(0);
  const r = makeRandom();
  for (let now = 200; now <= 80000; now += 200) advance(regular, now, r);
  advance(paused, 80000, makeRandom());
  assert.deepEqual(regular, paused);
  assert.ok(regular.bonusCounts.food + regular.bonusCounts.worker + regular.bonusCounts.treasure > 8);
  assert.equal(regular.recentFinds.length, 8);
  assert.equal(new Set(regular.recentFinds.map(find => find.cell)).size, 8);
  assert.equal(regular.coins, regular.completed);
});


test('six real artifact entries get rarer as their separate coin values rise, capped at twenty', () => {
  const s = createGame(0);
  const entries = Object.values(TREASURES);
  assert.deepEqual(entries.map(e => e.value), [3, 6, 10, 13, 15, 20]);
  assert.ok(entries.every((e, i) => i === 0 || e.chance < entries[i - 1].chance));
  assert.equal(entries.reduce((sum, entry) => sum + Math.round(entry.chance * 10000), 0), 100);
  const rolls = [0.0001, 0.0041, 0.0066, 0.0081, 0.0091, 0.0098, 0.5, 0.5];
  let i = 0;
  advance(s, 20000, () => rolls[i++]);
  assert.equal(s.coins, 8);
  assert.equal(s.recentFinds.length, 6);
  assert.deepEqual(s.recentFinds.map(e => e.treasureId), entries.map(e => e.id));
  assert.equal(redeemTreasure(s, 'nonexistent'), false);
  assert.equal(redeemTreasure(s, 'constructor'), false);
  assert.equal(redeemTreasure(s, 'li-cang-seal'), true);
  assert.equal(s.coins, 28);
  assert.equal(s.treasures['li-cang-seal'], 0);
  assert.equal(s.treasures['lacquer-cup'], 1);
  assert.equal(redeemTreasure(s, 'li-cang-seal'), false);
});

test('a single early food cache guarantees a discovery only if the first sixteen rolls miss', () => {
  const s = createGame(0);
  tick(s, 39999);
  assert.equal(s.completed, FIRST_FIND_CELL - 4);
  assert.equal(s.food, 0);
  tick(s, 40000);
  assert.equal(s.completed, FIRST_FIND_CELL);
  assert.equal(s.food, 3);
  assert.deepEqual(s.recentFinds, [{ kind: 'food', cell: 15, at: 40000, cache: true }]);
  tick(s, 90000);
  assert.equal(s.food, 3);
  assert.equal(s.bonusCounts.food, 1);
  const lucky = createGame(0);
  let i = 0;
  advance(lucky, 40000, () => i++ ? 0.5 : 0.0041);
  assert.equal(lucky.food, 0);
  assert.equal(lucky.treasures['cat-dish'], 1);
});

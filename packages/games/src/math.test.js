import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { value, parse, calc, rat, expr } from './math.js';
const bank = JSON.parse(readFileSync(new URL('./bank.json', import.meta.url)));
test('all original 500 puzzles retain valid exact solutions and four cards', () => {
  assert.equal(bank.length, 50);
  assert.equal(bank.flat().length, 500);
  assert.deepEqual(bank[0][0].nums,[2,6,6,12]);
  for (const level of bank) {
    assert.equal(level.length,10);
    for (const puzzle of level) for (const tree of puzzle.solutions) {
      assert.deepEqual(value(tree), [24,1]);
      assert.deepEqual(parse(expr(tree),puzzle.nums).result,[24,1]);
    }
  }
});
test('exact fraction arithmetic preserves noninteger and negative intermediate values', () => {
  assert.deepEqual(value(['/',8,['-',3,['/',8,3]]]),[24,1]);
  assert.deepEqual(rat(2,-6),[-1,3]);
  assert.deepEqual(calc([1,3],[2,3],'+'),[1,1]);
  assert.throws(()=>calc([1,1],[0,1],'/'),/0 不能做除数/);
});
test('expression parser rejects omitted, duplicated, concatenated and executable inputs', () => {
  for(const input of ['2+6','2+6+6+6','26-6+12','alert(1)','02+6+6+12']) assert.throws(()=>parse(input,[2,6,6,12]));
  assert.deepEqual(parse('（2＋6−6）×12',[2,6,6,12]).result,[24,1]);
});

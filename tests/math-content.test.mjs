import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const report = fs.readFileSync(new URL('../portal/learning/math/report.html', import.meta.url), 'utf8');
const practice = fs.readFileSync(new URL('../portal/learning/math/practice.html', import.meta.url), 'utf8');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'");

test('complete report retains every word supplied by the parent, in source order', () => {
  const pieces = [...report.matchAll(/<(p|h2|h3|h4|strong|small|th|td|li)\b[^>]*\bdata-source(?:="")?[^>]*>([\s\S]*?)<\/\1>/g)];
  const text = decode(pieces.map((m) => m[2].replace(/<[^>]*>/g, '')).join('')).replace(/\s+/g, '');
  assert.equal(createHash('sha256').update(text).digest('hex'), '2d3e2f67b1baa0fae2eb8df227f984b821ab6a788e624090169f66e24f040fb0');
  assert.equal((report.match(/data-day="\d+"/g) || []).length, 14);
  assert.equal((report.match(/class="quiz"/g) || []).length, 5);
  assert.match(report, /未重新核验试卷照片/);
  assert.match(report, /足球题/);
});

function questionBank() {
  const start = practice.indexOf('const Q=');
  const end = practice.indexOf('const rewards=', start);
  assert.ok(start >= 0 && end > start, 'question bank is independently inspectable');
  const context = {};
  vm.runInNewContext(practice.slice(start, end) + ';globalThis.bank=Q;', context);
  return context.bank;
}

test('every geometry question has one valid answer and reason plus learning feedback', () => {
  const bank = questionBank();
  assert.ok(bank.length >= 25);
  assert.equal(new Set(bank.map((q) => q.id)).size, bank.length);
  for (const q of bank) {
    assert.ok(q.opts[q.answer], `answer for ${q.id}`);
    assert.ok(q.reasons[q.reason], `reason for ${q.id}`);
    assert.ok(q.hint && q.explain && q.diagram, `learning support for ${q.id}`);
    assert.ok(Number.isInteger(q.t) && q.t >= 0);
  }
});

test('core misconception questions use correct mathematics and necessary conditions', () => {
  const bank = questionBank();
  const answer = (fragment) => {const q=bank.find((q)=>q.stem.includes(fragment)); assert.ok(q,fragment);return q.opts[q.answer];};
  assert.equal(answer('从 A 出发'), '射线 AB');
  assert.equal(answer('A、B 是两个不同的点'), '不是');
  assert.equal(answer('一条直线有几个端点'), '0 个');
  assert.equal(answer('一个平角被分成 35°'), '145°');
  assert.equal(answer('一个直角被分成 28°'), '62°');
  assert.equal(answer('一个平角的一部分是 120°'), '锐角');
  assert.equal(answer('两条直线相交成 60°'), '不垂直');
  assert.equal(answer('一起旋转 30°'), '还垂直');
  assert.equal(answer('从固定的家 A'), '直接沿线段 AB');
  assert.equal(answer('只知道路线长短'), '还不能');
  const parallel=bank.find((q)=>q.stem.includes('无限延长也不相交'));
  assert.match(parallel.stem,/同一平面/);
  assert.match(parallel.stem,/不同直线/);
});

test('reward descriptions stay within the requested budget and require parent redemption', () => {
  const match=practice.match(/const rewards=(\[[\s\S]*?\]);/);
  assert.ok(match);
  const rewards=vm.runInNewContext('('+match[1]+')');
  assert.ok(rewards.length >= 2);
  for(const r of rewards) assert.ok(Number.isFinite(r.limit)&&r.limit>=0&&r.limit<=20);
  assert.match(practice,/不会自动购买或付款/);
  assert.match(practice,/奖励由家长确认并兑现/);
});

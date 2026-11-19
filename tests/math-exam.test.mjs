import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isCorrect, summarize, validProgress } from '../packages/education/src/math-exam.js';
const bank=JSON.parse(readFileSync(new URL('../packages/education/src/math-exam-bank.json',import.meta.url)));
test('exam bank has unique verified questions and exactly 100 core points',()=>{assert.equal(bank.length,18);assert.equal(new Set(bank.map(q=>q.id)).size,18);assert.equal(summarize(bank,{}).maximum,100);assert.equal(summarize(bank,{}).total,15);for(const q of bank){assert.ok(q.explanation);if(q.type==='choice'){assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.answer));}if(q.bonus)assert.equal(q.points,0);}});
test('scoring accepts fullwidth and comma grouped numbers, never blank or wrong choice',()=>{assert.ok(isCorrect(bank[4],'３，０００'));assert.ok(!isCorrect(bank[4],''));assert.ok(!isCorrect(bank[0],'800 次'));const all=Object.fromEntries(bank.map(q=>[q.id,String(q.answer)]));assert.equal(summarize(bank,all).score,100);assert.equal(summarize(bank,{}).score,0);});
test('local saved progress rejects malformed and oversized payloads',()=>{const p={version:1,answers:{q01:'8000 次'},index:0,started:true,submitted:false,extension:false};assert.ok(validProgress(p));for(const v of [null,{}, {...p,index:-1},{...p,answers:[]},{...p,answers:{q01:'x'.repeat(201)}}])assert.ok(!validProgress(v));});
test('questions referring to a diagram have one and square-row answer stays compatible',()=>{for(const q of bank.filter(q=>q.prompt.includes('图中')))assert.ok(q.diagram,q.id);const q=bank.find(q=>q.id==='q17');assert.equal(q.diagram.type,'square-row');assert.equal(q.answer,15);assert.equal(q.bonus,true);assert.equal(q.points,0);});

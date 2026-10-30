import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../portal/learning/math/practice.html',import.meta.url),'utf8');
const code=html.match(/<script>([\s\S]*)<\/script>/)[1];
function harness(initial={},fail=false){
 const els=new Map(),storage=new Map(Object.entries(initial));
 const node=()=>({textContent:'',innerHTML:'',style:{},classList:{add(){},remove(){},toggle(){}},append(){},setAttribute(){}});
 const document={querySelector:s=>{if(!els.has(s))els.set(s,node());return els.get(s);},getElementById:s=>{if(!els.has('#'+s))els.set('#'+s,node());return els.get('#'+s);},querySelectorAll:()=>[],createElement:node};
 const context=vm.createContext({document,localStorage:{getItem:k=>{if(fail)throw Error('blocked');return storage.get(k)||null;},setItem:(k,v)=>{if(fail)throw Error('blocked');storage.set(k,v);}},window:{},confirm:()=>true,console});
 vm.runInContext(code.slice(0,code.lastIndexOf('if(complete())showSummary();')),context);
 return {context,els,storage,run:s=>vm.runInContext(s,context)};
}
test('geometry question bank has 30 correctly mapped questions across six topics',()=>{
 const h=harness();assert.equal(h.run('Q.length'),30);assert.equal(h.run('topics.length'),6);
 assert.equal(h.run('Q.every(q=>q.opts[q.answer]&&q.reasons[q.reason]&&q.hint&&q.explain)'),true);
 assert.equal(h.run('topics.every((_,i)=>Q.filter(q=>q.t===i).length===5)'),true);
 assert.equal(h.run('rewards.every(r=>r.limit>=0&&r.limit<=20)'),true);
});
test('all diagrams generate finite SVG and sector labels respect angle geometry',()=>{
 const h=harness();assert.equal(h.run('Q.every(q=>{const s=drawing(q.diagram);return s.includes("<svg")&&!/NaN|undefined/.test(s)})'),true);
 assert.equal(h.run('split(180,120).includes("120°")'),true);
 assert.equal(h.run('drawing("angle60").includes("120°")'),true);
});
test('wrong answer and wrong reason cannot advance; review and complete are gated',()=>{
 const h=harness();h.run('active=Q[0];selection=0;why=0;checkAnswer()');assert.equal(h.run('state.solved.length'),0);assert.equal(h.run('state.wrong.includes(0)'),true);
 h.run('selection=1;why=1;checkAnswer()');assert.equal(h.run('state.solved.length'),0);
 h.run('selection=1;why=0;checkAnswer()');assert.equal(h.run('state.solved.includes(0)'),true);assert.equal(h.run('pendingReview().length'),1);assert.equal(h.run('complete()'),false);
 h.run('state.solved=Q.map(q=>q.id);state.labs=topics.map(()=>true)');assert.equal(h.run('complete()'),false);
 h.run('reviewMode=true;checkAnswer()');assert.equal(h.run('complete()'),true);
});
test('malformed or unavailable browser storage still permits practice',()=>{
 assert.doesNotThrow(()=>harness({'yoyo-geometry-v1':'{broken'}));assert.doesNotThrow(()=>harness({},true));
 const h=harness({'yoyo-geometry-v1':JSON.stringify({v:1,labs:Array(6).fill(false),solved:[-1,0,0,30,'x'],wrong:[],revisited:[],attempts:{}})});assert.equal(h.run('state.solved.join(",")'),'0');
});
test('reset retains reward and reopening restores a single reward',()=>{
 const record=JSON.stringify({choice:1,revealed:true});const h=harness({'yoyo-geometry-reward-v1':record});assert.equal(h.run('reward.choice'),1);
 h.els.get('#resetButton').onclick();assert.equal(h.run('reward.choice'),1);assert.equal(h.storage.get('yoyo-geometry-reward-v1'),record);assert.equal(h.run('complete()'),false);
});
test('standalone page uses no external resource dependencies',()=>{
 assert.doesNotMatch(html,/<(?:script|link|img)[^>]+(?:src|href)=["']https?:/i);
});

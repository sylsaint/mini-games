import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../portal/learning/chinese/practice.html',import.meta.url),'utf8');
const code=html.match(/<script>([\s\S]*)<\/script>/)[1];
function harness(initial={},fail=false){
 const els=new Map(),storage=new Map(Object.entries(initial));
 const node=()=>({textContent:'',innerHTML:'',value:'',style:{},classList:{add(){},remove(){},toggle(){}},append(){},setAttribute(){},getContext(){return null;}});
 const document={querySelector:s=>{if(!els.has(s))els.set(s,node());return els.get(s);},querySelectorAll:()=>[],createElement:node};
 const context=vm.createContext({document,localStorage:{getItem:k=>{if(fail)throw Error('blocked');return storage.get(k)||null;},setItem:(k,v)=>{if(fail)throw Error('blocked');storage.set(k,v);}},window:{},confirm:()=>true,console});
 vm.runInContext(code,context);
 return {context,els,storage,run:s=>vm.runInContext(s,context)};
}
test('Chinese bank contains six scenes and thirty validated original challenges',()=>{
 const h=harness();assert.equal(h.run('Q.length'),30);assert.equal(h.run('topics.length'),6);
 assert.equal(h.run('topics.every((t,i)=>Q.filter(q=>q.t===i).length===5&&t.evidence.every(n=>t.scene[n]))'),true);
 assert.equal(h.run('Q.every(q=>q.hint&&q.explain&&["single","evidence","order"].includes(q.kind))'),true);
 assert.equal(h.run('Q.every(q=>correct(q,Array.isArray(q.answer)?q.answer:[q.answer]))'),true);
 assert.equal(h.run('Q.filter(q=>q.kind==="order").length'),6);
 assert.equal(h.run('Q.filter(q=>q.kind==="evidence").length'),4);
});
test('evidence rejects partial, extra and wrong selections; order is positional',()=>{
 const h=harness();assert.equal(h.run('correct(Q[2],[0])'),false);assert.equal(h.run('correct(Q[2],[0,1,2])'),false);assert.equal(h.run('correct(Q[2],[2,0])'),true);
 assert.equal(h.run('correct(Q[3],[0,1,2])'),false);assert.equal(h.run('correct(Q[3],[1,0,2])'),true);assert.equal(h.run('correct(Q[0],[1,2])'),false);
});
test('a wrong answer stays in same-question review queue until separately revisited',()=>{
 const h=harness();h.run('active=Q[0];selection=[0];checkAnswer()');assert.equal(h.run('state.solved.length'),0);assert.equal(h.run('state.wrong.includes(0)'),true);
 h.run('selection=[1];checkAnswer()');assert.equal(h.run('state.solved.includes(0)'),true);assert.equal(h.run('pendingReview().length'),1);
 h.run('state.solved=Q.map(q=>q.id);state.labs=topics.map(()=>true)');assert.equal(h.run('complete()'),false);
 h.run('reviewMode=true;showQuestion();selection=[1];checkAnswer()');assert.equal(h.run('complete()'),true);
});
test('answer checking locks completed question against repeat score increments',()=>{
 const h=harness();h.run('active=Q[0];selection=[1];checkAnswer();checkAnswer()');assert.equal(h.run('state.attempts[0]'),1);assert.equal(h.run('state.solved.length'),1);
});
test('early summary preserves untouched topics and excludes hinted first answers',()=>{
 const h=harness();h.run('state.solved=[0,1];state.hintsUsed=[0];showSummary()');const result=h.els.get('#work').innerHTML;
 assert.match(result,/字词修理铺：已完成 2\/5/);assert.match(result,/句子变声屋：未开始/);assert.match(result,/<b>1<\/b>首次无提示答对/);assert.match(result,/resumeChallenge/);assert.doesNotMatch(result,/rewardButton/);
});
test('hint records once and is retained across reload',()=>{
 const h=harness();h.run('state.labs[0]=true;showQuestion()');h.els.get('#hintButton').onclick();h.els.get('#hintButton').onclick();assert.equal(h.run('state.hintsUsed.join(",")'),'0');
 const again=harness(Object.fromEntries(h.storage));assert.equal(again.run('state.hintsUsed.join(",")'),'0');
});
test('malformed saved state and unavailable storage do not block practice',()=>{
 assert.doesNotThrow(()=>harness({'yoyo-chinese-v1':'{broken'}));assert.doesNotThrow(()=>harness({},true));
 const h=harness({'yoyo-chinese-v1':JSON.stringify({v:1,level:88,labs:'x',solved:[-1,0,0,30,'x'],wrong:[0],revisited:[1,0],attempts:{0:-5,1:3}})});
 assert.equal(h.run('state.level'),0);assert.equal(h.run('state.solved.join(",")'),'0');assert.equal(h.run('state.revisited.join(",")'),'0');assert.equal(h.run('state.attempts[0]'),undefined);
});
test('reward is gated, bounded, validated and kept through reset with notebook',()=>{
 const record=JSON.stringify({choice:2,revealed:true}),note=JSON.stringify({text:'我的观察。',checks:[true]});const h=harness({'yoyo-chinese-reward-v1':record,'yoyo-chinese-writing-v1':note});
 assert.equal(h.run('rewards.every(r=>r.limit>=0&&r.limit<=20)'),true);h.run('showReward()');assert.equal(h.run('phase'),'summary');
 h.els.get('#resetButton').onclick();assert.equal(h.storage.get('yoyo-chinese-reward-v1'),record);assert.equal(h.storage.get('yoyo-chinese-writing-v1'),note);assert.equal(h.run('reward.choice'),2);
 assert.equal(harness({'yoyo-chinese-reward-v1':'{"choice":999}'}).run('reward'),null);
});
test('notebook writes literal text without executing or grading it',()=>{
 const h=harness();h.els.get('#writing').value='<script>alert(1)</script>';h.els.get('#writing').oninput();const saved=JSON.parse(h.storage.get('yoyo-chinese-writing-v1'));assert.equal(saved.text,'<script>alert(1)</script>');assert.match(h.els.get('#writingStatus').textContent,/没有自动评分/);
 const restored=harness(Object.fromEntries(h.storage));assert.equal(restored.els.get('#writing').value,saved.text);
});
test('page is standalone, mobile constrained, and returns to the learning map',()=>{
 assert.doesNotMatch(html,/<(?:script|link|img)[^>]+(?:src|href)=["']https?:/i);
 assert.match(html,/grid-template-columns:240px minmax\(0,1fr\)/);assert.match(html,/\.layout\{grid-template-columns:minmax\(0,1fr\)\}/);assert.match(html,/\.panel\{min-width:0/);assert.match(html,/\.map\{max-width:100%;min-width:0/);
 const href=html.match(/<a href="([^"]+)">返回学习之旅<\/a>/)?.[1];assert.equal(new URL(href,'https://example.com/learning/chinese/practice.html').pathname,'/learning/');
 assert.match(html,/设问/);assert.match(html,/不自动判断作文优劣/);assert.match(html,/不是独立掌握/);assert.match(html,/纸笔/);
});
test('all thirty objective challenges and a separate review cycle reach completion',()=>{
 const h=harness();h.run(`state.labs=topics.map(()=>true);for(const q of Q){active=q;locked=false;selection=Array.isArray(q.answer)?[...q.answer]:[q.answer];checkAnswer();}`);assert.equal(h.run('complete()'),true);assert.equal(h.run('state.solved.length'),30);assert.equal(h.run('Object.values(state.attempts).every(n=>n===1)'),true);
 h.run('state.wrong=[0,2,3];state.revisited=[]');assert.equal(h.run('complete()'),false);
 h.run(`reviewMode=true;while(pendingReview().length){showQuestion();selection=Array.isArray(active.answer)?[...active.answer]:[active.answer];checkAnswer();}`);assert.equal(h.run('complete()'),true);assert.equal(h.run('state.revisited.length'),3);
});
test('changing scene choices cannot skip the evidence check',()=>{
 const h=harness();h.run('labSelection=[]');h.els.get('#labCheck').onclick();assert.equal(h.run('state.labs[0]'),false);assert.match(h.els.get('#labFeedback').textContent,/再读一次/);
 h.run('labSelection=[2]');h.els.get('#labCheck').onclick();assert.equal(h.run('state.labs[0]'),false);assert.match(h.els.get('#labFeedback').textContent,/找到依据/);h.els.get('#labDone').onclick();assert.equal(h.run('state.labs[0]'),true);
});
test('word practice targets exam-evidenced words in new contexts, not generic vocabulary',()=>{
 const h=harness();assert.equal(h.run('Q[0].opts[Q[0].answer]'),'仿佛');assert.equal(h.run('Q[1].opts[Q[1].answer]'),'贡献');assert.equal(h.run('Q[4].opts[Q[4].answer]'),'沸腾');assert.equal(h.run('topics[0].evidence.join(",")'),'2');assert.match(h.run('Q[4].explain'),/纸上/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as math from './math.js';
import { readLocal, writeLocal } from '@yoyo/storage';
const BANK = JSON.parse(readFileSync(new URL('./bank.json', import.meta.url)));
const source = readFileSync(new URL('./engine.js', import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace('export function createGame','function createGame');
// No DOM model: the controller emits state and receives only native-capability callbacks.
function fixture(saved, { raw, denyWrite=false } = {}) {
  const timers=new Map(), browserEvents=[]; let timerId=0, state={}, now=1000, writes=0, target=null;
  const schedule=(fn,ms,repeat)=>{const id=++timerId;timers.set(id,{fn,ms,at:now+ms,repeat});return id;};
  const window={matchMedia:()=>({matches:true}),setTimeout:(fn,ms)=>schedule(fn,ms,false),clearTimeout:id=>timers.delete(id),setInterval:(fn,ms)=>schedule(fn,ms,true),clearInterval:id=>timers.delete(id)};
  let stored=raw ?? JSON.stringify(saved||{level:0,index:0,records:{},sound:false,audioVersion:3,mode:'slow'});
  const store={getItem:()=>stored,setItem:(key,value)=>{if(denyWrite)throw new Error('quota');assert.equal(key,'math24_adventure_v1');writes++;stored=value;}};
  const browser={openDialog:name=>browserEvents.push(['open',name]),closeDialog:name=>browserEvents.push(['close',name]),scrollTo:name=>browserEvents.push(['scroll',name]),capturePointer:id=>browserEvents.push(['capture',id]),releasePointer:id=>browserEvents.push(['release',id]),hitTile:()=>target};
  const context=vm.createContext({...math,BANK,window,Date:{now:()=>now},console,browser,notify:patch=>{state={...state,...patch};},readLocal:(key,fallback,validate)=>readLocal(key,fallback,validate,store),writeLocal:(key,value)=>writeLocal(key,value,store)});
  vm.runInContext(source+'\ncontroller=createGame(notify,browser)',context);
  function advance(ms){const end=now+ms;while(true){let next;for(const [id,t]of timers)if(t.at<=end&&(!next||t.at<next[1].at))next=[id,t];if(!next)break;const[id,t]=next;now=t.at;if(t.repeat)t.at+=t.ms;else timers.delete(id);t.fn();}now=end;}
  return {c:context.controller,get state(){return state;},get stored(){return JSON.parse(stored);},get raw(){return stored;},get writes(){return writes;},advance,hit:slot=>{target=slot;},timers,browserEvents};
}
function solveFirst(f){for(const[a,op,b]of [[0,'+',1],[1,'-',2],[2,'*',3]]){f.c.chooseTile(a);f.c.chooseOperator(op);f.c.chooseTile(b);}}
test('controller retains solve, teaching, next question and cleanup with no DOM dependency',()=>{
  const f=fixture();assert.equal(f.state.board.tiles.length,4);assert.equal(f.state.board.disabled,true);assert.equal(f.writes,0);
  f.c.action('startRoundBtn');solveFirst(f);
  assert.equal(f.state.feedback.ok,true);assert.equal(f.state.totalStars,3);assert.equal(f.stored.records['0-0'].stars,3);assert.equal(f.state.timerState,'答对啦');
  f.c.action('explainBtn');assert.match(f.state.solution.equation,/= 24$/);assert.ok(f.state.lesson.methods.length);assert.equal(f.state.analysisHidden,false);
  f.c.action('nextBtn');assert.equal(f.state.board.tiles.length,4);assert.match(f.state.levelTitle.subtitle,/第 2/);assert.equal(f.state.feedback,null);assert.equal(f.state.analysisHidden,true);
  f.c.destroy();assert.equal(f.timers.size,0);const old=f.state;f.c.action('hintBtn');assert.equal(f.state,old);
});
test('saved partial board survives remount; undo and reset emit declarative control state',()=>{
  const f=fixture();f.c.action('startRoundBtn');f.c.chooseTile(0);f.c.chooseOperator('+');f.c.chooseTile(1);assert.equal(f.state.undoDisabled,false);assert.equal(f.state.moveDetailsHidden,false);f.c.destroy();
  const r=fixture(f.stored);assert.equal(r.state.board.tiles.length,3);assert.equal(r.state.board.disabled,true);assert.equal(r.writes,0);r.c.action('startRoundBtn');r.c.action('undoMergeBtn');assert.equal(r.state.board.tiles.length,4);assert.equal(r.state.undoDisabled,true);assert.equal(r.state.moveDetailsHidden,true);r.c.destroy();
});
test('mode, native dialogs, visibility and timeout maintain exact timer state',()=>{
  const f=fixture();f.c.changeMode('fast');assert.equal(f.state.timeValue,'10秒');assert.equal(f.state.roundGateHidden,false);f.c.action('startRoundBtn');assert.equal(f.state.roundGateHidden,true);f.advance(2100);assert.equal(f.state.timeValue,'8秒');
  f.c.action('helpBtn');assert.equal(f.state.timerState,'已暂停');f.advance(5000);assert.equal(f.state.timeValue,'8秒');f.c.dialogClosed('helpDialog');assert.equal(f.state.timerState,'倒计时');
  f.c.visibility(true);f.advance(3000);assert.equal(f.state.timeValue,'8秒');f.c.visibility(false);f.advance(8000);assert.equal(f.state.timerState,'时间到');assert.equal(f.state.hintDisabled,true);assert.match(f.state.boardMessage,/时间到/);f.advance(1500);assert.match(f.state.levelTitle.subtitle,/第 2/);assert.equal(f.stored.round.outcomes[0],'timeout');f.c.destroy();
});
test('hint, methods, drill feedback and reflection are state-driven',()=>{
  const f=fixture();f.c.action('startRoundBtn');f.c.action('hintBtn');assert.equal(f.state.hintHidden,false);assert.match(f.state.hint,/先找线索/);f.c.action('hintBtn');f.c.action('hintBtn');assert.equal(f.state.hintDisabled,true);
  f.c.chooseMethod('factor');assert.equal(f.state.method.id,'factor');assert.equal(f.state.timerState,'已暂停');f.c.checkDrill('3/1');assert.match(f.state.drillFeedback,/正是这个目标/);f.c.chooseMethod('fraction');assert.equal(f.state.drillFeedback,'');f.c.reflect('hint');assert.equal(f.state.reflection,'hint');assert.equal(f.stored.records['0-0'].reflection,'hint');f.c.closeDialog('methodsDialog');f.c.destroy();
});
test('pointer state, cancelled drag and released capture never need DOM mutation',()=>{
  const f=fixture();const e={pointerId:7,button:0,clientX:0,clientY:0,preventDefault(){}};f.c.action('startRoundBtn');f.c.chooseOperator('+');f.c.dragDown(e,0);f.hit(1);f.c.dragMove({...e,clientX:100,clientY:100});assert.equal(f.state.drag.from,0);assert.equal(f.state.drag.to,1);assert.equal(f.state.drag.x,64);f.c.dragCancel(e);assert.equal(f.state.drag,null);assert.equal(f.state.board.tiles.length,4);
  f.advance(500);f.c.dragDown(e,0);f.c.dragMove({...e,clientX:100});f.c.dragUp({...e,clientX:100});assert.equal(f.state.drag,null);assert.equal(f.state.board.tiles.length,3);assert.equal(f.state.board.tiles.find(t=>t.slot===1).v[0],8);assert.ok(f.browserEvents.some(e=>e[0]==='release'));f.c.destroy();
});
test('invalid storage is not overwritten by mount and denied writes remain visible',()=>{
  const f=fixture(null,{raw:'{broken'});assert.equal(f.raw,'{broken');assert.equal(f.writes,0);assert.match(f.state.saveNote,/无法保存/);f.c.destroy();assert.equal(f.raw,'{broken');
  const blocked=fixture(null,{denyWrite:true});blocked.c.action('startRoundBtn');assert.equal(blocked.state.board.disabled,false);assert.match(blocked.state.saveNote,/无法保存/);blocked.c.destroy();
});
test('engine has no selectors, delegated click handlers or DOM view mutations',()=>{
  assert.doesNotMatch(source,/querySelector|textContent|innerHTML|classList|addEventListener|\.hidden\s*=|\.style\./);
});

test('duplicate native dialog close notifications do not restart the remaining time',()=>{
  const f=fixture();f.c.changeMode('fast');f.c.action('startRoundBtn');f.advance(2000);f.c.action('helpBtn');f.c.closeDialog('helpDialog');f.advance(1000);assert.equal(f.state.timeValue,'7秒');f.c.dialogClosed('helpDialog');f.advance(1000);assert.equal(f.state.timeValue,'6秒');f.c.destroy();
});

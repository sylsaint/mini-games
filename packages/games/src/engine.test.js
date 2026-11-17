import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as math from './math.js';
const BANK = JSON.parse(readFileSync(new URL('./bank.json', import.meta.url)));
const source = readFileSync(new URL('./engine.js', import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace('export function createGame','function createGame');
function fixture(saved) {
  const events=new Map(), nodes=new Map(), timers=new Map(); let timerId=0, state={};
  const node=id=> {
    if(!nodes.has(id)) nodes.set(id,{id,dataset:{},style:{},hidden:false,open:false,textContent:'',classList:{add(){},remove(){},toggle(){}},addEventListener(type,fn){events.set(id+':'+type,[...(events.get(id+':'+type)||[]),fn]);},removeEventListener(type,fn){events.set(id+':'+type,(events.get(id+':'+type)||[]).filter(x=>x!==fn));},setAttribute(){},scrollIntoView(){},showModal(){this.open=true;},close(){this.open=false;for(const fn of events.get(id+':close')||[]) fn({});},hasPointerCapture(){return false;}});
    return nodes.get(id);
  };
  const root=node('root');
  root.querySelector=selector=>selector.startsWith('#')?node(selector.slice(1)):selector==='dialog[open]'?[...nodes.values()].find(n=>n.id.endsWith('Dialog')&&n.open):null;
  root.querySelectorAll=selector=>selector==='dialog'?['mapDialog','helpDialog','methodsDialog','summaryDialog'].map(node):selector==='dialog[open]'?[...nodes.values()].filter(n=>n.id.endsWith('Dialog')&&n.open):[];
  const document=node('document');document.hidden=false;
  const window=node('window');Object.assign(window,{document,matchMedia:()=>({matches:true}),setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);},setInterval(fn){timers.set(++timerId,fn);return timerId;},clearInterval(id){timers.delete(id);}});
  let stored=JSON.stringify(saved||{level:0,index:0,records:{},sound:false,audioVersion:3,mode:'slow'});
  const localStorage={getItem:()=>stored,setItem:(key,value)=>{stored=value;}};
  const context=vm.createContext({...math,BANK,window,localStorage,Date,console,root,notify:patch=>{state={...state,...patch};}});
  vm.runInContext(source+'\ncleanup=createGame(root,notify)',context);
  const click=(dataset={},id='')=>{const button={dataset,id,closest:()=>button};for(const fn of events.get('root:click')||[]) fn({target:button});};
  return {click,node,get state(){return state;},get stored(){return JSON.parse(stored);},cleanup:()=>context.cleanup(),events,timers};
}
test('controller retains solve, teaching, next question and cleanup without browser globals at import',()=>{
  const f=fixture();assert.equal(f.state.board.tiles.length,4);assert.equal(f.state.board.disabled,true);
  f.click({},'startRoundBtn');
  for(const [a,op,b] of [[0,'+',1],[1,'-',2],[2,'*',3]]){f.click({tile:String(a)});f.click({operator:op});f.click({tile:String(b)});}
  assert.equal(f.state.feedback.ok,true);assert.equal(f.stored.records['0-0'].stars,3);
  f.click({},'explainBtn');assert.match(f.state.solution.equation,/= 24$/);assert.ok(f.state.lesson.methods.length);
  f.click({},'nextBtn');assert.equal(f.state.board.tiles.length,4);assert.match(f.state.levelTitle.subtitle,/第 2/);assert.equal(f.state.feedback,null);
  f.cleanup();assert.equal(f.timers.size,0);assert.ok([...f.events.values()].every(list=>list.length===0));
});
test('controller preserves board across unmount and re-entry',()=>{
  const f=fixture();f.click({},'startRoundBtn');f.click({tile:'0'});f.click({operator:'+'});f.click({tile:'1'});f.cleanup();
  const restored=fixture(f.stored);assert.equal(restored.state.board.tiles.length,3);assert.equal(restored.state.board.disabled,true);restored.click({},'startRoundBtn');restored.click({},'undoMergeBtn');assert.equal(restored.state.board.tiles.length,4);restored.cleanup();
});

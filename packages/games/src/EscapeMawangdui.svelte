<script>
import {onMount} from 'svelte';
import {createGame,tick,recruit,merge,buyTool,buyFood,rescueAndFeed,beginRescue,claimRescuer,redeemTreasure,CELL_COUNT,MAX_WORKERS,TREASURES,LOOT_CHANCES,getDuration} from './escape-engine.js';
let game=$state(null), revision=$state(0), selected=$state(null), message=$state(''), pulling=$state(false), restart=$state(false);
const state=$derived.by(()=>{revision;return game;});
const remaining=$derived(state?Math.max(0,Math.ceil((state.deadlineAt-state.now)/1000)):1200);
const active=$derived(state?state.workers.filter(w=>w.cell!==null):[]);
const worker=$derived(state?.workers.find(w=>w.id===selected));
const layer=$derived(state?Math.min(9,Math.floor(state.completed/60)):0);
const lootBadges={food:'🍱',worker:'👷'};
const lootNames={food:'食物包',worker:'一级小人'};
const treasureBadges={cup:'🥣',cat:'🐈',map:'🗺',painting:'🖼',robe:'👘',seal:'▣'};
const catalogue=Object.values(TREASURES);
let redeemedHere=$state({});
const pouch=$derived(catalogue.filter(item=>(state?.treasures?.[item.id]??0)>0||redeemedHere[item.id]));
const kept=$derived(pouch.reduce((total,item)=>total+(state?.treasures?.[item.id]??0),0));
const finds=$derived(state?.recentFinds??[]);
const latest=$derived(finds.at(-1));
const recentAt=$derived(new Map(finds.map(find=>[find.cell,find])));
function findName(find){return find.kind==='treasure'?TREASURES[find.treasureId]?.label:lootNames[find.kind];}
function findBadge(find){return find.kind==='treasure'?treasureBadges[TREASURES[find.treasureId]?.icon]??'◆':lootBadges[find.kind];}
function describeFind(find){
  if(find.kind==='food')return find.cache?'找到了备用口粮，补给站多了 3 份食物。':'补给站多了 3 份食物，拉绳时就能用。';
  if(find.kind==='worker')return find.queued?'队伍满了。腾出名额后，到补给站接人。':'新来的小人从 1 级开始，已加入队伍。';
  return '已放入背包，可兑换 '+TREASURES[find.treasureId]?.value+' 金币。';
}
function exchangeTreasure(item){
  refresh();
  if(!game||!redeemTreasure(game,item.id))return;
  redeemedHere={...redeemedHere,[item.id]:true};
  message='已兑换「'+item.label+'」，获得 '+item.value+' 金币！';
  revision++;
}
function welcomeRescuer(){
  action(()=>claimRescuer(game),'接到一位一级小人！招募价格不变。','队伍满了，先合成腾个名额。');
}
function refresh(){if(game){tick(game,Date.now());revision++;}}
function start(){game=createGame(Date.now());selected=game.workers[0].id;restart=false;pulling=false;redeemedHere={};message='队伍已下降，正在自动挖掘！';revision++;}
function action(fn,success,failure){refresh();if(!game||game.status!=='running'||pulling)return;message=fn()?success:failure;if(!game.workers.some(w=>w.id===selected))selected=game.workers.at(-1)?.id;revision++;}
function feed(){refresh();if(!game||game.status!=='running'||pulling)return;if(game.food<1){message='先花2金币买一包食物，再接人上来。';return;}if(!game.workers.some(w=>w.energy<60)){message='大家体力充足，先挖一会儿再吃。';return;}const group=beginRescue(game);pulling=true;revision++;message='两位地表队员正在拉绳，接工人上来吃饭…';const current=game;setTimeout(()=>{if(game!==current)return;refresh();const n=game.status==='running'?rescueAndFeed(game,group):0;pulling=false;message=n?`${n}位工人在地表吃饱，再次下井！`:'本局已结束。';revision++;},2000);}
onMount(()=>{const timer=setInterval(refresh,100);return()=>clearInterval(timer);});
</script>
<svelte:head><title>逃出马王堆 · 奇想地下城</title><meta name="description" content="招募、合成、补给，20分钟内带领挖掘队逃出虚构地下城。"/></svelte:head>
<div class="escape"><header><a href="/">← 游戏大厅</a><span>奇想地下城 · 策略小冒险</span></header><main>
<div class="heading"><div><p class="eyebrow">DIG • MERGE • ESCAPE</p><h1>逃出马王堆<span>✦</span></h1><p>挖出一条路，带大家回到阳光里。</p></div><div class="clock" class:urgent={remaining<120}><small>逃生倒计时</small><strong>{Math.floor(remaining/60).toString().padStart(2,'0')}:{(remaining%60).toString().padStart(2,'0')}</strong></div></div>
{#if !state}<section class="welcome"><div class="helmet" aria-hidden="true">⛏️</div><h2>队长，准备下井！</h2><p>带领4位一级工人，20分钟内挖完600格土方。每挖一格固定赚1金币，还有机会挖到食物包、一级小人或马王堆主题宝物。记得招募、合成和补给。</p><div class="tips"><p>👷 最多8人同时开挖，16人总容量。合成能腾出工作位。</p><p>🛒 招募从1金币起，每次加1。小铲3金币，大铲5金币。</p><p>🪢 食物2金币一包，够3人吃。两位地表队员拉绳接人进食。</p><p>◆ 主题宝物收进背包，可按各自的游戏价格换金币。</p></div><button class="primary" onclick={start}>开始冒险 · 20分钟 →</button><p class="fine">纯属虚构的地下城游戏，并非真实考古。离开页面计时不会暂停；刷新会重新开始。</p></section>
{:else}
<div class="stats"><div><small>已挖土方</small><b>{state.completed}<em> / {CELL_COUNT}</em></b></div><div><small>金币</small><b data-testid="escape-coins">● {state.coins}</b></div><div><small>食物份数</small><b data-testid="escape-food">▣ {state.food}</b></div><div><small>工作 / 总人数</small><b data-testid="escape-team">{active.length} / {state.workers.length}</b></div></div>
<progress max={CELL_COUNT} value={state.completed} aria-label="整体挖掘进度"></progress>
<div class="loot-banner" data-testid="escape-loot-latest" role="status" aria-atomic="true">
  {#if latest}
    {#key latest.cell}
      <div class="loot-ping" data-kind={latest.kind} data-treasure-id={latest.treasureId}>
        <span class="loot-icon" aria-hidden="true">{findBadge(latest)}</span>
        <span><small>{latest.kind==='treasure'?(TREASURES[latest.treasureId]?.value>=13?'稀有宝物':'宝物发现'):'挖掘发现'} · 第 {latest.cell+1} 格</small><strong>{findName(latest)}</strong> <span class="loot-caption">{describeFind(latest)}</span></span>
      </div>
    {/key}
  {:else}
    <div class="loot-empty"><span class="loot-icon" aria-hidden="true">✧</span><span><strong>留心土里的小惊喜</strong> <span class="loot-caption">每格固定 +1 金币，意外发现另算。</span></span></div>
  {/if}
</div>
{#if state.status!=='running'}<section class="outcome" role="alert"><h2>{state.status==='won'?'☀ 成功逃生！':'时间到了，挑战结束'}</h2><p>{state.status==='won'?'所有土方已清空，大家一起走向出口！':'再试一次：先补足工作位，记得给疲劳工人补给。'}</p><button class="primary" onclick={start}>重新挑战</button></section>{/if}
<div class="play-grid"><section class="mine"><div class="surface"><span>🌳 地表补给站</span><div class:pulling>🧑‍🚒 🧑‍🚒 <small>两人拉绳</small></div></div><div class="shaft" class:pulling><div class="rope"></div><div class="lift">{pulling?'🧑‍🔧 ↑':'🪣'}</div><span>{pulling?'正在上升 · 地表进食':'垂直绳索 · 安全接送'}</span></div><div class="layer-title"><b>地下第 {layer+1} 层</b><span>每层60格 · 共10层</span></div><div class="soil" aria-label={`第${layer+1}层土方示意`}>
{#each state.cells.slice(layer*60,layer*60+60) as cell,i}
  {@const absoluteCell=layer*60+i}
  {@const find=recentAt.get(absoluteCell)}
  {@const digging=active.some(w=>w.cell===absoluteCell)}
  <div class:dug={cell>=1} class:digging data-find={find?.kind} style={`--fill:${Math.round(cell*100)}%`}
    title={`土格${absoluteCell+1}：${Math.round(cell*100)}%${find?' · '+findName(find):''}`}>
    {find?(find.kind==='treasure'?'◆':find.kind==='food'?'▣':'✚'):cell>=1?'✧':digging?'⛏':''}
  </div>
{/each}</div><p class="fine">工人自动领取不同土格，当前显示开挖层。金色为挖掘中，深色为已清空。</p>
<details class="loot-log" data-testid="escape-loot-log">
  <summary>挖掘发现记录 <span>{state.bonusCounts.food+state.bonusCounts.worker+state.bonusCounts.treasure} 件</span></summary>
  {#if finds.length}
    <ol>{#each finds.slice().reverse() as find (find.cell)}
      <li data-kind={find.kind} data-treasure-id={find.treasureId}><span aria-hidden="true">{findBadge(find)}</span><b>{findName(find)}</b><small>第 {find.cell+1} 格</small></li>
    {/each}</ol>
    <p>仅显示最近 {finds.length} 件发现。</p>
  {:else}<p>还没有发现。每一格都可能有惊喜。</p>{/if}
</details></section>
<section class="control"><h2>队伍管理 <small>{state.workers.length}/{MAX_WORKERS}</small></h2><div class="workers">{#each state.workers as w}<button class:chosen={selected===w.id} class:tired={w.energy===0} onclick={()=>selected=w.id} aria-label={`选择工人${w.id}，${w.level}级`}><span>👷</span><b>Lv.{w.level}</b><small>{w.onRope?'绳索接送':w.energy===0?'待补给':w.cell===null?'候补':'开挖中'}</small><meter min="0" max="60" value={w.energy} aria-label={`工人${w.id}体力`}></meter></button>{/each}</div>
{#if worker}<div class="worker-detail"><b>工人 #{worker.id} · {worker.level}级</b><span>每格 {(getDuration(worker)/1000).toFixed(1)}秒 · 体力{worker.energy}/60</span><small>{worker.tool===2?'大铲':worker.tool===1?'小铲':'徒手'} · 每挖完1格消耗1体力</small><div class="buttons"><button disabled={state.status!=='running'||pulling||worker.tool>=1||state.coins<3} onclick={()=>action(()=>buyTool(game,worker.id,1),'装上小铲，速度提升25%！','无法购买小铲')}>小铲 · 3币</button><button disabled={state.status!=='running'||pulling||worker.tool>=2||state.coins<5} onclick={()=>action(()=>buyTool(game,worker.id,2),'装上大铲，速度提升50%！','无法购买大铲')}>大铲 · 5币</button></div></div>{/if}
<button class="primary wide" disabled={state.status!=='running'||pulling||state.coins<state.recruitCost||state.workers.length>=MAX_WORKERS} onclick={()=>action(()=>recruit(game),'新工人到位！','金币不足或队伍已满')}>＋ 招募一级工人 · {state.recruitCost}金币</button><div class="merge"><h3>同级合成 <small>二合一，最高5级</small></h3>{#each [1,2,3,4] as level}<button disabled={state.status!=='running'||pulling||state.workers.filter(w=>w.level===level).length<2} onclick={()=>action(()=>merge(game,level),`合成${level+1}级工人！`,'需要两位同级工人')}>Lv.{level} ×2 → {level+1}</button>{/each}</div>
<div class="loot-pocket" data-testid="escape-treasure-pouch">
  <div class="pouch-line">
    <div class="loot-pocket-title"><span class="treasure-mark" aria-hidden="true">◆</span><div><h3>宝物背包</h3><p>文物有真实原型；兑换价格仅用于游戏。</p></div></div>
    <b data-testid="escape-treasure-total">{kept} 件</b>
  </div>
  {#if pouch.length}
    <ul class="pouch-list">
      {#each pouch as item (item.id)}
        <li>
          <div class="pouch-name"><span aria-hidden="true">{treasureBadges[item.icon]??'◆'}</span><div><b>{item.label}</b><small>持有 <span data-testid={'escape-treasure-count-'+item.id}>{state.treasures[item.id]??0}</span> 件</small></div></div>
          <button class="treasure-sell" data-testid={'escape-treasure-sell-'+item.id} aria-label={'兑换 1 件'+item.label+'，加'+item.value+'金币'} disabled={!state.treasures[item.id]} onclick={()=>exchangeTreasure(item)}>兑换 · +{item.value} 币</button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="pouch-empty">还没挖到宝物。漆器、帛画、丝衣都可能出现。</p>
  {/if}
  <details class="treasure-catalogue">
    <summary>可发现的宝物与兑换价</summary>
    <ul>{#each catalogue as item (item.id)}
      <li><span aria-hidden="true">{treasureBadges[item.icon]??'◆'}</span><span>{item.label}</span><b>+{item.value} 币</b></li>
    {/each}</ul>
  </details>
  <div class="pending" data-testid="escape-pending-rescues" hidden={state.queuedRescuers<1}>
    <div><strong>地表等待接应：{state.queuedRescuers} 人</strong><p>{state.status!=='running'?'本局已结束。':state.workers.length>=MAX_WORKERS?'队伍满了，合成腾出名额后再来接人。':'有空位了，接一位一级小人入队吧。'}</p></div>
    <button data-testid="escape-rescuer-claim" disabled={state.status!=='running'||pulling||state.workers.length>=MAX_WORKERS||state.queuedRescuers<1} onclick={welcomeRescuer}>接一位入队</button>
  </div>
</div>
<div class="food"><h3>补给时间</h3><p>先买食物，再接最多3位体力不足的工人上来吃饭。每人吃1份，体力恢复60。</p><div class="buttons"><button disabled={state.status!=='running'||pulling||state.coins<2} onclick={()=>action(()=>buyFood(game),'买到一包食物，共3份。','需要2金币')}>买食物 · 2币 / 3份</button><button disabled={state.status!=='running'||pulling||state.food<1} onclick={feed}>{pulling?'拉绳中…':'🪢 接人上来吃饭'}</button></div></div>
</section></div><p class="message" role="status">{message}</p><details><summary>玩法与速度表</summary><p>基础每格耗时：一级10秒、二级7秒、三级5秒、四级3秒、五级1秒。所有新工人徒手。铲子增加挖掘速度：小铲×1.25，大铲×1.5。大铲替换小铲仍需5币。</p><p>8个工作位优先安排高级工人，其余候补。合成保留未完成土格的进度，不重复发金币。注意合成会减少人数，先补足工作位再升级更划算。</p><p>每完成土格固定赚1币、消耗1体力；体力耗尽停止挖掘。两位地表救援员不占队伍名额。后台计时继续，返回后补算。这里是虚构游戏，请勿模仿。</p><p>每完成一格，额外发现互斥：食物包 {(100*LOOT_CHANCES.food).toFixed(1)}%（立即入库3份）、一级小人 {(100*LOOT_CHANCES.worker).toFixed(1)}%（队伍满时先在地表等待）、宝物合计 {(100*LOOT_CHANCES.treasure).toFixed(1)}%（按种类主动兑换）。如果前16格一直没有额外发现，第16格会给一包备用口粮。发现小人不会提高招募价格。</p></details><div class="reset">{#if restart}<p>放弃本局，重新计时？</p><button onclick={()=>restart=false}>继续本局</button><button onclick={start}>确认重开</button>{:else}<button onclick={()=>restart=true}>重新开始</button>{/if}</div>
{/if}</main><footer>守护文物，从想象力开始。游戏不是考古操作指南。</footer></div>
<style>
.escape{background:#112a36;color:#f4ebd8;min-height:100vh;font-family:system-ui,sans-serif;line-height:1.6}header,main,footer{max-width:1120px;margin:auto;padding:22px}header{display:flex;justify-content:space-between;font-size:13px}a{color:#a4dcd3}.heading{display:flex;justify-content:space-between;gap:15px;align-items:center}.eyebrow{letter-spacing:.2em;color:#71cbc0;font-size:11px}h1{font-size:clamp(30px,5vw,48px);margin:8px 0}h1 span{color:#ffd16b;margin-left:12px}h2{font-size:21px;margin:0 0 15px}h3{font-size:15px}.clock{background:#1d3b48;padding:12px 20px;border:1px solid #4f7075;border-radius:18px;text-align:center}.clock small{display:block;color:#9dc0c4;font-size:11px}.clock strong{font-size:32px;font-variant-numeric:tabular-nums}.urgent{color:#ffac92;border-color:#ff8d71}.welcome{max-width:650px;text-align:center;margin:30px auto;background:#1b3a46;border:1px solid #49646b;padding:35px;border-radius:24px}.helmet{font-size:65px}.tips{text-align:left;background:#132e39;padding:15px;border-radius:15px}.fine{font-size:12px;color:#a7b9b8}button{font:inherit;font-weight:600;border:1px solid #668081;background:#244653;color:#fff4dd;border-radius:10px;padding:11px;cursor:pointer;min-height:44px}button:disabled{opacity:.4;cursor:default}button:hover:not(:disabled){background:#355d66}button:focus-visible,a:focus-visible{outline:3px solid #ffdc78;outline-offset:3px}.primary{background:#ffd16b;color:#243943;border:none}.primary:hover:not(:disabled){background:#ffe6a9}.wide{width:100%;margin-top:16px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:20px}.stats div{background:#1c3b47;padding:12px;border-radius:12px}.stats small{display:block;color:#b3cbca;font-size:11px}.stats b{font-size:23px}.stats em{font-size:12px;font-style:normal}progress{width:100%;height:12px;accent-color:#70d1b0;margin:15px 0}.play-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:22px;align-items:start}.mine{background:#6b473a;border:1px solid #9d755b;border-radius:20px;overflow:hidden}.surface{background:#3e6a59;display:flex;justify-content:space-between;padding:13px;font-size:14px}.surface small{display:block;font-size:10px;text-align:center}.shaft{height:100px;background:#263c42;position:relative;overflow:hidden}.rope{width:3px;height:100%;background:repeating-linear-gradient(#d6ad72 0 5px,#997341 5px 7px);position:absolute;left:25%}.lift{position:absolute;left:calc(25% - 15px);bottom:0;font-size:25px}.shaft span{position:absolute;left:45%;top:38px;font-size:12px;color:#a7c7be}.shaft.pulling .lift{animation:rise 2s linear}.layer-title{display:flex;justify-content:space-between;padding:15px;font-size:13px}.layer-title span{font-size:11px;color:#dfbda0}.soil{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;padding:0 15px 15px}.soil div{aspect-ratio:1;border-radius:4px;background:#b47a50;border-bottom:3px solid #895636;display:flex;align-items:center;justify-content:center;color:#e8c19c;font-size:16px}.soil div.dug{background:#26373a;border:0;color:#52645b}.soil div.digging{background:linear-gradient(to top,#e6b755 var(--fill),#b47a50 var(--fill));color:#fff;animation:dig .4s alternate infinite}.mine>.fine{padding:0 15px}.control{background:#1b3844;padding:20px;border-radius:20px}.control h2{display:flex;justify-content:space-between}.control small{font-weight:400;color:#a9c2c0;font-size:11px}.workers{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.workers button{display:grid;gap:1px;padding:7px;min-width:0;font-size:13px}.workers button span{font-size:22px}.workers button.chosen{border:2px solid #ffd16b;background:#35565c}.workers button.tired{background:#5e3d3c}meter{width:100%;height:6px}.worker-detail{display:grid;gap:3px;background:#142e38;padding:12px;margin-top:12px;border-radius:12px;font-size:13px}.buttons{display:flex;gap:8px;margin-top:8px}.buttons>*{flex:1;font-size:12px}.merge{display:grid;grid-template-columns:1fr 1fr;gap:7px}.merge h3{grid-column:1/-1;margin-bottom:2px}.merge button{font-size:12px}.food{border-top:1px solid #45606a;margin-top:15px}.food p{font-size:12px;color:#aec8c5}.message{border-radius:12px;background:#244a51;padding:12px;position:sticky;bottom:8px;box-shadow:0 4px 20px #0004;min-height:25px}.outcome{background:#376454;border:1px solid #81ceac;padding:25px;text-align:center;border-radius:20px;margin:15px 0}.reset{text-align:center;margin:20px}details{font-size:13px;color:#afc6c4}summary{cursor:pointer}footer{text-align:center;font-size:11px;color:#8eaaa9}@keyframes dig{to{transform:translateY(-1px)}}@keyframes rise{to{bottom:75px}}@media(prefers-reduced-motion:reduce){.soil div.digging,.shaft.pulling .lift{animation:none}}@media(max-width:720px){header,main,footer{padding:15px}.play-grid{grid-template-columns:1fr}.heading p:not(.eyebrow){font-size:12px}.clock{padding:10px}.clock strong{font-size:25px}.stats{grid-template-columns:repeat(2,1fr)}.stats b{font-size:20px}.welcome{padding:22px}.soil{gap:3px}.control{padding:15px}.message{font-size:13px}}

.soil div[data-find]{font-size:clamp(10px,2.6vw,15px);box-shadow:inset 0 0 0 1px currentColor}.soil div[data-find="food"]{color:#ffe098;background:#4c4230}.soil div[data-find="worker"]{color:#c0def8;background:#2b4451}.soil div[data-find="treasure"]{color:#9ff1c6;background:#2d5548}
.loot-banner{min-height:64px;margin:-5px 0 15px;border:1px solid #47636a;border-radius:13px;background:#193945;display:flex;align-items:center}
.loot-ping,.loot-empty{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;line-height:1.35;min-width:0}
.loot-ping{--loot-glow:#62c2a8;animation:lootGlow .85s ease-out;border-radius:12px}
.loot-ping[data-kind="food"]{--loot-glow:#eab95e}.loot-ping[data-kind="worker"]{--loot-glow:#a9d7fb}.loot-ping[data-kind="treasure"]{--loot-glow:#90efc1}
.loot-icon{font-size:21px;flex:0 0 38px;height:38px;display:grid;place-items:center;background:#102b35;border:1px solid #4b7175;border-radius:10px;color:#a8c6c6}.loot-ping .loot-icon{border-color:var(--loot-glow);color:var(--loot-glow);animation:lootIcon .56s ease-out}
.loot-ping small{color:var(--loot-glow);display:block;font-size:10px;letter-spacing:.06em}.loot-ping strong,.loot-empty strong{font-size:14px;color:#fff0ce}.loot-caption{color:#bad4cf;font-size:12px}
.loot-log{margin:0 14px 14px;padding:8px 10px;background:#273630;border-radius:9px;border:1px solid #99836b;font-size:12px;color:#e6d6b8}.loot-log summary{min-height:28px;font-weight:650}.loot-log summary span{margin-left:.35rem;font-size:11px;color:#b9d5c7}.loot-log ol{margin:0;padding:0;list-style:none}.loot-log li{display:flex;align-items:center;gap:8px;border-top:1px solid #666859;padding:5px 1px}.loot-log li small{margin-left:auto}.loot-log li[data-kind="treasure"] b,.loot-log li[data-kind="treasure"]>span{color:#a1f4c9}.loot-log p{margin:5px 0 2px;color:#cedacf;font-size:11px}
.loot-pocket{margin-top:15px;padding:10px 12px;background:#14363a;border:1px solid #48756b;border-radius:12px}.pouch-line,.loot-pocket-title{display:flex;align-items:center;gap:9px}.pouch-line{justify-content:space-between}.loot-pocket h3,.loot-pocket p{margin:0}.loot-pocket p{font-size:11px;color:#b4d2c7}.treasure-mark{flex:0 0 30px;color:#9ef1c8;background:#264e48;border-radius:8px;font-size:17px;display:grid;place-items:center;width:30px;height:30px}.pouch-line>b{color:#baf6d2;font-size:22px;font-variant-numeric:tabular-nums}.pouch-line>b{white-space:nowrap}.pouch-list{margin:7px 0 0;padding:0;list-style:none}.pouch-list li,.pouch-name{display:flex;align-items:center;gap:6px}.pouch-list li{justify-content:space-between;padding:5px 0;border-top:1px solid #416a65}.pouch-name b{font-size:13px}.pouch-name small{display:block;font-size:11px;color:#b4d2c7}.pouch-name>span{display:grid;place-items:center;flex:0 0 24px;color:#9ef1c8}.treasure-sell{font-size:11px;white-space:nowrap;padding:6px;border-color:#81ad9d;background:#2e5a53}.loot-pocket .pouch-empty{margin-top:.35rem}.treasure-catalogue{margin-top:.45rem;font-size:11px}.treasure-catalogue summary{min-height:32px}.treasure-catalogue ul{margin:0;padding:0;list-style:none}.treasure-catalogue li{display:grid;grid-template-columns:1.1rem minmax(0,1fr) auto;align-items:center;gap:5px;border-top:1px solid #416a65;padding:3px 0}.treasure-catalogue li b{white-space:nowrap;color:#baf6d2}.pending{margin-top:10px;border-top:1px solid #4e756e;padding-top:8px;display:flex;align-items:center;justify-content:space-between;gap:6px}.pending[hidden]{display:none}.pending strong{font-size:12px;color:#dceeea}.pending button{font-size:11px;padding:6px;white-space:nowrap}
@keyframes lootGlow{from{background:color-mix(in srgb,var(--loot-glow) 32%,#193945);box-shadow:inset 0 0 0 1px var(--loot-glow)}to{background:transparent;box-shadow:inset 0 0 0 1px transparent}}
@keyframes lootIcon{45%{transform:scale(1.16)}to{transform:none}}
@media(prefers-reduced-motion:reduce){.loot-ping,.loot-ping .loot-icon{animation:none}}
@media(max-width:720px){.loot-banner{min-height:62px}.loot-ping,.loot-empty{padding:8px 9px}.loot-caption{display:block;font-size:11px}.loot-icon{flex-basis:34px;height:34px}}
</style>

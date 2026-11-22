<script>
  import RobeArt from './TreasureRobeArt.svelte'
  import { bounds, CLOSE_BRACKET, measure, recordTrial, sumWeights, weights } from './treasure-weigh.js'

  let { onSolve } = $props()
  let selection = $state([])
  let trials = $state([])
  let exactWeights = $state([])
  let latest = $state(null)
  let feedback = $state('衣料已经安放在左盘。右盘由你配重。')
  let hintLevel = $state(0)
  let rightPan = $state(null)
  let drag = $state(null)
  let suppressClick = false
  let sum = $derived(sumWeights(selection))
  let proof = $derived(bounds(trials))
  let exactTrial = $derived(trials.find((trial) => trial.compare === 'balanced'))
  let ready = $derived(Boolean(exactTrial && proof.bracketProven))
  let tilt = $derived(!latest || latest.compare === 'balanced' ? 0 : latest.compare === 'heavier' ? 8 : -8)

  function toggle(weight) {
    latest = null
    if (selection.includes(weight)) {
      selection = selection.filter((current) => current !== weight)
    } else {
      selection = [...selection, weight]
    }
    feedback = selection.length ? '砝码就位。松开锁扣，才开始比较。' : '右盘空了，换一组砝码继续。'
  }

  function reset() {
    selection = []
    latest = null
    feedback = '已取下右盘砝码。之前的试验仍在记录里。'
  }

  function test() {
    const comparison = measure(selection)
    if (!comparison || latest) return
    latest = comparison
    const recorded = recordTrial(trials, comparison)
    const isRepeat = recorded === trials
    trials = recorded
    if (comparison.compare === 'balanced') exactWeights = [...selection]
    const premise = comparison.compare === 'balanced'
      ? '两盘齐平。现在可以确认这件长衣的重量了。'
      : comparison.compare === 'lighter'
        ? '左盘下沉，右盘上升。衣料比这组砝码重。'
        : '右盘下沉，左盘上升。衣料比这组砝码轻。'
    feedback = premise + (isRepeat ? ' 这个重量已经记录过。' : ' 已记入实验簿。')
  }

  function finish() {
    if (!ready || !exactTrial) return
    onSolve?.({ mass: exactTrial.grams, ...proof, trials: trials.map((t) => ({ ...t })), weights: [...exactWeights] })
  }

  function grab(event, weight) {
    if (!event.isPrimary || event.button !== 0) return
    suppressClick = false
    drag = { id: event.pointerId, weight, fromX: event.clientX, fromY: event.clientY, x: event.clientX, y: event.clientY, moved: false }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  function move(event) {
    if (!drag || drag.id !== event.pointerId) return
    const { clientX: x, clientY: y } = event
    drag = { ...drag, x, y, moved: drag.moved || Math.hypot(x - drag.fromX, y - drag.fromY) > 8 }
  }
  function drop(event) {
    if (!drag || drag.id !== event.pointerId) return
    const { weight, moved } = drag
    drag = null
    if (!moved) return
    suppressClick = true
    const rect = rightPan?.getBoundingClientRect()
    const x = event.clientX, y = event.clientY
    if (rect && x >= rect.left - 10 && x <= rect.right + 10 && y >= rect.top - 24 && y <= rect.bottom + 24 && !selection.includes(weight)) {
      toggle(weight)
    }
  }
  function clickWeight(event, weight) {
    if (suppressClick && event.detail !== 0) { suppressClick = false; return }
    toggle(weight)
  }
  const compareText = { lighter: '衣料偏重', heavier: '衣料偏轻', balanced: '两盘齐平' }
</script>

<section class="weigh" aria-labelledby="lab-heading">
  <header class="lead">
    <div class="section-code">鉴定室 / 仪器 01</div>
    <h2 id="lab-heading">给长衣做一份重量证明</h2>
    <p>口头说「很轻」不算证据。把砝码放上天平，记下偏轻、偏重和平衡的结果，让别人也能复核你的结论。</p>
  </header>

  <div class="apparatus">
    <div class="serial"><span aria-hidden="true"></span> <b>双盘实验台</b><small>每种砝码只有一枚</small></div>
    <div class="scale" role="group" aria-label="无刻度的双盘天平">
      <div class="lamp" aria-hidden="true"></div>
      <div class="stand" aria-hidden="true"></div>
      <div class="foot" aria-hidden="true"></div>
      <div class="needle" aria-hidden="true">
        <svg viewBox="0 0 110 56">
          <path d="M15 52a40 40 0 0 1 80 0" /><path d="m19 35 6 4m6-17 4 6m19-13v7m22 0-4 6m19 7-6 4" />
        </svg>
        <i style:--tilt={tilt * 3 + 'deg'}></i>
      </div>
      <div class="arm" style:--tilt={tilt + 'deg'}>
        <div class="tray tray-left">
          <div class="hanger" aria-hidden="true"></div>
          <div class="plate specimen" aria-label="左盘：待测衣料"><RobeArt label="待测衣料复原图" /></div>
        </div>
        <div class="tray tray-right">
          <div class="hanger" aria-hidden="true"></div>
          <div class="plate right" class:dropTarget={drag?.moved} data-testid="lab-pan" bind:this={rightPan} aria-label="右盘：砝码">
            {#each selection as weight (weight)}<span>{weight}</span>{/each}
            {#if selection.length === 0}<small>右盘</small>{/if}
          </div>
        </div>
      </div>
      <div class="hinge" aria-hidden="true"></div>
      <div class="shadow" aria-hidden="true"></div>
    </div>
    <div class="instrument-readout" data-testid="lab-result" role="status">
      <span class="indicator" class:open={latest} aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          {#if latest?.compare === 'balanced'}<path d="M5 8h10M5 12h10"/>
          {:else if latest?.compare === 'heavier'}<path d="m5 5 10 10m-6 0h6V9"/>
          {:else if latest?.compare === 'lighter'}<path d="M15 5 5 15m6 0H5V9"/>
          {:else}<path d="M6 9V7a4 4 0 0 1 8 0v2m-9 0h10v7H5z"/>{/if}
        </svg></span>
      <p><b>{latest ? compareText[latest.compare] : '锁扣未放开'}</b><br />{feedback}</p>
    </div>
  </div>

  <div class="weight-drawer">
    <div class="drawer-title">
      <div><b>砝码匣</b><small>点一下，或拖到右盘</small></div>
      <div class="total">右盘合计 <strong>{sum}</strong> 克</div>
    </div>
    <div class="weight-bank" aria-label="选择砝码" role="group">
      {#each weights as weight (weight)}
        <button
          data-testid={'lab-weight-' + weight}
          type="button"
          aria-label={(selection.includes(weight) ? '取下 ' : '放上 ') + weight + ' 克砝码'}
          aria-pressed={selection.includes(weight)}
          class:loaded={selection.includes(weight)}
          onclick={(event) => clickWeight(event, weight)}
          onpointerdown={(event) => grab(event, weight)}
          onpointermove={move}
          onpointerup={drop}
          onpointercancel={() => { drag = null; suppressClick = false }}
        ><strong>{weight}</strong><span>克</span></button>
      {/each}
    </div>
    {#if drag?.moved}<span aria-hidden="true" class="drag-ghost" style:left={drag.x + 'px'} style:top={drag.y + 'px'}>{drag.weight} 克</span>{/if}
    <div class="lab-actions">
      <button type="button" class="reset" data-testid="lab-reset" disabled={!selection.length} onclick={reset}>取下全部</button>
      <button type="button" class="primary" data-testid="lab-test" disabled={!sum || latest} onclick={test}>松扣称量 <span aria-hidden="true">⟶</span></button>
    </div>
  </div>

  <section class="notebook" aria-labelledby="lab-notebook">
    <header class="notebook-head"><h3 id="lab-notebook">实验簿</h3><span>已做 {trials.length} 种配重</span></header>
    <p>合格的证据：一组砝码比衣料轻，一组比衣料重，<strong>两组相差不超过 {CLOSE_BRACKET} 克</strong>。再找一次平衡。三种试验的顺序不限。</p>
    <div class="proof-grid">
      <div class:recorded={proof.lower !== null}><small>轻砝码 · 下界</small><strong>{proof.lower === null ? '待测' : proof.lower + ' 克'}</strong></div>
      <div class:recorded={exactTrial}><small>平衡 · 实测</small><strong>{exactTrial ? exactTrial.grams + ' 克' : '待测'}</strong></div>
      <div class:recorded={proof.upper !== null}><small>重砝码 · 上界</small><strong>{proof.upper === null ? '待测' : proof.upper + ' 克'}</strong></div>
    </div>
    {#if proof.lower !== null && proof.upper !== null}
      <p class="bracket" data-testid="lab-bracket">
        <span>{proof.lower} 克 &lt; 衣料重量 &lt; {proof.upper} 克</span>
        <span class:stamped={proof.bracketProven}>{proof.bracketProven ? '范围合格 ✓' : '相差 ' + (proof.upper - proof.lower) + ' 克，再缩小范围'}</span>
      </p>
    {/if}
    <details data-testid="lab-trials">
      <summary>翻看称量记录</summary>
      {#if trials.length}
        <ol>{#each trials as item (item.grams)}<li><b>{item.grams} 克</b><span>{compareText[item.compare]}</span></li>{/each}</ol>
      {:else}
        <p>还没有称量过。</p>
      {/if}
    </details>
  </section>

  <div class="tools">
    <button class="reset hint" type="button" data-testid="lab-hint" disabled={hintLevel === 3} onclick={() => hintLevel++}>{hintLevel ? '再给一点提示' : '翻开馆员提示'} <span aria-hidden="true">{hintLevel}/3</span></button>
    <button class="primary" type="button" data-testid="lab-finish" disabled={!ready} onclick={finish}>封存鉴定记录 <span aria-hidden="true">⟶</span></button>
  </div>
  {#if hintLevel > 0}
    <aside class="tip" data-testid="lab-hint-copy" aria-live="polite">
      {#if hintLevel === 1}
        天平只告诉你哪边更重。先把小砝码放一边，用较大的试出大概范围。
      {:else if hintLevel === 2}
        可以把 30 克和 15 克放着不动，每次只换一两块小砝码。比较两次相反的结果，看范围缩了没有。
      {:else}
        想把两头夹近，可以先试 30＋15＋2＋1，再把 2 和 1 取下，换成 4 和 1。最后在这两个总重量之间找平衡。
      {/if}
    </aside>
  {/if}
</section>

<style>
  .weigh{--paper:#f7efdd;--ink:#271e15;--muted:#685748;--line:#cebca0;--rust:#833828;--deep:#63291d;--green:#28473f;max-width:51rem;margin:auto;color:var(--ink)}
  .lead{margin-bottom:1rem}.lead h2{font-family:var(--display-font, "Songti SC", "Noto Serif SC", serif);line-height:1.18;font-size:clamp(1.65rem,5vw,2.75rem);margin:.35rem 0}.lead p{margin:.3rem 0;color:var(--muted);max-width:47ch;line-height:1.7}
  .section-code{font-size:.74rem;letter-spacing:.18em;font-weight:800;color:var(--rust)}
  .apparatus{position:relative;isolation:isolate;overflow:hidden;border:1px solid #524334;border-radius:.8rem;background:repeating-linear-gradient(0deg,transparent 0 28px,#f4c08109 29px 30px),radial-gradient(ellipse at 50% 37%,#594938 0%,#2a2b23 44%,#142722 90%);color:#f8e7be;padding:.78rem}
  .serial{display:flex;align-items:center;gap:.42rem;letter-spacing:.08em;font-size:.73rem;padding:0 .2rem}.serial span{width:.42rem;height:.42rem;border-radius:50%;background:#d9aa67;box-shadow:0 0 8px #d9aa6790}.serial small{margin-left:auto;color:#f0d2a0}
  .scale{height:clamp(9.6rem,38vw,15rem);max-width:39rem;margin:.25rem auto 0;position:relative}
  .lamp{position:absolute;width:48%;height:92%;left:26%;top:-10%;background:radial-gradient(ellipse at 50% 35%,#f0b66129,transparent 67%);pointer-events:none}
  .stand,.foot,.arm,.hinge,.tray,.needle,.shadow{position:absolute}
  .stand{top:35%;bottom:14%;left:48%;width:4%;background:linear-gradient(90deg,#725136,#f2c782 40%,#7c5937);border:1px solid #513529;border-radius:1rem;z-index:0}
  .foot{bottom:10%;left:37%;width:26%;height:13%;border-radius:55% 55% 13% 13%;border:1px solid #b48b56;background:repeating-linear-gradient(0deg,#9f653c 0 2px,#ad774a 3px 4px);box-shadow:0 4px 3px #140f0ca0;z-index:1}
  .shadow{left:8%;right:8%;bottom:5%;height:10%;border-radius:50%;background:#140f0c80;filter:blur(6px);z-index:-1}
  .needle{top:3%;left:50%;width:clamp(3.5rem,19vw,7rem);transform:translateX(-50%)}.needle svg{width:100%;height:auto;fill:none;stroke:#d4a976;stroke-width:1.8;stroke-linecap:round;opacity:.7}.needle i{width:2px;height:40%;position:absolute;left:50%;bottom:12%;background:#f9dbae;transform:rotate(var(--tilt));transform-origin:bottom;transition:transform .42s ease}
  .arm{height:8px;top:37%;left:15%;right:15%;background:linear-gradient(#ffcf82,#b4834a 46%,#74573c);border:1px solid #5b432e;border-radius:1rem;transform:rotate(var(--tilt));transition:transform .42s cubic-bezier(.3,1.4,.45,1);z-index:2}
  .hinge{z-index:3;left:50%;top:37%;width:1rem;height:1rem;border-radius:50%;transform:translate(-50%,-26%);background:radial-gradient(circle at 30% 30%,#f7d195,#9e6c35);border:1px solid #604224}
  .tray{top:2px;height:clamp(2.8rem,18vw,5.2rem);width:40%}
  .tray-left{left:0;transform:translateX(-50%) rotate(calc(0deg - var(--tilt)));transition:transform .42s cubic-bezier(.3,1.4,.45,1);transform-origin:50% 0}
  .tray-right{right:0;transform:translateX(50%) rotate(calc(0deg - var(--tilt)));transition:transform .42s cubic-bezier(.3,1.4,.45,1);transform-origin:50% 0}
  .hanger{width:93%;height:91%;margin:auto;background:#cfad75;clip-path:polygon(50% 0,1% 100%,3% 100%,50% 5%,97% 100%,99% 100%)}
  .plate{position:absolute;bottom:0;left:0;right:0;min-height:30px;display:flex;flex-wrap:wrap;justify-content:center;align-items:end;align-content:flex-end;gap:2px;padding:3px 2px;border-bottom:6px solid #ddb075;border-radius:2px 2px 35% 35%;box-shadow:0 4px 1px #39271990}
  .plate small{font-size:.63rem;font-weight:700;color:#ffdfaa}.plate.right.dropTarget{background:#f5d5991c;outline:1px dashed #f7d4a0;outline-offset:3px}
  .specimen :global(svg){position:absolute;bottom:3px;width:56%;height:auto;max-height:4.8rem;pointer-events:none}
  .plate span,.drag-ghost{display:inline-grid;place-items:center;background:linear-gradient(#e7ba78,#af7943);border:1px solid #dfba83;color:#322012;min-width:1.03rem;padding:0 .13rem;border-radius:.2rem;font-weight:820;font-size:.68rem}
  .instrument-readout{display:flex;align-items:center;gap:.62rem;padding:.54rem .68rem;background:#111d18bb;border:1px solid #b6986b55;border-radius:.45rem;font-size:.82rem;color:#e9d5b2;min-height:4.5rem}.instrument-readout p{margin:0}.instrument-readout b{font-size:.93rem;color:#fff0c8}
  .indicator{flex:0 0 2rem;display:grid;place-items:center;height:2rem;border:1px solid #bc9c6e;line-height:1;border-radius:50%;font-size:1.1rem;color:#e1bd83}.indicator svg{width:1.1rem;height:1.1rem}.indicator.open{color:#161f19;background:#e1bd83}
  .weight-drawer,.notebook{border-radius:.72rem;border:1px solid var(--line);padding:.75rem;margin:.72rem 0;background:#fff8e8}
  .drawer-title,.notebook-head,.bracket,.lab-actions,.tools{display:flex;gap:.48rem;align-items:center;justify-content:space-between;flex-wrap:wrap}
  .drawer-title small{display:block;color:var(--muted);font-size:.78rem}.total{font-size:.77rem;color:var(--muted)}.total strong{font-size:1.16rem;color:#352619;font-variant-numeric:tabular-nums}
  .weight-bank{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:.33rem;margin:.6rem 0 .75rem}
  button{cursor:pointer;font:inherit}button:disabled{cursor:default}button:focus-visible,summary:focus-visible{outline:3px solid #3d7764;outline-offset:2px}
  .weight-bank button{touch-action:none;user-select:none;min-height:48px;padding:.2rem;border:1px solid #ad8658;border-radius:.44rem;background:linear-gradient(#f9e0ac,#dbb778);color:#3c2719;box-shadow:0 2px 0 #ad8658;font-variant-numeric:tabular-nums;line-height:1.08}
  .weight-bank button strong{display:block;font-size:1.2rem}.weight-bank button span{font-size:.63rem}.weight-bank button.loaded{color:#fff4da;border-color:#274438;background:linear-gradient(#4e6c5c,#35574a);box-shadow:0 2px 0 #274438}
  .drag-ghost{position:fixed;z-index:30;pointer-events:none;transform:translate(-50%,-50%);padding:.33rem .55rem;font-size:.92rem;box-shadow:0 4px 12px #26180677}
  .primary,.reset{border-radius:.45rem;min-height:44px;padding:.43rem .72rem;font-size:.86rem;font-weight:750}
  .primary{color:#fff5db;background:var(--rust);border:1px solid var(--deep);box-shadow:0 2px 0 var(--deep)}.primary:disabled{color:#665747;background:#eadcc4;border-color:#cebaa0;box-shadow:none}.primary span{margin-left:.25rem}
  .reset{border:1px solid #ac9d84;background:#fbf2de;color:var(--green)}.reset:disabled{color:#74695a;background:#f3ebdc}.hint span{font-size:.72rem;font-weight:650;margin-left:.32rem}
  .notebook{background:repeating-linear-gradient(0deg,transparent 0 20px,#d6c8aa26 21px 22px),#faf0d9}
  .notebook-head{border-bottom:1px solid var(--line);padding-bottom:.35rem}.notebook-head h3{font-size:1.03rem;margin:0}.notebook-head span{font-size:.74rem;color:var(--muted)}.notebook p{margin:.5rem 0;font-size:.82rem;line-height:1.5}
  .proof-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.35rem}.proof-grid div{border:1px dashed #b4a187;border-radius:.38rem;text-align:center;padding:.33rem .17rem;color:#675644}.proof-grid .recorded{border-color:#627e6d;border-style:solid;background:#e5ebdc;color:#25473a}.proof-grid small{display:block;font-size:.66rem}.proof-grid strong{font-size:.88rem}
  .bracket{font-weight:780}.bracket span:last-child{font-size:.74rem}.stamped{color:#365e4e}
  details{margin:.65rem 0 0;padding-top:.35rem;border-top:1px solid var(--line);font-size:.79rem}summary{color:var(--green);font-weight:750;cursor:pointer;padding:.25rem}
  details ol{display:grid;grid-template-columns:repeat(auto-fit,minmax(6.3rem,1fr));gap:.26rem;padding:.2rem;list-style:none;margin:.32rem 0}details li{padding:.16rem .3rem;background:#fff9e9;border:1px solid #e5d6ba;border-radius:.2rem;display:flex;justify-content:space-between;gap:.2rem}
  .tip{margin:.62rem 0;padding:.6rem .7rem;border-left:3px solid #97623c;background:#f4e5c5;font-size:.82rem;color:#392a1e}
  @media(max-width:350px){.weight-bank{gap:.22rem}.weight-bank button strong{font-size:1rem}.notebook{padding:.55rem}.tools .primary{margin-left:auto}}
  @media(prefers-reduced-motion:reduce){.needle i,.arm,.tray-left,.tray-right{transition:none}}
</style>

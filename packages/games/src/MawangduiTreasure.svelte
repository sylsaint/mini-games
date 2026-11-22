<script>
  import { onMount, tick } from 'svelte'
  import FieldArt from './TreasureFieldArt.svelte'
  import RobeArt from './TreasureRobeArt.svelte'

  const stages = ['寻迹', '鉴定', '布展']
  const corners = [
    { name: '左侧土丘', x: .22, y: .66 },
    { name: '中间土丘', x: .5, y: .51 },
    { name: '右侧土丘', x: .78, y: .66 },
  ]
  const weights = [1, 5, 9, 10, 20, 40, 50]
  const labels = ['直裾素纱单衣：一件只有 49 克的长衣', '西汉漆器：一只红黑相间的食盘', '织花厚布：一块盖住底纹的布']
  const notes = ['细看织纹', '记录位置', '辨认衣襟']
  const key = 'yoyo.mawangdui-treasure.museum.v1'
  let phase = $state('intro')
  let target = $state(1)
  let light = $state(-1)
  let lit = $state([])
  let dug = $state([])
  let beam = $state(null)
  let lampPointer = $state(null)
  let scene = $state(null)
  let heading = $state(null)
  let pan = $state(null)
  let selectedWeights = $state([])
  let dragWeight = $state(null)
  let suppressWeightClick = false
  let triedHeavy = $state(false)
  let overlay = $state(0)
  let label = $state(-1)
  let labelPlaced = $state(false)
  let museumFinished = $state(false)
  let finds = $state([])
  let detour = $state(null)
  let post = $state('')
  let hint = $state(false)
  let sum = $derived(selectedWeights.reduce((a, b) => a + b, 0))
  let activeStep = $derived(phase === 'field' ? 0 : phase === 'scale' ? 1 : phase === 'gallery' || phase === 'done' ? 2 : -1)
  let tilt = $derived(sum === 49 ? 0 : Math.sign(sum - 49) * (5 + Math.min(8, Math.abs(sum - 49) / 4)))
  let clue = $derived(light < 0 ? '还没照亮任何土丘。先选一个看。' : light === target
    ? '透光，底纹看得见。布边还有一道直直的衣襟。'
    : light === (target + 1) % 3 ? '也会透光，不过这块只有弯弯的散边，没有衣襟。' : '光照过去，还是看不清底下的纹样。这块布比较厚。')

  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '{}')
      museumFinished = saved.complete === true
      finds = Array.isArray(saved.finds) ? saved.finds.filter((id) => ['lace', 'thick', 'rare', ...notes].includes(id)) : []
    } catch { /* The case is playable even if storage is blocked. */ }
  })

  function save() {
    try { localStorage.setItem(key, JSON.stringify({ complete: museumFinished, finds })) } catch { /* optional */ }
  }
  function record(id) {
    if (!finds.includes(id)) { finds = [...finds, id]; save() }
  }
  async function go(next, message = '') {
    phase = next; post = message; hint = false
    await tick()
    heading?.focus({ preventScroll: true })
    const top = heading?.getBoundingClientRect().top ?? 0
    if (top < 0 || top > innerHeight * .58) heading?.scrollIntoView({ block: 'start' })
  }
  function start(replay = false) {
    if (replay) target = (target + 1 + Math.floor(Math.random() * 2)) % 3
    light = -1; lit = []; dug = []; beam = null; lampPointer = null; selectedWeights = []
    overlay = 0; label = -1; labelPlaced = false; triedHeavy = false; detour = null
    go('field')
  }
  function inspect(i, positioned = true) {
    light = i
    if (positioned) beam = { x: corners[i].x, y: corners[i].y }
    if (!lit.includes(i)) {
      lit = [...lit, i]
      post = ''
    }
  }
  function aim(event) {
    const rect = scene?.getBoundingClientRect()
    if (!rect) return
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
    beam = { x, y }
    const spot = corners.findIndex((c) => Math.hypot((c.x - x) * 1.25, c.y - y) < .135)
    if (spot >= 0) inspect(spot, false)
  }
  function lampDown(event) {
    if (!event.isPrimary) return
    lampPointer = event.pointerId
    event.currentTarget.setPointerCapture?.(event.pointerId)
    aim(event)
  }
  function lampMove(event) {
    if (lampPointer === event.pointerId) aim(event)
  }
  function lampEnd(event) {
    if (lampPointer === event.pointerId) lampPointer = null
  }
  function excavate() {
    if (light < 0 || dug.includes(light)) return
    dug = [...dug, light]
    if (light === target) { go('scale', '找到了！直直的衣襟正是我们要找的线索。'); return }
    if (light === (target + 1) % 3) {
      record('lace'); post = '找到一小片薄纱！它也透光，但不是长衣。已放进发现记录。'
    } else {
      record('thick'); post = '找到一块厚布样片。它不透底纹，正好用来比一比。已放进发现记录。'
    }
  }
  function explore() {
    if (detour !== null) return
    const lucky = Math.random() < .01
    if (lucky) {
      detour = '额外发现：你在样品堆里直接发现了素纱单衣！'
      record('rare'); go('scale', detour)
    } else {
      const note = notes[Math.floor(Math.random() * notes.length)]
      record(note)
      detour = '额外发现：获得「' + note + '」笔记。继续用灯找长衣吧。'
    }
  }
  function toggleWeight(weight) {
    const on = selectedWeights.includes(weight)
    selectedWeights = on ? selectedWeights.filter((n) => n !== weight) : [...selectedWeights, weight]
    if (!on && weight === 50) triedHeavy = true
  }
  function weightDown(event, weight) {
    if (!event.isPrimary || event.button !== 0) return
    suppressWeightClick = false
    dragWeight = { id: event.pointerId, weight, x: event.clientX, y: event.clientY, sx: event.clientX, sy: event.clientY, moved: false }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  function weightMove(event) {
    if (dragWeight?.id !== event.pointerId) return
    dragWeight = { ...dragWeight, x: event.clientX, y: event.clientY,
      moved: dragWeight.moved || Math.hypot(event.clientX - dragWeight.sx, event.clientY - dragWeight.sy) > 7 }
  }
  function weightUp(event) {
    if (dragWeight?.id !== event.pointerId) return
    const { weight, moved } = dragWeight
    dragWeight = null
    if (!moved) return
    suppressWeightClick = true
    const rect = pan?.getBoundingClientRect()
    if (rect && event.clientX >= rect.left - 12 && event.clientX <= rect.right + 12 && event.clientY >= rect.top - 25 && event.clientY <= rect.bottom + 25 && !selectedWeights.includes(weight)) {
      toggleWeight(weight)
    }
  }
  function weightClick(event, weight) {
    if (suppressWeightClick && event.detail !== 0) { suppressWeightClick = false; return }
    toggleWeight(weight)
  }
  function placeLabel() {
    if (label < 0) return
    if (label !== 0) { post = '再看看你亲手验证的证据：展品是长衣，天平平衡时是 49 克。'; return }
    labelPlaced = true; museumFinished = true; save(); go('done')
  }
</script>

<svelte:head>
  <title>马王堆寻宝：文物侦探局 · 不到 50 克的长衣</title>
  <meta name="description" content="在虚构的考古现场用灯辨认布角、用天平称量，再为马王堆的素纱单衣布置展柜。" />
</svelte:head>

<section class="casefile" aria-label="马王堆寻宝：文物侦探局">
  <div class="mast">
    <span class="brand">马王堆寻宝 <span>·</span> 文物侦探局</span>
    <a class="back-link" href="/#games">返回游戏大厅</a>
  </div>
  <ol class="stages" aria-label="案件进度">
    {#each stages as step, i}
      <li class:current={activeStep === i} class:passed={activeStep > i || phase === 'done'} aria-current={activeStep === i ? 'step' : undefined}><span>{i + 1}</span>{step}</li>
    {/each}
  </ol>

  {#if phase === 'intro'}
    <div class="intro">
      <div class="intro-copy">
        <p class="eyebrow">展柜里，少了一件长衣</p>
        <h1 bind:this={heading} tabindex="-1">不到 50 克<br/>的长衣？</h1>
        <p>馆里收到一条线索：有件长衣，薄到能透出底纹，轻到不到 50 克。找到它，再亲手验证这个听起来不太可能的说法。</p>
        <button class="primary" data-testid="treasure-start" onclick={() => start()}>打开案件 <span aria-hidden="true">↗</span></button>
        <p class="quiet">约 3～5 分钟 · 无倒计时 · 不用注册</p>
        {#if museumFinished}<button class="subtle" onclick={() => go('done')}>查看我布置的展柜</button>{/if}
      </div>
      <div class="intro-art" aria-hidden="true">
        <span class="folio-tag">丝织样本 / 待鉴定</span>
        <div class="intro-robe"><RobeArt overlay={30}/></div>
        <span class="intro-stamp">待查</span>
      </div>
    </div>
  {:else if phase === 'field'}
    <div class="chapter">
      <p class="eyebrow">01 / 寻迹</p>
      <h1 bind:this={heading} tabindex="-1">把灯借给我。</h1>
      <p class="brief">拖动光束，或点任意一个土丘。要找的长衣，既能看见底纹，又露出一道直直的衣襟。</p>
      <div class="field" bind:this={scene}>
        <FieldArt {target} illuminated={lit} excavated={dug} {beam}/>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="lamp-zone" data-testid="treasure-lamp-field" onpointerdown={lampDown} onpointermove={lampMove} onpointerup={lampEnd} onpointercancel={lampEnd}></div>
        {#each corners as c, i}
          <button type="button" class="spot" class:active={i === light} style:left={c.x * 100 + '%'} style:top={c.y * 100 + '%'}
            data-testid={'treasure-corner-' + i} aria-label={'照亮' + c.name} aria-pressed={i === light} onclick={() => inspect(i)}>
            {dug.includes(i) ? '✓' : String.fromCharCode(65 + i)}
          </button>
        {/each}
      </div>
      <div class="analysis-panel">
        <div><span class="tool-tag">灯下观察</span><p data-testid="treasure-clue" aria-live="polite">{clue}</p></div>
        <button class="primary" data-testid="treasure-excavate" disabled={light < 0 || dug.includes(light)} onclick={excavate}>小心发掘</button>
      </div>
      {#if post}<p class="notice" role="status">{post}</p>{/if}
      <div class="extras">
        <button class="subtle" onclick={() => hint = !hint} aria-expanded={hint}>{hint ? '收起提示' : '要个提示'}</button>
        <button class="subtle" data-testid="treasure-explore" onclick={explore} disabled={detour !== null}>顺手翻翻样品堆 · 1% 意外发现</button>
      </div>
      {#if hint}<p class="notice">有两处可能会透光。别急着选第一个，记得看布边形状。</p>{/if}
      {#if detour}<p class="notice" role="status">{detour}</p>{/if}
    </div>
  {:else if phase === 'scale'}
    <div class="chapter">
      <p class="eyebrow">02 / 鉴定</p>
      <h1 bind:this={heading} tabindex="-1">长衣到底多轻？</h1>
      <p class="brief">衣服放在左盘。点砝码，或拖到右盘。先放 50 克试试，再让两边真正平衡。</p>
      {#if post}<p class="notice" role="status">{post}</p>{/if}
      <div class="lab" data-testid="treasure-scale">
        <span class="lab-card">计量台 · 克（g）</span>
        <div class="scale">
          <div class="plinth"></div>
          <div class="stand"></div>
          <div class="pivot"></div>
          <div class="balance-arm" style:transform={'rotate(' + tilt + 'deg)'}>
            <div class="scale-side left">
              <div class="cord"></div><div class="vessel">
                <div class="scale-robe"><RobeArt /></div>
              </div>
            </div>
            <div class="scale-side right">
              <div class="cord"></div><div class="vessel" data-testid="treasure-pan" bind:this={pan}>
                {#if selectedWeights.length}
                  <div class="pan-weights">{#each selectedWeights as weight}<span>{weight}</span>{/each}</div>
                {:else}<span class="ghost">放砝码</span>{/if}
              </div>
            </div>
          </div>
        </div>
        <div class="scale-readout" aria-live="polite" data-testid="treasure-scale-result">
          <strong>{sum} 克</strong>
          {#if sum === 49}<span>两边平衡！长衣重 49 克。</span>
          {:else if sum === 0}<span>右盘还是空的。</span>
          {:else if sum > 49}<span>砝码那边沉下去，长衣比 {sum} 克轻。</span>
          {:else}<span>长衣那边沉下去，长衣比 {sum} 克重。</span>{/if}
        </div>
      </div>
      <div class="weight-bank" aria-label="砝码">
        {#each weights as weight}
          <button class:selected={selectedWeights.includes(weight)} data-testid={'treasure-weight-' + weight}
            aria-pressed={selectedWeights.includes(weight)} aria-label={(selectedWeights.includes(weight) ? '取下' : '放上') + weight + '克砝码'}
            onpointerdown={(ev) => weightDown(ev, weight)} onpointermove={weightMove} onpointerup={weightUp}
            onpointercancel={() => {dragWeight = null}} onclick={(ev) => weightClick(ev, weight)}>
            <strong>{weight}</strong><span>克</span>
          </button>
        {/each}
      </div>
      {#if dragWeight?.moved}
        <div class="drag-ghost" style:left={dragWeight.x + 'px'} style:top={dragWeight.y + 'px'} aria-hidden="true">{dragWeight.weight} 克</div>
      {/if}
      <div class="extras">
        <button class="subtle" data-testid="treasure-clear" disabled={sum === 0} onclick={() => selectedWeights = []}>清空砝码</button>
        <button class="subtle" onclick={() => hint = !hint} aria-expanded={hint}>{hint ? '收起提示' : '要个提示'}</button>
        <button class="primary" data-testid="treasure-weigh-next" disabled={sum !== 49} onclick={() => go('gallery')}>带去布展 <span aria-hidden="true">→</span></button>
      </div>
      {#if hint}<p class="notice">{triedHeavy ? '49 可以用十位和个位拼出来。试试 40 克加 9 克。' : '先放上 50 克，看看哪边沉下去。再找比它略轻的组合。'}</p>{/if}
    </div>
  {:else if phase === 'gallery'}
    <div class="chapter">
      <p class="eyebrow">03 / 布展</p>
      <h1 bind:this={heading} tabindex="-1">把这件衣服讲给别人听。</h1>
      <p class="brief">拖动滑块，让有花纹的底布从长衣下面滑过。再挑一句符合刚才证据的展签。</p>
      <div class="exhibit">
        <div class="exhibit-art"><RobeArt {overlay}/></div>
        <label for="treasure-overlay">底布位置 <span>{overlay}%</span></label>
        <input id="treasure-overlay" data-testid="treasure-overlay" type="range" min="0" max="100" bind:value={overlay}/>
        <p class="quiet">这是复原示意。看看隔着这层薄纱，还能不能认出底下的纹路。</p>
      </div>
      <div class="label-list" role="group" aria-label="候选展签">
        {#each labels as text, i}
          <button class:chosen={label === i} data-testid={'treasure-label-' + i} aria-pressed={label === i} onclick={() => { label = i; post = '' }}>{text}</button>
        {/each}
      </div>
      {#if post}<p class="notice" role="status">{post}</p>{/if}
      <button class="primary" disabled={label < 0} data-testid="treasure-display" onclick={placeLabel}>把展签放进展柜</button>
    </div>
  {:else}
    <div class="chapter ending">
      <p class="eyebrow">馆藏记录 / 第一案结案</p>
      <h1 bind:this={heading} tabindex="-1">你的展柜开张了！</h1>
      <div class="exhibit finished" data-testid="treasure-complete">
        <div class="exhibit-art"><RobeArt overlay={70}/></div>
        <span class="quiet">西汉 · 马王堆一号汉墓出土</span>
        <h2>直裾素纱单衣</h2>
        <p><span class="big-number">49</span> 克</p>
        <p>{labelPlaced ? '这张展签，是你亲手称出来的。' : '这件展品已收入你的小博物馆。'}</p>
        <a href="https://www.gjrwls.com/jinghua/20250613/1118271975198818304.html" target="_blank" rel="noopener noreferrer">看文物资料 ↗</a>
      </div>
      {#if finds.length}<p class="notice">附加发现：{finds.map((id) => ({ lace: '薄纱样片', thick: '厚布样片', rare: '意外发现长衣' })[id] ?? id).join('、')}</p>{/if}
      <button class="primary" data-testid="treasure-replay" onclick={() => start(true)}>换个位置再探一次 <span aria-hidden="true">↻</span></button>
    </div>
  {/if}
  <footer>场景和发掘位置为游戏虚构 · 文物与重量有史料依据</footer>
</section>

<style>
  .casefile{--ink:#28241d;--ink-soft:#635746;--paper:#f9efdb;--paper-light:#fffaee;--border:#d9c7a5;--rust:#933c28;--rust-dark:#732d20;--green:#335b51;max-width:64rem;margin:1rem auto 2rem;padding:clamp(.85rem,2.8vw,2.1rem);border:1px solid var(--border);border-radius:1.5rem;background:radial-gradient(ellipse at 100% 0%,#f2d5a6 0%,transparent 43%),var(--paper);color:var(--ink);font-family:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;box-shadow:0 13px 35px #3925131d;line-height:1.55}
  .casefile :global(*){box-sizing:border-box}
  .mast,.stages,.extras{display:flex;align-items:center}
  .mast{justify-content:space-between;gap:.65rem;padding-bottom:.7rem;border-bottom:1px solid var(--border)}
  .brand,.eyebrow,.folio-tag,.tool-tag,.lab-card{font-size:.78rem;font-weight:760;letter-spacing:.1em}
  .brand,.eyebrow,.tool-tag{color:var(--rust-dark)}
  .brand span{padding:0 .15rem}.back-link{display:inline-flex;align-items:center;white-space:nowrap;min-height:44px;color:var(--green);font-size:.79rem;font-weight:700;text-underline-offset:.25em}
  .stages{margin:.65rem 0 1.15rem;padding:0;list-style:none;gap:1rem;color:var(--ink-soft);font-size:.85rem}
  .stages li{display:flex;align-items:center;gap:.3rem}.stages span{display:grid;place-items:center;width:1.35rem;height:1.35rem;border:1px solid var(--border);border-radius:50%;font-size:.72rem}.stages .current{font-weight:770;color:var(--rust-dark)}.stages .current span{background:var(--rust);border-color:var(--rust);color:white}.stages .passed span{background:var(--green);border-color:var(--green);color:white}
  h1,h2,p{margin:0}
  h1,h2{font-family:"Songti SC","Noto Serif SC",SimSun,serif;letter-spacing:.02em;line-height:1.15}
  h1{font-size:clamp(2rem,5.8vw,3.75rem);scroll-margin-top:1rem}
  h1:focus{outline:none}
  h2{font-size:1.55rem}.eyebrow{margin-bottom:.5rem}
  .intro{display:grid;grid-template-columns:1fr 1fr;gap:clamp(.65rem,2.5vw,2rem);align-items:stretch}
  .intro-copy{align-self:center;padding:clamp(.2rem,2vw,1.15rem) 0}
  .intro-copy h1 + p,.brief{font-size:1rem;line-height:1.7;margin:.75rem 0 1rem;max-width:48ch;color:var(--ink-soft)}
  .intro-art,.exhibit-art{position:relative;overflow:hidden;border-radius:.95rem;background:radial-gradient(ellipse at 48% 46%,#644d36,#322e26 74%);border:1px solid #6b5541}
  .intro-art::after,.exhibit-art::after{content:'';pointer-events:none;position:absolute;inset:8px;border:1px solid #f3d49c40;border-radius:.55rem}
  .intro-art{display:grid;place-items:center;min-height:14rem}
  .intro-robe{width:86%;height:auto}.folio-tag{color:#ffe8b4;position:absolute;top:1rem;left:1rem;z-index:1}
  .intro-stamp{position:absolute;right:1rem;bottom:1rem;border:2px double #fab180;color:#ffc599;padding:.15rem .45rem;border-radius:.25rem;transform:rotate(-9deg);font-family:serif;font-weight:750}
  button{font:inherit;cursor:pointer}.primary,.subtle,.label-list button{min-height:44px;border-radius:.65rem;padding:.57rem .88rem;font-weight:740;line-height:1.22}
  .primary{border:1px solid var(--rust-dark);background:var(--rust);color:#fff8ec;box-shadow:0 2px 0 var(--rust-dark)}.primary:hover:not(:disabled){background:var(--rust-dark)}.primary span{padding-left:.4rem}
  button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid #146853;outline-offset:3px}
  button:disabled{cursor:default}.primary:disabled{box-shadow:none;background:#ecdfca;border-color:#cdbb9f;color:#6b5b48}
  .quiet{font-size:.79rem;color:var(--ink-soft);margin-top:.65rem}
  .chapter{max-width:50rem;margin:auto}.chapter h1{font-size:clamp(1.8rem,5vw,3rem)}
  .field{position:relative;width:100%;aspect-ratio:5/3;border-radius:1rem;overflow:hidden;background:#4b3428;border:1px solid #6b5541}
  .field :global(svg){width:100%;height:100%;display:block}
  .lamp-zone{position:absolute;inset:0;cursor:crosshair;touch-action:none}
  .spot{position:absolute;transform:translate(-50%,35%);z-index:1;display:grid;place-items:center;min-width:44px;min-height:44px;border:1px solid transparent;border-radius:50%;background:transparent;color:#fff2c4;font-weight:800;isolation:isolate;text-shadow:0 1px 2px #281609}
  .spot::before{content:'';z-index:-1;position:absolute;inset:7px;border:1px solid #c9a873a8;border-radius:50%;background:#301d12ca}
  .spot.active::before{background:#fff1b6;border-color:#fff1b6}.spot.active{color:#3d291b;text-shadow:none}
  .analysis-panel{display:flex;align-items:center;justify-content:space-between;gap:.6rem;background:#fff8e9;border:1px solid var(--border);border-radius:.8rem;padding:.65rem .8rem;margin:.65rem 0}
  .analysis-panel p{min-height:1.5em;font-size:.9rem}.analysis-panel button{white-space:nowrap}
  .notice{background:#f4e2bc;border-left:3px solid #97613e;border-radius:.25rem;padding:.55rem .7rem;margin:.55rem 0;font-size:.9rem}
  .extras{flex-wrap:wrap;gap:.4rem;margin:.6rem 0}.subtle{border:none;background:transparent;color:var(--green);text-decoration:underline;text-underline-offset:.2em}.subtle:hover:not(:disabled){background:#3957470f}.subtle:disabled{color:#746c60;text-decoration:none}.extras .primary{margin-left:auto}
  .lab{border:1px solid #5a5346;border-radius:1rem;background:linear-gradient(#272e29,#3b4234 70%,#5d5940);color:#fff0c4;padding:.75rem;overflow:hidden}
  .lab-card{color:#f2d397}.scale{position:relative;height:clamp(8.5rem,29vw,14rem);max-width:38rem;margin:0 auto}
  .plinth,.stand,.pivot,.balance-arm{position:absolute}
  .plinth{bottom:6%;left:39%;width:22%;height:10%;border-radius:.55rem .55rem .2rem .2rem;background:linear-gradient(#cc9e5b,#87633d);border:1px solid #9b713c}
  .stand{bottom:15%;left:49%;width:2%;top:22%;background:linear-gradient(90deg,#83623a,#f9cf81,#a67741);border-radius:.4rem}
  .pivot{left:50%;top:22%;transform:translate(-50%,-35%);width:1.1rem;height:1.1rem;border-radius:50%;background:radial-gradient(circle at 32% 32%,#f3d194,#a8712f);border:1px solid #704d32;z-index:2}
  .balance-arm{height:6px;left:15%;right:15%;top:22%;background:linear-gradient(#f0c47c,#926735);border:1px solid #786143;border-radius:999px;transition:transform .35s ease}
  .scale-side{position:absolute;top:0;width:42%;height:clamp(3.8rem,14vw,6.75rem)}.left{left:0;transform:translateX(-50%)}.right{right:0;transform:translateX(50%)}
  .cord{height:90%;width:93%;margin:auto;background:#e4bf75;clip-path:polygon(50% 0,1% 100%,4% 100%,50% 6%,96% 100%,99% 100%)}
  .vessel{position:absolute;bottom:0;left:0;right:0;min-height:2.1rem;display:grid;align-items:end;justify-items:center;padding:0 .12rem .35rem;border-bottom:5px solid #e3b56d;border-radius:0 0 28% 28%}
  .scale-robe{width:55%;position:absolute;bottom:0;pointer-events:none;filter:drop-shadow(0 0 3px #2f211c)}
  .ghost{color:#ead6a8;font-size:.76rem}.pan-weights{display:flex;flex-wrap:wrap;justify-content:center;gap:.13rem;max-width:100%}
  .pan-weights span,.drag-ghost{min-width:1.27rem;padding:0 .16rem;border:1px solid #e1bc82;border-radius:.2rem;background:#a07242;color:#fff8dd;text-align:center;font-weight:780;font-size:.74rem}
  .scale-readout{display:flex;gap:.45rem .8rem;align-items:center;flex-wrap:wrap;min-height:2.6rem;padding:.3rem .58rem;border-radius:.5rem;background:#171f1ba8;color:#fff0c4}
  .scale-readout strong{font-variant-numeric:tabular-nums;font-size:1.22rem}.scale-readout span{font-size:.85rem}
  .weight-bank{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:clamp(.15rem,1.2vw,.55rem);margin:.65rem 0}
  .weight-bank button{min-height:44px;padding:.2rem .05rem;background:#e2c799;border:1px solid #a78959;box-shadow:0 2px 0 #af8f61;border-radius:.48rem;color:#34261c;touch-action:none;user-select:none}.weight-bank button strong{font-variant-numeric:tabular-nums;font-size:clamp(.98rem,3.8vw,1.22rem)}.weight-bank button span{font-size:.67rem;margin-left:.12rem}
  .weight-bank button.selected{background:#3d685d;color:white;border-color:#305348;box-shadow:0 2px 0 #305348}
  .drag-ghost{position:fixed;transform:translate(-50%,-50%);pointer-events:none;z-index:20;padding:.25rem .5rem;font-size:.95rem}
  .exhibit{border:1px solid var(--border);border-radius:.86rem;background:#fff9ec;padding:.65rem;margin:.7rem 0}.exhibit-art{display:grid;align-items:center;justify-items:center;padding:.55rem;min-height:10rem}.exhibit-art :global(svg){width:min(80%,32rem);max-height:16rem}
  .exhibit label{display:flex;justify-content:space-between;font-size:.82rem;font-weight:780;margin:.5rem 0 0}.exhibit input{display:block;width:100%;margin:0;min-height:44px;accent-color:var(--rust)}
  .exhibit .quiet{margin:.27rem 0 0}.label-list{display:grid;gap:.35rem;margin:.7rem 0}.label-list button{border:1px solid var(--border);background:var(--paper-light);color:var(--ink);text-align:left}.label-list button.chosen{border-color:var(--green);background:#e3ecdf;box-shadow:inset 4px 0 var(--green)}
  .finished{text-align:center}.finished .quiet{display:block;margin:.6rem 0 .25rem}.finished a{display:inline-block;margin:.3rem 0;color:var(--green);min-height:44px;padding:.5rem}.big-number{color:var(--rust);font-family:Georgia,serif;font-size:2.6rem;font-weight:740;line-height:1.2}.ending>.primary{margin-top:.5rem}
  footer{border-top:1px solid var(--border);padding-top:.62rem;margin-top:1.25rem;color:var(--ink-soft);font-size:.75rem}
  @media(max-width:550px){.casefile{margin:.5rem 0 1.2rem;border-radius:1rem}.intro{grid-template-columns:1fr}.intro-art{min-height:9rem;max-height:13rem;grid-row:1}.intro-robe{width:min(71%,15rem)}.intro-copy h1 br{display:none}.intro-copy h1 + p,.brief{margin:.45rem 0 .68rem}.stages{margin:.52rem 0 .75rem}.brand,.folio-tag{letter-spacing:.045em}.weight-bank button span{display:none}.analysis-panel{padding:.55rem}.analysis-panel p{font-size:.83rem}.spot{transform:translate(-50%,9%)}}
  @media(prefers-reduced-motion:reduce){.balance-arm{transition:none}}
</style>

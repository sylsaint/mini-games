<script>
  import { onMount, tick } from "svelte";
  import Investigation from "./TreasureInvestigation.svelte";
  import WeighLab from "./TreasureWeighLab.svelte";
  import Restoration from "./TreasureRestoration.svelte";
  import RobeArt from "./TreasureRobeArt.svelte";

  const key = "yoyo.mawangdui-detective.case-01.v2";
  const chapter = [
    { key: "field", num: "01", title: "证物室", phrase: "哪些线索只有放在一起，才指向同一件东西？" },
    { key: "weigh", num: "02", title: "计量室", phrase: "别先写下答案，先让天平说话。" },
    { key: "restore", num: "03", title: "复原台", phrase: "修好样布，再区分证据和猜测。" },
  ];
  let mounted = $state(false);
  let screen = $state("brief");
  let investigation = $state(null);
  let weighing = $state(null);
  let exhibit = $state(null);
  let anchor = $state(null);
  let promptReset = $state(false);
  let savedScreen = $derived(exhibit ? "museum" : weighing ? "restore" : investigation ? "weigh" : "field");
  let step = $derived(chapter.findIndex((s) => s.key === screen));

  onMount(() => {
    try {
      const old = JSON.parse(localStorage.getItem(key) || "{}");
      if (old.investigation?.index >= 0 && Array.isArray(old.investigation.evidence)) investigation = old.investigation;
      if (investigation && old.weighing?.mass === 49 && Array.isArray(old.weighing.trials)) weighing = old.weighing;
      if (weighing && old.exhibit?.fragment) exhibit = old.exhibit;
    } catch { /* no persistence in privacy-limited browser contexts */ }
    mounted = true;
  });
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify({
        investigation: $state.snapshot(investigation),
        weighing: $state.snapshot(weighing),
        exhibit: $state.snapshot(exhibit),
      }));
    } catch { /* the game is playable even if local saving fails */ }
  }
  async function resume(where) {
    screen = where; promptReset = false;
    await tick();
    anchor?.focus({ preventScroll: true });
    if (where !== "brief") anchor?.scrollIntoView({ block: "start" });
  }
  function identify(report) {
    investigation = report; save(); resume("weigh");
  }
  function weigh(report) {
    weighing = report; save(); resume("restore");
  }
  function close(report) {
    exhibit = report; save(); resume("museum");
  }
  function restart() {
    investigation = null; weighing = null; exhibit = null;
    save(); resume("field");
  }
</script>

<svelte:head>
  <title>马王堆寻宝：文物侦探局 · 错放的封签</title>
  <meta name="description" content="受马王堆真实出土文物启发的多阶段考古推理游戏。查证封签和织纹、操作天平并修复织样，写出有证据的结案报告。"/>
</svelte:head>

<div class="case">
  <header class="top">
    <a href="/#games">← 游戏大厅</a>
    <span class="top-title">马王堆寻宝 · 文物侦探局</span>
    {#if screen !== "brief"}<button class="text-button" onclick={() => resume("brief")}>案件封面</button>{:else}<span class="tag">第 01 案</span>{/if}
  </header>
  <main>
    {#if screen === "brief"}
      <section class="cover" aria-labelledby="case-title">
        <div class="hero-copy">
          <p class="eyebrow"><span></span> 馆藏复核 · HAN TEXTILE ARCHIVE</p>
          <h1 id="case-title" bind:this={anchor} tabindex="-1">错放的<br/><em>封签</em></h1>
          <p class="premise">一张展品封签落在四个布包之间。有人想随手贴回去，馆员把它拦了下来：「别猜，这几件连我都容易认错。找证据。」</p>
          <p class="description">没有一步一步的答案。用物件、记录和你自己的试验，找出哪一包该进展柜。</p>
          <button class="gold" data-testid="treasure-start" disabled={!mounted} onclick={() => resume(savedScreen)}>
            {exhibit ? "打开我的展柜" : investigation ? "继续调查" : "接下案件"} <span aria-hidden="true">↗</span>
          </button>
          {#if investigation}
            <button class="text-button reset" onclick={() => promptReset = !promptReset}>重开调查</button>
          {/if}
          {#if promptReset}
            <div class="reset-panel">
              <p>重开会清空这次新版调查。保留现有展柜，还是从证物室重来？</p>
              <button class="gold" onclick={restart}>从头调查</button><button class="text-button" onclick={() => promptReset = false}>取消</button>
            </div>
          {/if}
          <p class="spec">观察推理 · 实验验证 · 无倒计时</p>
        </div>
        <div class="hero-plate" aria-hidden="true">
          <div class="plate-id">织物标本 / 尚未鉴定</div>
          <div class="rings"></div>
          <div class="hero-robe"><RobeArt overlay={52}/></div>
          <div class="seal">待<br/>验</div>
          <div class="plate-edge">INVESTIGATION FILE <b>01</b></div>
        </div>
      </section>
      <div class="chapters" aria-label="案件的三个空间">
        {#each chapter as item}<div class="chapter-chip"><span>{item.num}</span><strong>{item.title}</strong><p>{item.phrase}</p></div>{/each}
      </div>
    {:else}
      <ol class="progress" aria-label="案件进度">
        {#each chapter as item, i}
          <li class:active={step === i} class:past={step > i || screen === "museum"} aria-current={step === i ? "step" : undefined}>
            <span>{step > i || screen === "museum" ? "✓" : item.num}</span>{item.title}
          </li>
        {/each}
      </ol>
      {#if step >= 0}
        <h1 class="sr-only" bind:this={anchor} tabindex="-1">{chapter[step].title}</h1>
      {/if}
      <div class="desk" class:final={screen === "museum"}>
        {#if screen === "field"}
          <Investigation onSolve={identify}/>
        {:else if screen === "weigh"}
          <WeighLab onSolve={weigh}/>
        {:else if screen === "restore"}
          <Restoration {investigation} {weighing} onSolve={close}/>
        {:else}
          <div class="finished" data-testid="treasure-complete">
            <div class="display"><RobeArt overlay={100}/><span>馆藏复原示意 · RESTORED STUDY</span></div>
            <div class="report">
              <p class="eyebrow"><span></span> 案件 01 / 勘验完成</p>
              <h1 bind:this={anchor} tabindex="-1">直裾素纱单衣</h1>
              <p class="origin">西汉 · 长沙马王堆一号汉墓出土</p>
              <p><strong class="mass">49</strong> 克。这个数字是你称出来的。</p>
              <ul>
                <li>不能只认封签。你对照了衣襟、透光和封签的记录。</li>
                <li>不能用「看着轻」代替测量。天平留下了 {weighing?.trials?.length ?? 0} 次试验记录，最接近的两组对照是 {weighing?.lower ?? "—"} 克和 {weighing?.upper ?? "—"} 克。</li>
                <li>不能把猜测写进展柜。灯下的底纹说明「透」，平衡的天平验证「重」；复原样布让观众能看清线迹。</li>
              </ul>
              {#if investigation?.detour === "spare-rubbing"}<p class="bonus">附录 · 已收藏罕见的备用印样</p>{/if}
              <a href="https://www.gjrwls.com/jinghua/20250613/1118271975198818304.html" target="_blank" rel="noopener noreferrer">看真实文物档案 ↗</a>
              <button class="text-button" onclick={() => resume("brief")}>回到案卷</button>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </main>
  <footer><span>馆藏复核档案 01 / 马王堆</span><span>人物、封签和调查场景为游戏虚构；展品名称、出土地与重量来自文物资料。</span></footer>
</div>

<style>
  .case{--coal:#202c2b;--soft:#e1cfaa;--gold:#e9ca8d;--cream:#f8eedb;--red:#964b35;min-height:100svh;color:#ede1c5;background:
    radial-gradient(ellipse at 18% 14%,#3b4b43,transparent 58%),#192524;
    font-family:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;line-height:1.6}
  .top,main,footer{width:min(100% - 2rem,68rem);margin:0 auto}
  .top{display:flex;align-items:center;justify-content:space-between;gap:.5rem;min-height:3.6rem;border-bottom:1px solid #a7916452;font-size:.79rem}
  .top a,.top button{color:#f0d4a0;font-weight:700;text-decoration:none}
  .top-title{color:#f3e5c4;letter-spacing:.09em;font-weight:750;text-align:center}
  .tag{background:#644b37;color:#ffe2ac;padding:.15rem .41rem;border-radius:.3rem;white-space:nowrap}
  main{padding:clamp(.9rem,3vw,2.5rem) 0 1rem}
  .cover{display:grid;grid-template-columns:1.03fr 1fr;gap:clamp(1rem,4vw,3rem);align-items:center}
  .hero-copy{padding:clamp(.35rem,1.7vw,1.25rem) 0}
  .eyebrow{font-size:.71rem;letter-spacing:.14em;font-weight:810;color:#eac687;margin:0 0 .5rem}
  .eyebrow span{display:inline-block;width:.57rem;height:.57rem;margin-right:.36rem;transform:rotate(45deg);background:#c48556}
  h1{font-family:"Songti SC","Noto Serif SC",SimSun,serif;font-size:clamp(3rem,9.1vw,6.4rem);margin:.1rem 0;line-height:.98;letter-spacing:.04em;font-weight:850}
  h1:focus,.sr-only:focus{outline:none}
  h1 em{font-style:normal;color:#edc58d}
  .premise{font-size:clamp(1rem,2vw,1.17rem);font-weight:690;color:#f9ecd1;margin:1rem 0 .55rem;max-width:35ch}
  .description,.spec{font-size:.85rem;color:#dacba9;margin:.5rem 0;max-width:37ch}
  .spec{margin-top:.85rem;letter-spacing:.07em}
  .gold,.text-button{font:inherit;min-height:44px;border-radius:.6rem;padding:.47rem .85rem;font-weight:760;cursor:pointer}
  .gold{background:#e9c487;color:#2d2921;border:1px solid #edca97;box-shadow:0 3px 0 #846341;margin-top:.52rem}
  .gold span{margin-left:.65rem}
  .gold:disabled{opacity:.55;cursor:default}
  .text-button{border:1px solid transparent;background:transparent;color:inherit;text-decoration:underline;text-underline-offset:.24em}
  a:focus-visible,button:focus-visible{outline:3px solid #c68b55;outline-offset:3px}
  .reset{margin-left:.4rem}
  .reset-panel{margin-top:.65rem;padding:.66rem .85rem;border:1px solid #a188576b;border-radius:.6rem;background:#1c2727;font-size:.85rem}
  .reset-panel p{margin:0}
  .hero-plate{position:relative;display:grid;place-items:center;min-height:15.5rem;aspect-ratio:1.14;border:1px solid #bd9c5a91;border-radius:.75rem;overflow:hidden;
    background:radial-gradient(ellipse at 52% 51%,#725038,#342e26 70%),#342e26;box-shadow:0 12px 45px #101918a5}
  .hero-plate:after{content:"";position:absolute;inset:.47rem;border:1px solid #d6b7735c;border-radius:.44rem;pointer-events:none}
  .plate-id,.plate-edge{position:absolute;font-size:.68rem;font-weight:800;letter-spacing:.13em;color:#edcca0;z-index:1}
  .plate-id{left:1.2rem;top:.9rem}.plate-edge{left:1.2rem;bottom:.8rem}.plate-edge b{color:#f7d19a;margin-left:.37rem}
  .rings{position:absolute;width:71%;aspect-ratio:1;border:1px dashed #d8ba7a82;border-radius:50%;box-shadow:inset 0 0 0 12px #4b3c312d;transform:rotate(-9deg)}
  .hero-robe{position:relative;width:89%;padding:1rem}
  .seal{position:absolute;right:1.55rem;bottom:1.4rem;padding:.25rem .5rem;border:3px double #ebb58a;border-radius:.23rem;color:#f0bb97;background:#753d32bb;transform:rotate(9deg);font:750 1.1rem/1.1 serif}
  .chapters{display:grid;grid-template-columns:repeat(3,1fr);gap:.62rem;margin:1.55rem 0 .35rem}
  .chapter-chip{padding:.65rem .75rem;border:1px solid #a8905e70;border-radius:.7rem;background:#2d3937}
  .chapter-chip span{font-family:Georgia,serif;color:#e4bf7c;font-size:.86rem;margin-right:.55rem}
  .chapter-chip strong{color:#fbefd0}
  .chapter-chip p{font-size:.78rem;color:#d4c39e;margin:.35rem 0 0}
  .progress{display:flex;justify-content:space-between;gap:.42rem;list-style:none;margin:0 0 .72rem;padding:0;font-size:.79rem}
  .progress li{display:flex;align-items:center;gap:.4rem;color:#d4c9ad}
  .progress li span{display:grid;place-items:center;width:1.57rem;height:1.57rem;border:1px solid #9c8760;border-radius:50%;font:700 .72rem Georgia,serif}
  .progress .active{color:#f6d396;font-weight:800}.progress .active span{background:#eac789;color:#312c22}
  .progress .past span{background:#436658;border-color:#6c8975;color:#fff4d0}
  .desk{padding:clamp(.75rem,3vw,1.9rem);border:1px solid #b49a69;border-radius:.84rem;background:radial-gradient(ellipse at 95% 0%,#f2dbad,transparent 48%),#f7ecd7;color:#292c29;box-shadow:0 13px 31px #1019188c;overflow-wrap:anywhere}
  .finished{display:grid;grid-template-columns:1.04fr 1fr;gap:clamp(.75rem,3vw,2rem);align-items:center}
  .finished h1{font-size:clamp(1.7rem,5.7vw,3.3rem);line-height:1.1;color:#24352e}
  .report .eyebrow{color:#934f35}
  .report p{margin:.35rem 0}.origin,.bonus{font-size:.8rem;color:#6a563f;font-weight:740}.report ul{margin:.7rem 0;padding-left:1.15rem;font-size:.9rem;color:#5a5142}
  .report a,.report button{display:inline-flex;align-items:center;min-height:44px;color:#305a4e;font-size:.89rem}
  .mass{font:800 2.3rem Georgia,serif;color:#934933}
  .display{min-height:13rem;display:grid;align-content:center;gap:.6rem;padding:1.2rem .72rem;border-radius:.72rem;border:1px solid #ba9d62;background:radial-gradient(ellipse at 55% 45%,#60513a,#242d2a 75%);color:#f0d3a2;text-align:center;font-size:.73rem;font-weight:780;letter-spacing:.12em}
  footer{padding:1rem 0 1.35rem;border-top:1px solid #a7916460;display:flex;flex-wrap:wrap;gap:.45rem 1rem;color:#d5c7a6;font-size:.73rem}
  footer span:first-child{font-weight:780}
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  @media(max-width:630px){.top,main,footer{width:min(100% - 1.15rem,68rem)}.cover,.finished{grid-template-columns:1fr}.cover{gap:1rem}.hero-plate{min-height:10.2rem;max-height:13rem;aspect-ratio:auto;grid-row:1}.hero-robe{max-width:19rem}.rings{max-width:15rem}.hero-copy h1 br{display:none}.hero-copy h1{font-size:clamp(2.35rem,11vw,4rem)}.hero-copy{padding:0 .25rem}.chapter-chip{padding:.46rem .47rem}.chapter-chip p{font-size:.72rem;line-height:1.45}.top-title{letter-spacing:0}.top button{padding-inline:0}.top,.progress{font-size:.72rem}}
</style>

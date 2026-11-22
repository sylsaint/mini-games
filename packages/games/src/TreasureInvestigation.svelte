<script>
  import { tick } from "svelte";
  import WorkshopArt from "./TreasureWorkshopArt.svelte";
  import EvidenceArt from "./TreasureEvidenceArt.svelte";

  let { onSolve, active = true, layout = [0, 1, 2, 3] } = $props();

  // Deliberately constructed distractors: each decoy satisfies exactly two
  // clues. No pair of clues uniquely identifies the garment.
  const profiles = [
    { transmits: true, straight: true, seal: false },
    { transmits: true, straight: false, seal: true },
    { transmits: true, straight: true, seal: true },
    { transmits: false, straight: true, seal: true },
  ];
  const referenceSample = profiles[2];
  const sites = [
    { name: "甲", x: 20, y: 57 },
    { name: "乙", x: 43, y: 43 },
    { name: "丙", x: 65, y: 57 },
    { name: "丁", x: 83, y: 42 },
  ];
  const tools = [
    {
      id: "light", icon: "◉", name: "透光灯", refName: "夹着棋格的布样", mode: "cloth",
      active: "菱形底纹还能看见", other: "菱形底纹被遮住了",
      reference: "透过档案布样，仍能辨认后面三枚菱形的轮廓。",
      look: "推亮背光。别看布有多亮，看它后面的菱形底纹还在不在。",
      archive: "档案夹里有一块留下的布样。推亮背光，看看它会不会挡住后面的菱形。",
      advice: "对照布样和你照过的待验布。要比的是底下的菱形，不是布的颜色。",
    },
    {
      id: "hem", icon: "⌑", name: "描边尺", refName: "缺了一角的衣襟图", mode: "hem",
      active: "边和直线贴合", other: "末端拐开了",
      reference: "残图里，两处针脚能连成直线。描边尺与布缘贴合。",
      look: "滑动描边尺，让它贴近布缘。留意快到末端时会不会拐弯。",
      archive: "把尺滑到两处针脚前，试着将残图的轮廓接起来。",
      advice: "上半段都可能是直的。把尺滑到底，检查布缘最后一段。",
    },
    {
      id: "seal", icon: "◍", name: "印记板", refName: "倒放的交接印样", mode: "seal",
      active: "开口弧，里面三点", other: "闭合圈，里面两点",
      reference: "正过来是一个开口的弧，弧里有三点。这是游戏里交接用的印记。",
      look: "转正印记板，观察外圈是否开口，再数里面的点。只看一个特征容易认错。",
      archive: "转正交接单上的印样，记下外圈有没有开口、里面有几点。",
      advice: "借来的布也可能很薄、衣襟也很直。再看它的印记能不能和交接单对上。",
    },
  ];

  let desk = $state("field");
  let chosen = $state(-1);
  let kind = $state("light");
  let archiveKind = $state("light");
  let referenceStrength = $state(0);
  let strength = $state(0);
  let archive = $state({});
  let findings = $state({});
  let pinned = $state({});
  let feedback = $state("");
  let hints = $state(0);
  let solved = $state(false);
  let detour = $state(null);
  let surfaceGesture = $state(null);
  let inspectionTitle = $state(null);
  let sceneSurface = $state(null);
  let archiveTitle = $state(null);

  let tool = $derived(tools.find((item) => item.id === kind));
  let archiveTool = $derived(tools.find((item) => item.id === archiveKind));
  let sample = $derived(chosen >= 0 ? profiles[layout[chosen]] : null);
  let inspected = $derived(Object.keys(findings).filter((index) => Object.keys(findings[index]).length).map(Number));
  let currentPins = $derived(chosen >= 0 ? (pinned[chosen] ?? []) : []);
  let completedArchive = $derived(Object.keys(archive).length);
  let validBundle = $derived(chosen >= 0 && sample && !solved && active);

  function indication(id, match) {
    const t = tools.find((item) => item.id === id);
    return match ? t.active : t.other;
  }
  function observed(id, profile) {
    return id === "light" ? profile.transmits : id === "hem" ? profile.straight : profile.seal;
  }
  async function changeDesk(next) {
    if (desk === next) return;
    desk = next;
    feedback = "";
    await tick();
    const title = next === "archive" ? archiveTitle : sceneSurface;
    title?.focus({ preventScroll: true });
    const rect = title?.getBoundingClientRect();
    if (rect && (rect.top < 0 || rect.top > window.innerHeight * .72)) title?.scrollIntoView({ block: "start" });
  }
  async function choose(index) {
    chosen = index;
    feedback = "";
    strength = findings[index]?.[kind] === undefined ? 0 : 100;
    await tick();
    const rect = inspectionTitle?.getBoundingClientRect();
    if (!rect) return;
    inspectionTitle?.focus({ preventScroll: true });
    if (rect.top > window.innerHeight * .68) inspectionTitle?.scrollIntoView({ block: "start" });
  }
  function changeTool(id) {
    kind = id;
    feedback = "";
    strength = findings[chosen]?.[id] === undefined ? 0 : 100;
  }
  function chooseReference(id) {
    archiveKind = id;
    referenceStrength = archive[id] ? 100 : 0;
  }
  function revealReference(value) {
    referenceStrength = value;
    if (referenceStrength >= 85 && !archive[archiveKind]) {
      archive = { ...archive, [archiveKind]: true };
      feedback = "";
    }
  }
  function observe(value) {
    strength = value;
    if (strength < 85 || !validBundle || findings[chosen]?.[kind] !== undefined) return;
    findings = { ...findings, [chosen]: { ...findings[chosen], [kind]: observed(kind, sample) } };
    feedback = "";
  }
  function manipulateStart(event, archiveMode) {
    if (!event.isPrimary || event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const angle = Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2));
    surfaceGesture = {
      pointer: event.pointerId, archiveMode, startX: event.clientX, angle, travelled: 0,
      initialValue: archiveMode ? referenceStrength : strength,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function manipulateMove(event) {
    if (surfaceGesture?.pointer !== event.pointerId) return;
    const state = surfaceGesture;
    const rect = event.currentTarget.getBoundingClientRect();
    const mode = state.archiveMode ? archiveKind : kind;
    const width = Math.max(60, rect.width * .54);
    let movement = (event.clientX - state.startX) / width * 100;
    if (mode === "seal") {
      const angle = Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2));
      const change = Math.atan2(Math.sin(angle - state.angle), Math.cos(angle - state.angle));
      surfaceGesture = { ...state, angle, travelled: state.travelled + Math.min(.55, Math.abs(change)) };
      movement = Math.max(movement, surfaceGesture.travelled * 100 / 1.65);
    }
    const value = Math.min(100, Math.max(0, Math.round(movement + state.initialValue)));
    if (state.archiveMode) revealReference(value);
    else observe(value);
  }
  function manipulateEnd(event) {
    if (surfaceGesture?.pointer === event.pointerId) surfaceGesture = null;
  }
  function searchShelf() {
    if (!active || solved || detour) return;
    detour = Math.random() < .01 ? "spare-rubbing" : "workshop-note";
  }
  function togglePin(id) {
    if (!validBundle || !archive[id] || findings[chosen]?.[id] === undefined) return;
    const next = currentPins.includes(id) ? currentPins.filter((item) => item !== id) : [...currentPins, id];
    pinned = { ...pinned, [chosen]: next };
    feedback = "";
  }
  function submit() {
    if (!validBundle || currentPins.length !== tools.length) return;
    const conflicts = tools.filter((t) => !findings[chosen][t.id]);
    if (conflicts.length) {
      const conflict = conflicts[0];
      feedback = "有一条对不上：" + sites[chosen].name + "包的" + conflict.name +
        "记录是「" + conflict.other + "」，但档案要的是「" + conflict.active + "」。保留这条排除证据，再换一包看看。";
      return;
    }
    solved = true;
    feedback = "三条证据同时对上。已经封存记录，可以去鉴定室了。";
    onSolve?.({
      index: chosen, inspectedCount: inspected.length,
      detour,
      evidence: tools.map((t) => ({ kind: t.id, title: t.name, detail: t.active })),
    });
  }
</script>

<div class="investigation" aria-label="织物勘查现场">
  <nav class="worktabs" aria-label="勘查工具台">
    <button class:current={desk === "field"} type="button" aria-pressed={desk === "field"} data-testid="investigate-field" onclick={() => changeDesk("field")}><span aria-hidden="true">⌖</span> 工坊现场</button>
    <button class:current={desk === "archive"} type="button" aria-pressed={desk === "archive"} data-testid="investigate-archive" onclick={() => changeDesk("archive")}><span aria-hidden="true">▤</span> 打开档案抽屉 <small>{completedArchive}/3</small></button>
  </nav>

  {#if desk === "archive"}
    <section class="archive" aria-label="物证档案抽屉">
      <div class="panel-title"><span>01 / 档案室</span><h3 tabindex="-1" bind:this={archiveTitle}>没写名字的交接单</h3><p>原来的名字已经模糊。抽屉只留下三份可以和样品对照的物证。</p></div>
      <div class="drawer" data-testid="investigate-drawer" role="group" aria-label="档案抽屉里的物件">
        {#each tools as t}
          <button type="button" class:current={archiveKind === t.id} aria-pressed={archiveKind === t.id} data-testid={"investigate-reference-" + t.id} onclick={() => chooseReference(t.id)}>
            <span class="archive-icon" aria-hidden="true">{t.icon}</span> {t.refName}{#if archive[t.id]}<span class="check" aria-label="已记录">✓</span>{/if}
          </button>
        {/each}
      </div>
      <div class="evidence-card archive-art">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="artbox manipulator" class:turn={archiveKind === "seal"} onpointerdown={(event) => manipulateStart(event, true)} onpointermove={manipulateMove} onpointerup={manipulateEnd} onpointercancel={manipulateEnd}>
          <EvidenceArt sample={referenceSample} mode={archiveTool.mode} strength={referenceStrength}/>
          <span class="gesture" aria-hidden="true">{archiveKind === "seal" ? "绕着印样转动 ↻" : "在图上往右拖 →"}</span>
        </div>
        <label>{archiveTool.archive}<input type="range" min="0" max="100" value={referenceStrength} oninput={(event) => revealReference(Number(event.currentTarget.value))} data-testid="investigate-reference-control" aria-label={archiveTool.name + "档案操作"}/></label>
        {#if archive[archiveKind]}
          <p class="reading" role="status" data-testid="investigate-reference-result"><strong>已抄入档案：</strong>{archiveTool.reference}</p>
        {/if}
      </div>
      <button class="subtle" type="button" onclick={() => changeDesk("field")}>回现场对照 →</button>
    </section>
  {:else}
    <div class="workshop">
      <div class="panel-title"><span>01 / 工坊勘查</span><h3 tabindex="-1" bind:this={sceneSurface}>哪一包才是失去标签的长衣？</h3><p>四包织物都像线索。用工具查，也去档案室找个参照。</p></div>
      <div class="scene">
        <WorkshopArt examined={inspected} selected={chosen >= 0 ? chosen : null} tool={kind} />
        {#each sites as site, i}
          <button style:left={site.x + "%"} style:top={site.y + "%"} class="bundle" class:marked={i === chosen} type="button" aria-pressed={i === chosen} aria-label={"检视" + site.name + "包"} data-testid={"investigate-bundle-" + i} onclick={() => choose(i)}>
            <span>{site.name}</span>
            {#if inspected.includes(i)}<sup aria-hidden="true">·</sup>{/if}
          </button>
        {/each}
      </div>
    </div>
    {#if validBundle}
      <section class="inspect" aria-label={"检查" + sites[chosen].name + "包"}>
        <div class="section-line"><h3 tabindex="-1" bind:this={inspectionTitle}>{sites[chosen].name}包 · 物证工作台</h3><span>动手观察</span></div>
        <div class="switcher quick" role="group" aria-label="不回到场景，直接切换布包">
          {#each sites as site, i}
            <button type="button" class:current={i === chosen} aria-pressed={i === chosen}
              onclick={() => choose(i)}>{site.name}包</button>
          {/each}
        </div>
        <div class="switcher" role="group" aria-label="检视工具">
          {#each tools as t}
            <button class:current={kind === t.id} type="button" aria-pressed={kind === t.id} data-testid={"investigate-tool-" + t.id} onclick={() => changeTool(t.id)}><span aria-hidden="true">{t.icon}</span>{t.name}</button>
          {/each}
        </div>
        <div class="evidence-card">
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="artbox manipulator" class:turn={kind === "seal"} onpointerdown={(event) => manipulateStart(event, false)} onpointermove={manipulateMove} onpointerup={manipulateEnd} onpointercancel={manipulateEnd}>
            <EvidenceArt {sample} mode={tool.mode} {strength}/>
            <span class="gesture" aria-hidden="true">{kind === "seal" ? "绕着印样转动 ↻" : "在图上往右拖 →"}</span>
          </div>
          <label>{tool.look}<input type="range" min="0" max="100" value={strength} oninput={(event) => observe(Number(event.currentTarget.value))} data-testid="investigate-tool-control" aria-label={tool.name + "操作"}/></label>
          {#if findings[chosen]?.[kind] !== undefined}
            <p class="reading" role="status" data-testid="investigate-observation"><strong>现场观察：</strong>{indication(kind, findings[chosen][kind])}。</p>
          {/if}
        </div>
      </section>
    {:else if !solved}
      <p class="callout">先从插图里选一包。左下甲、中央乙、右下丙、右上丁，每包都有三种可观察的特征。</p>
    {/if}
  {/if}

  {#if desk === "field" && validBundle}
    <section class="verdict" aria-label="提交侦探判断">
      <div class="section-line"><h3>我的判断：{sites[chosen].name}包</h3><span>证据 {currentPins.length}/3</span></div>
      <p>从档案和现场各找一半证据，再把它们别到一起。</p>
      <div class="pins" role="group" aria-label="固定证据">
        {#each tools as t}
          {@const ready = archive[t.id] && findings[chosen]?.[t.id] !== undefined}
          <button type="button" disabled={!ready} aria-pressed={currentPins.includes(t.id)} class:pinned={currentPins.includes(t.id)} data-testid={"investigate-pin-" + t.id} onclick={() => togglePin(t.id)}>
            <span>{currentPins.includes(t.id) ? "✓" : "+"} {t.name}</span>
            <small>{!archive[t.id] ? "待找档案" : findings[chosen]?.[t.id] === undefined ? "待查样品" : indication(t.id, findings[chosen][t.id])}</small>
          </button>
        {/each}
      </div>
      <button class="submit" type="button" disabled={currentPins.length < tools.length} data-testid="investigate-submit" onclick={submit}>提交这包的判断 <span aria-hidden="true">→</span></button>
      {#if completedArchive < tools.length}<button class="subtle" type="button" onclick={() => changeDesk("archive")}>回档案抽屉找参照 ↗</button>{/if}
    </section>
  {/if}
  {#if feedback}
    <p class="callout" role="status" data-testid="investigate-feedback">{feedback}</p>
  {/if}
  {#if desk === "field" && !solved}
    <div class="shelf">
      <button type="button" class="subtle" data-testid="investigate-shelf" disabled={!!detour || !active} onclick={searchShelf}>
        翻一下样品架 <small>每案 1 次 · 1% 稀有发现</small>
      </button>
      {#if detour === "spare-rubbing"}
        <p class="callout rare" role="status" data-testid="investigate-detour"><strong>稀有收藏 · 备用印记拓片</strong> 有人给印章留了一份试印！这份额外发现不对应任何一包，破案还是要用你自己查到的对照记录。</p>
      {:else if detour === "workshop-note"}
        <p class="callout" role="status" data-testid="investigate-detour">这是一张工坊便笺：「标签掉了，不能凭颜色认。记上包的位置和你亲眼看到的特征。」</p>
      {/if}
    </div>
  {/if}
  {#if inspected.length || completedArchive}
    <details class="notebook">
      <summary>摊开勘查笔记 <span>{inspected.length}/4 包有记录</span></summary>
      <div class="matrix">
        <table aria-label="四包样品的对照笔记">
          <thead><tr><th scope="col">样品</th>{#each tools as t}<th scope="col">{t.name}</th>{/each}</tr></thead>
          <tbody>
            <tr class="archive-row"><th scope="row">档案</th>{#each tools as t}<td>{archive[t.id] ? t.active : "未查"}</td>{/each}</tr>
            {#each sites as site, i}
              <tr><th scope="row">{site.name}包</th>{#each tools as t}<td>{findings[i]?.[t.id] === undefined ? "未查" : indication(t.id, findings[i][t.id])}</td>{/each}</tr>
            {/each}
          </tbody>
        </table>
      </div>
    </details>
  {/if}

  {#if !solved}
    <div class="hints">
      <button class="subtle" type="button" data-testid="investigate-hint" onclick={() => hints = Math.min(hints + 1, 3)} disabled={hints >= 3}>{hints ? "再要一个提示" : "卡住了？打开提示"}</button>
      {#if hints}<p class="callout" role="status">{hints === 1 ? "先查档案。档案是参照，不是答案；现场需要拿相同的工具核对。" : hints === 2 ? "只符合两条还不够。薄布、直边、交接印记，三条都要能互相印证。" : (desk === "archive" ? archiveTool : tool).advice}</p>{/if}
    </div>
  {/if}
</div>

<style>
  .investigation{--ink:#28271e;--muted:#665743;--rust:#8b402a;--teal:#17564a;--stroke:#cbb68f;--light:#fff9e9;display:grid;gap:.95rem;color:var(--ink);line-height:1.55}
  h3,p{margin:0}h3{font:800 clamp(1.12rem,3.8vw,1.65rem)/1.25 "Songti SC","Noto Serif SC",serif}button{font:inherit;cursor:pointer}button:disabled{cursor:default}
  button:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #0b6755;outline-offset:3px}.worktabs,.drawer,.switcher{display:flex;gap:.4rem;flex-wrap:wrap}
  .worktabs button,.drawer button,.switcher button,.pins button{min-height:44px;background:var(--light);border:1px solid var(--stroke);border-radius:.55rem;color:var(--ink);padding:.47rem .62rem;font-weight:720}.worktabs button span,.switcher button span{color:var(--rust);margin-right:.12rem}.worktabs button small{color:var(--teal);font-variant-numeric:tabular-nums;padding-left:.2rem}
  .worktabs button.current,.drawer button.current,.switcher button.current{background:#e4ecdc;border-color:var(--teal);box-shadow:inset 0 -3px #28624e;color:#164a3e}
  .panel-title{display:grid;gap:.32rem;margin-bottom:.68rem}.panel-title>span,.section-line>span{color:var(--rust);font-size:.74rem;font-weight:800;letter-spacing:.08em}.panel-title p,.verdict p,.evidence-card label{font-size:.89rem;color:var(--muted)}
  .scene{position:relative;width:100%;aspect-ratio:8/5;overflow:hidden;background:#29372e;border-radius:.9rem;border:1px solid #766347}.scene :global(svg){width:100%;height:100%;display:block}
  .bundle{position:absolute;transform:translate(-50%,-50%);min-width:44px;min-height:44px;border:0;background:transparent;padding:.25rem;color:white;line-height:1}.bundle>span{display:grid;place-items:center;width:2rem;height:2rem;border:1px solid #f3d8a6;background:#2c382be8;border-radius:50%;font-weight:800;box-shadow:0 2px 8px #17241999}.bundle:hover>span,.bundle.marked>span{background:#ffe3a5;color:#30271c;border-color:#fff4d1}.bundle sup{position:absolute;top:1px;right:7px;display:grid;place-items:center;background:#8c392b;color:white;border-radius:50%;width:.85rem;height:.85rem;font-size:1.1rem;text-align:center}
  .archive,.inspect,.verdict,.notebook{border:1px solid var(--stroke);border-radius:.8rem;background:#fff7e6;padding:.76rem}.archive{border-left:4px solid #a9a173;background:linear-gradient(155deg,#fcf0d1,#fff8e8)}
  .drawer{margin-bottom:.66rem}.drawer button{font-size:.82rem}.archive-icon{color:#80432d;font-size:1.05rem}.drawer .check{color:var(--teal);padding-left:.22rem}
  .section-line{display:flex;justify-content:space-between;align-items:baseline;gap:.45rem;margin-bottom:.5rem}.section-line span{white-space:nowrap}
  .switcher{margin-bottom:.55rem}.switcher button{flex:1 1 auto}.quick button{font-size:.84rem;padding:.32rem .45rem;background:#f2e5cc}.quick button.current{background:#f1dbac;border-color:#916949;box-shadow:inset 0 -3px #916949;color:#543824}
  .evidence-card{border:1px solid #ae9a77;border-radius:.64rem;overflow:hidden;background:#fff9ec}.artbox{background:#303c35;display:grid;place-items:center}.artbox :global(svg){max-height:16rem;display:block;width:100%;height:auto}.evidence-card label{display:block;padding:.46rem .6rem 0}.evidence-card input{min-height:44px;width:100%;display:block;margin:0;accent-color:var(--rust);touch-action:pan-y}.reading{margin:0 .6rem .6rem;padding:.5rem .58rem;border-radius:.4rem;background:#e5ecdc;color:#214e42;font-size:.87rem}
  h3[tabindex="-1"]{scroll-margin-top:1rem}h3[tabindex="-1"]:focus{outline:none}
  .manipulator{position:relative;touch-action:none;cursor:ew-resize;user-select:none}.manipulator.turn{cursor:grab}.manipulator.turn:active{cursor:grabbing}.gesture{position:absolute;right:.45rem;bottom:.35rem;padding:.14rem .38rem;border:1px solid #e5ca89a8;background:#26362dec;color:#fff4cf;border-radius:.32rem;font-size:.71rem;pointer-events:none}
  .subtle{min-height:44px;background:transparent;border:0;color:var(--teal);text-decoration:underline;text-underline-offset:.22em;font-weight:730;padding:.28rem .4rem;text-align:left}.subtle:disabled{color:#736653;text-decoration:none}
  .callout{border-radius:.4rem;background:#f5e4bd;border-left:3px solid #9b6a3d;color:#513923;padding:.57rem .65rem;font-size:.89rem}
  .shelf button small{display:inline-block;font-size:.72rem;font-weight:610;margin-left:.25rem;color:var(--muted)}.rare{background:#f4dba2;border-color:#a56f22}.rare strong{display:block;margin-bottom:.12rem}.notebook{background:repeating-linear-gradient(#fff8e8,#fff8e8 1.45rem,#e7d7b5 1.48rem,#fff8e8 1.5rem)}.notebook summary{cursor:pointer;font-weight:780;min-height:36px}.notebook summary span{margin-left:.44rem;font-size:.77rem;font-weight:650;color:var(--muted)}.matrix{border:1px solid var(--stroke);border-radius:.4rem;overflow:hidden;font-size:clamp(.69rem,2.25vw,.88rem);background:#fffaf0}
  .matrix table{width:100%;border-collapse:collapse;table-layout:fixed;text-align:left}.matrix td,.matrix th{padding:.34rem .25rem;overflow-wrap:anywhere;line-height:1.32}.matrix th:first-child{width:15%}.matrix tr>*+*{border-left:1px solid #e6d6b4}.matrix tbody tr{border-top:1px solid #dac7a7}.matrix thead{background:#553c2c;color:#fff5de;font-weight:750}.archive-row{background:#e8ecdd;color:#264e42}
  .pins{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.36rem;margin:.54rem 0}.pins button{display:grid;gap:.1rem;justify-items:start;text-align:left;line-height:1.14;min-width:0}.pins button small{color:var(--muted);font-weight:600;font-size:.7rem}.pins button:disabled{background:#efe3cd;color:#675643}.pins button.pinned{background:#e0ebdb;border-color:var(--teal);color:#165241}.submit{background:var(--rust);border:1px solid #653323;box-shadow:0 2px 0 #653323;border-radius:.55rem;color:#fff7e9;padding:.55rem .76rem;min-height:44px;font-weight:760}.submit:disabled{background:#eee2cc;box-shadow:none;border-color:#c9b796;color:#675742}.submit span{padding-left:.35rem}.hints .callout{margin-top:.2rem}
  @media(max-width:430px){.investigation{gap:.75rem}.worktabs button,.switcher button{padding:.38rem .46rem;font-size:.83rem}.archive,.inspect,.verdict,.notebook{padding:.6rem}.bundle>span{width:1.75rem;height:1.75rem}.panel-title p{font-size:.83rem}.pins button{font-size:.75rem;padding:.38rem .31rem}.pins button small{font-size:.62rem}.artbox :global(svg){max-height:11.8rem}}
</style>

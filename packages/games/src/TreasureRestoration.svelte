<script>
  import { tick } from "svelte";
  import { checkSeam, fragmentEdge, fragments, known, knownPatterns, supportedClaims } from "./treasure-restore.js";

  let { investigation, weighing, onSolve } = $props();
  const uid = $props.id();
  const kinds = ["实线", "点线", "双线"];
  const claims = [
    { name: "灯下看得见底纹，所以这件衣料很透。", key: "透光" },
    { name: "衣料很透，所以任何这种布都不到 50 克。", key: "过度推断" },
    { name: "右盘放对砝码时天平平衡，支持这个重量。", key: "天平" },
    { name: "两件的封签相同，所以必定是同一件。", key: "过度推断" },
  ];
  let fragment = $state(0);
  let turn = $state(0);
  let level = $state(0);
  let solved = $state(false);
  let picks = $state([]);
  let hint = $state(0);
  let feedback = $state("");
  let inspect = $state(false);
  let conclusion = $state(null);
  let edge = $derived(fragmentEdge(fragments[fragment], turn, level));

  function choose(i) {
    fragment = i; turn = 0; level = 0; feedback = "";
  }
  function toggle(i) {
    picks = picks.includes(i) ? picks.filter(j => j !== i) : [...picks, i];
    feedback = "";
  }
  async function check() {
    const result = checkSeam(edge);
    if (result === "pattern") {
      feedback = "接缝两边的线型对不上。有一边的实线，碰到的却不是实线。试试翻转，或比较另一条样片。";
      return;
    }
    if (result === "position") {
      feedback = "线型的顺序对了，但线头还没接上。让样片上下挪一挪，再看三处接缝。";
      return;
    }
    solved = true; feedback = "";
    await tick();
    conclusion?.focus({ preventScroll: true });
    conclusion?.scrollIntoView({ block: "start" });
  }

  function certify() {
    if (!supportedClaims(picks)) {
      feedback = "有一条说得比证据更多了。「同一种布」或「同一种封签」，能直接证明重量或身份吗？";
      return;
    }
    onSolve({ fragment: fragments[fragment].id, attempts: weighing.trials.length, selectedBundle: investigation.index });
  }
</script>

{#snippet traces(left, right, patterns, width)}
  {#each left as y, i}
    {@const end = right[i]}
    {@const shape = `M 0 ${y} Q ${width*0.36} ${y+10-(i*7)} ${width/2} ${(y+end)/2} T ${width} ${end}`}
    <path d={shape} stroke={patterns[i]===0 ? "#ffda88" : patterns[i]===1 ? "#efc7a7" : "#e9b379"}
      stroke-width={patterns[i]===2 ? 1.7 : 2.4} stroke-dasharray={patterns[i]===1 ? "3 4" : undefined} fill="none" />
    {#if patterns[i]===2}
      <path d={shape} transform="translate(0 5)" stroke="#e9b379" stroke-width="1.7" fill="none" />
    {/if}
  {/each}
{/snippet}

<section class="restoration" aria-labelledby="restore-title">
  {#if !solved}
    <p class="chapter">第三室 / 复原台</p>
    <h2 id="restore-title">织纹不会在接缝处突然断掉</h2>
    <p class="prompt">馆员要做一块能让观众拿近看、对着灯看的样布。左半块保留了三种线迹；从三块候选中选一块，转方向、移位置，把线头接起来。</p>
    <div class="loom">
      <svg viewBox="0 0 420 230" role="img" aria-label="左侧固定样布与右侧可翻转样片，接缝处有实线、点线与双线">
        <defs>
          <pattern id={uid+"-weave"} width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M0 0h5M0 0v5" fill="none" stroke="#6e4b35" stroke-opacity=".65" stroke-width=".8"/>
          </pattern>
          <pattern id={uid+"-draft"} width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M0 0h12M0 0v12" fill="none" stroke="#f1d296" stroke-opacity=".13" stroke-width="1"/>
          </pattern>
          <linearGradient id={uid+"-cloth"} x2="1" y2="1">
            <stop stop-color="#7c473b"/><stop offset="1" stop-color="#3d4141"/>
          </linearGradient>
        </defs>
        <rect x="9" y="9" width="402" height="212" rx="13" fill={"url(#"+uid+"-draft)"} stroke="#bc9e6770"/>
        <path d="M210 20v190M30 114h360" stroke="#eccb8790" stroke-dasharray="3 8"/>
        <g transform="translate(78 47)">
          <rect width="132" height="132" rx="4" fill={"url(#"+uid+"-cloth)"} stroke="#c9a36d"/>
          <rect width="132" height="132" rx="4" fill={"url(#"+uid+"-weave)"}/>
          {@render traces([28, 55, 96], known, knownPatterns, 132)}
        </g>
        <g transform={"translate(210 "+ (47+level) + ") rotate("+turn+" 66 66)"}>
          <rect width="132" height="132" rx="4" fill={"url(#"+uid+"-cloth)"} stroke="#e6c38a"/>
          <rect width="132" height="132" rx="4" fill={"url(#"+uid+"-weave)"}/>
          {@render traces(fragments[fragment].left, fragments[fragment].right, fragments[fragment].patterns, 132)}
        </g>
        <g fill="#e1bc7c" font-family="system-ui" font-size="10">
          <text x="88" y="204">FIXED / 左幅</text>
          <text x="273" y="204">SAMPLE / 样片</text>
        </g>
      </svg>
    </div>
    <div class="controls" role="group" aria-label="选一块 织纹样片">
      {#each fragments as sample,i}
        <button type="button" class:chosen={fragment===i} aria-pressed={fragment===i}
          data-testid={"restore-fragment-"+i} onclick={() => choose(i)}>样片 {sample.id}</button>
      {/each}
      <button type="button" data-testid="restore-rotate"
        onclick={() => { turn = 180-turn; feedback = ""; }}>↻ 调转方向</button>
    </div>
    <div class="slide">
      <label for="sample-level">上下移动样片</label>
      <input id="sample-level" data-testid="restore-offset" type="range" min="-32" max="32" step="1" bind:value={level} aria-valuetext={(level > 0 ? "向下 " : level < 0 ? "向上 " : "") + Math.abs(level) + " 毫米"} oninput={() => feedback = ""} />
    </div>
    <button type="button" class="quietbtn" aria-expanded={inspect}
      onclick={() => inspect = !inspect}>{inspect ? "收起线头笔记" : "用文字比对线头"}</button>
    {#if inspect}
      <p class="note">左幅从上到下：{known.map((v,i)=>kinds[knownPatterns[i]]+"·"+v).join("、")}。<br/>
      右幅从上到下：{edge.map(e=>kinds[e.pattern]+"·"+e.n).join("、")}。（数字为相对于同一条参考线的距离。）</p>
    {/if}
    <div class="actions">
      <button type="button" class="quietbtn" onclick={() => hint = Math.min(2,hint+1)}>提示</button>
      <button type="button" class="primary" data-testid="restore-check" onclick={check}>检查接缝</button>
    </div>
    {#if feedback}<p class="note" role="status">{feedback}</p>{/if}
    {#if hint}<p class="note">{hint===1 ? "一次只处理一个变量：先让两边线型顺序一致，再处理高低。" : "三种线型都不一样。先从左幅最上面那根实线开始找。"}</p>{/if}
  {:else}
    <p class="chapter">封存记录 / 签字前复核</p>
    <h2 id="restore-title" bind:this={conclusion} tabindex="-1">把推断留在证据够得着的地方</h2>
    <p class="prompt">样布接好了。展柜上可以贴两句由你亲手验证的说明。哪两句真的有证据？</p>
    <div class="proof">
      <span>勘查 · 封签、衣襟、透光的记录</span><span>称量 · 留下 {weighing.trials.length} 次试验记录</span>
    </div>
    <div class="claims" role="group" aria-label="给展柜选两句说明">
      {#each claims as claim, i}
        <button type="button" data-testid={"restore-claim-"+i} class:chosen={picks.includes(i)}
          aria-pressed={picks.includes(i)} onclick={() => toggle(i)}>{claim.name}</button>
      {/each}
    </div>
    <div class="actions">
      <span class="muted">已选 {picks.length} / 2</span>
      <button type="button" class="primary" data-testid="restore-file" disabled={picks.length!==2} onclick={certify}>提交结案记录 ↗</button>
    </div>
    {#if feedback}<p class="note" role="status">{feedback}</p>{/if}
  {/if}
</section>

<style>
  .restoration{color:#272b29;min-width:0}
  .chapter{color:#874633;font-size:.78rem;font-weight:800;letter-spacing:.15em;margin:.25rem 0}
  h2{font-family:"Songti SC",SimSun,serif;font-size:clamp(1.48rem,4.5vw,2.55rem);line-height:1.15;margin:.3rem 0}
  .prompt{color:#555249;line-height:1.7;margin:.6rem 0 .95rem}
  .loom{background:radial-gradient(ellipse at center,#5e4535,#1d2726 75%);border:1px solid #6b6951;border-radius:.8rem;overflow:hidden}
  .loom svg{display:block;margin:auto;width:100%;max-height:295px}
  .controls,.actions,.proof{display:flex;gap:.45rem;align-items:center;flex-wrap:wrap;margin:.68rem 0}
  .actions{justify-content:space-between}
  button{min-height:44px;border:1px solid #ab9673;background:#fff7e4;border-radius:.58rem;padding:.44rem .72rem;color:#2c3430;font:inherit;font-weight:720;cursor:pointer}
  .chosen{border-color:#496657;box-shadow:inset 0 -3px #496657;background:#e3ecdd}
  button:focus-visible,input:focus-visible{outline:3px solid #207264;outline-offset:2px}
  .primary{background:#843f32;color:#fff8ed;border-color:#713427}
  .primary:disabled{opacity:.48;cursor:default}
  .quietbtn{background:transparent;border-color:transparent;text-decoration:underline;text-underline-offset:3px;color:#355d51}
  .slide{display:grid;grid-template-columns:auto minmax(0,1fr);gap:.7rem;align-items:center;margin:.6rem 0;font-size:.88rem;font-weight:700}
  .slide input{min-height:44px;width:100%;accent-color:#843f32}
  .note{border-inline-start:3px solid #946648;background:#eeddbc;border-radius:.35rem;padding:.62rem .75rem;color:#503b2b;font-size:.91rem}
  .proof span{font-size:.81rem;padding:.34rem .55rem;background:#ebe0c9;border-radius:.35rem;color:#554e41}
  .claims{display:grid;gap:.5rem}
  .claims button{text-align:left}
  .muted{color:#615444;font-size:.88rem}
</style>

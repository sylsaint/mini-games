<script>
  import { onMount, tick } from 'svelte';
  import { readLocal, writeLocal } from '@yoyo/storage';
  import Button from '@yoyo/ui/button';
  import Card from '@yoyo/ui/card';
  import ConfirmDialog from '@yoyo/ui/dialog';
  import bank from './multiplication/bank.json';
  import QuestionVisual from './multiplication/QuestionVisual.svelte';
  import { answerKey, completion, displayAnswer, errorHint, examKey, grade, hasAnswer, isCorrect, newPaper, newProgress, paperIds, validProgress } from './multiplication/exam.js';

  const info = {
    A: { title: 'A 卷 · 常规卷', level: '难度适中', description: '从口算和位值起步，再去安排座位、清点物资。重点是算得准，也知道每一步在算什么。' },
    B: { title: 'B 卷 · 挑战卷', level: '难度进阶', description: '修复错位竖式、判断上下界、安排车辆和预算。不是单纯换大数字，而是多想一步。' },
  };
  const advice = {
    '口算与规律': '先把 0 看成十、百的单位，再跟踪每个乘数变成了几倍。',
    '位值与笔算': '在纸上写清两行各代表什么，尤其是十位行，最后按位相加。',
    '估算与判断': '先判断是估大、估小，还是方向相反。接近门槛时，用上下界或精算。',
    '工具与探规律': '先猜再验证；用计算器时先核对输入，再用数量级检查结果。',
    '情境与推理': '圈出每组数量、组数与总量。问“至少”时，要同时验证少一个不行。',
  };

  let progress = $state(newProgress());
  let mode = $state('');
  let ready = $state(false);
  let storageNotice = $state('');
  let onlyWrong = $state(false);
  let confirmation = $state('');
  let dialogOpen = $state(false);
  let returnFocus;
  let confirmed = false;
  let activeTitle = $state();
  const paper = $derived(mode ? progress[mode] : null);
  const questions = $derived(mode ? bank[mode] : []);
  const current = $derived(paper ? questions[paper.index] : null);
  const incomplete = $derived(paper ? questions.filter(q => completion(q, paper.answers) !== 'full').length : 0);
  const result = $derived(paper?.submitted ? grade(questions, paper.answers) : null);
  const weakest = $derived(result ? Object.entries(result.topics)
    .filter(([, v]) => v.earned < v.max)
    .sort((a,b) => a[1].earned/a[1].max - b[1].earned/b[1].max)[0]?.[0] : null);

  onMount(() => {
    const saved = readLocal(examKey, null, validProgress);
    if (saved.status === 'ok') progress = saved.value;
    else if (saved.status === 'invalid') storageNotice = '旧进度无法读取，本次从空白开始。';
    else if (saved.status === 'unavailable') storageNotice = '本地进度不可用，请保持页面打开。';
    ready = true;
  });

  function save() {
    if (!writeLocal(examKey, progress)) storageNotice = '此浏览器无法保存进度，请保持页面打开。答案不会上传。';
  }
  async function focusTitle() { await tick(); activeTitle?.focus(); }
  function select(id) { mode = id; onlyWrong = false; focusTitle(); }
  function go(index) {
    if (!paper || paper.submitted || index < 0 || index >= questions.length) return;
    paper.index = index;
    save();
    focusTitle();
  }
  function setAnswer(key, value) {
    if (!paper || paper.submitted) return;
    if (hasAnswer(value)) paper.answers[key] = value;
    else delete paper.answers[key];
    save();
  }
  function request(action, trigger) {
    confirmation = action;
    returnFocus = trigger;
    confirmed = false;
    dialogOpen = true;
  }
  function finishConfirmation() {
    if (!paper) return;
    confirmed = true;
    dialogOpen = false;
    if (confirmation === 'submit') paper.submitted = true;
    else if (confirmation === 'reset') progress[mode] = newPaper();
    onlyWrong = false;
    save();
  }
  function restoreFocus(event) {
    event.preventDefault();
    if (confirmed) focusTitle();
    else returnFocus?.focus();
  }
</script>

<svelte:head>
  <title>整数乘法实验站 · 四年级上册第三单元</title>
  <meta name="description" content="四年级上册第三单元整数乘法（二）：常规卷和挑战卷各 15 题。练竖式、估算、规律和应用推理；不计时，交卷后按小问评分并讲解错法。" />
</svelte:head>

<div class="multiply">
  <header class="top"><div class="wrap top-inner"><a href="/learning/math/">← 数学小世界</a><span>四年级上册 · 第三单元</span></div></header>
  <main class="wrap">
    {#if storageNotice}<p class="notice" role="status">{storageNotice}</p>{/if}
    {#if !paper}
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">UNIT 3 · 整数乘法（二）</p>
          <h1 bind:this={activeTitle} tabindex="-1">整数乘法实验站</h1>
          <p class="hero-description">从队形、座位到巴士和预算。先把乘法算明白，再用它解决问题。</p>
          <div class="pills"><span>不计时</span><span>可以跳题</span><span>交卷后统一评分</span></div>
        </div>
        <svg class="cover-mark" width="136" height="116" viewBox="0 0 136 116" aria-hidden="true">
          <rect x="14" y="9" width="112" height="98" rx="24" fill="#e5ecdb"/>
          <rect x="29" y="25" width="43" height="31" rx="5" fill="#94b49b"/>
          <rect x="77" y="25" width="24" height="31" rx="5" fill="#e6c68a"/>
          <rect x="29" y="61" width="43" height="24" rx="5" fill="#b8ceb4"/>
          <rect x="77" y="61" width="24" height="24" rx="5" fill="#c9bbd4"/>
          <path d="m105 79 16 16m0-16-16 16" stroke="#245b4a" stroke-linecap="round" stroke-width="4"/>
        </svg>
      </section>
      <div class="sets">
        {#each paperIds as id (id)}
          <Card class="set" aria-labelledby={`paper-${id}`}>
            <span class="paper-index" class:challenge={id === 'B'} aria-hidden="true">{id}</span>
            <p class="eyebrow">{info[id].level} · 15 题 · 100 分</p>
            <h2 id={`paper-${id}`}>{info[id].title}</h2>
            <p class="card-copy">{info[id].description}</p>
            <Button disabled={!ready} onclick={() => select(id)}>{progress[id].submitted ? `查看 ${id} 卷成绩` : Object.keys(progress[id].answers).length || progress[id].index ? `继续 ${id} 卷` : `开始 ${id} 卷`}</Button>
          </Card>
        {/each}
      </div>
      <aside class="note"><strong>建议准备纸笔。</strong>笔算题可在纸上写竖式。两卷独立保存在当前浏览器，换设备不会同步；不收集姓名，不上传答案。组合题按小问分别给分。</aside>
    {:else if result}
      <Card class="report" aria-labelledby="multiplication-report">
        <p class="eyebrow">已交卷 · {info[mode].title}</p>
        <h1 id="multiplication-report" bind:this={activeTitle} tabindex="-1">我的答题报告</h1>
        <div class="actions score-row"><div><strong class="score">{result.score}</strong> / 100 分<p>{questions.length-result.needsReview} 题全对 · {result.needsReview} 题可回顾</p></div><Button variant="outline" onclick={() => select('')}>返回选卷</Button></div>
        <div class="skills">
          {#each Object.entries(result.topics) as [topic, value] (topic)}
            <div><strong>{topic}</strong><progress aria-label={topic} max={value.max} value={value.earned}></progress>{value.earned} / {value.max} 分</div>
          {/each}
        </div>
        {#if weakest}<p><strong>先巩固「{weakest}」：</strong>{advice[weakest]}</p>{:else}<p><strong>这套卷全对。</strong>试着讲一讲为什么估算不能总替代精算。</p>{/if}
        <div class="filters"><Button variant="outline" aria-pressed={!onlyWrong} onclick={() => onlyWrong = false}>全部解析</Button><Button variant="outline" aria-pressed={onlyWrong} onclick={() => onlyWrong = true}>只看待回顾（{result.needsReview}）</Button></div>
        {#each result.rows as { q, earned }, i (q.id)}
          {#if !onlyWrong || earned !== q.points}
            <details class="review">
              <summary>第 {i+1} 题 · {q.title} <span class:miss={earned !== q.points}>{earned} / {q.points} 分</span></summary>
              <div class="solution">
                <p>{q.prompt}</p>
                <QuestionVisual visual={q.visual} review />
                {#each q.parts as part, j (j)}
                  {@const value = paper.answers[answerKey(q,j)]}
                  {@const yes = isCorrect(part,value)}
                  {@const hint = !yes ? errorHint(part,value) : ''}
                  <div class="explanation" class:miss={!yes}>
                    <p><strong>{part.label}</strong>　{yes ? '答对了' : hasAnswer(value) ? '再看看' : '未作答'}</p>
                    <p>你的答案：{hasAnswer(value) ? value : '未填'}　｜　正确答案：{displayAnswer(part.key)}</p>
                    {#if hint}<p class="hint">{hint}</p>{/if}
                    <p>{part.why}</p>
                  </div>
                {/each}
              </div>
            </details>
          {/if}
        {/each}
        {#if onlyWrong && !result.needsReview}<p>这一卷没有需要回顾的题。</p>{/if}
        <div class="actions"><Button variant="outline" onclick={event => request('reset', event.currentTarget)}>清除本卷并重做</Button><Button onclick={() => select(mode === 'A' ? 'B' : 'A')}>去 {mode === 'A' ? 'B' : 'A'} 卷</Button></div>
      </Card>
    {:else if current}
      <div class="workspace">
        <Card class="board" tone="muted" aria-label="答题卡">
          <p class="eyebrow">答题卡</p><h2>{info[mode].title}</h2>
          <p aria-live="polite">已填完 {questions.length-incomplete} / {questions.length} 题</p>
          <progress aria-label="答题进度" max={questions.length} value={questions.length-incomplete}></progress>
          <nav class="numbers" aria-label="选择题目">
            {#each questions as q, i (q.id)}
              {@const status = completion(q, paper.answers)}
              <Button variant="outline" data-completion={status} aria-current={paper.index === i ? 'step' : undefined} aria-label={`第 ${i+1} 题，${status === 'full' ? '已填完' : status === 'part' ? '部分已答' : '未答'}`} onclick={() => go(i)}>{i+1}</Button>
            {/each}
          </nav>
          <div class="board-actions"><Button onclick={event => request('submit', event.currentTarget)}>交卷评分</Button><Button variant="outline" onclick={() => select('')}>返回选卷</Button></div>
        </Card>
        <Card class="sheet" aria-label="当前题目">
          <div class="meta"><span>第 {paper.index+1} 题 / {questions.length}</span><span>{current.tag}</span><span>{current.points} 分</span></div>
          <h1 bind:this={activeTitle} tabindex="-1">{current.title}</h1>
          <p class="prompt">{current.prompt}</p>
          {#key current.id}
            <QuestionVisual visual={current.visual} />
            {#each current.parts as part, j (j)}
              {@const key = answerKey(current,j)}
              {#if part.opts}
                <fieldset><legend>{part.label}</legend>
                  {#each part.opts as option (option)}
                    <label class="choice"><input type="radio" name={key} value={option} checked={paper.answers[key] === option} onchange={() => setAnswer(key,option)} /><span>{option}</span></label>
                  {/each}
                </fieldset>
              {:else}
                <div class="numeric"><label for={key}>{part.label}</label><input id={key} type="text" inputmode="numeric" maxlength="24" autocomplete="off" placeholder="填写整数" value={paper.answers[key] ?? ''} oninput={event => setAnswer(key,event.currentTarget.value)} /></div>
              {/if}
            {/each}
          {/key}
          <div class="actions"><Button variant="outline" disabled={paper.index === 0} onclick={() => go(paper.index-1)}>← 上一题</Button>
            {#if paper.index === questions.length-1}<Button onclick={event => request('submit', event.currentTarget)}>检查并交卷</Button>
            {:else}<Button onclick={() => go(paper.index+1)}>下一题 →</Button>{/if}
          </div>
        </Card>
      </div>
    {/if}
  </main>
  <footer class="wrap">原创练习 · <a href="https://ai.xsj21.com/textbooks/grade-4-1/" target="_blank" rel="noopener noreferrer">北师大版四上教材目录参考</a></footer>
  <ConfirmDialog
    title={confirmation === 'reset' ? '重新作答本卷？' : '现在交卷吗？'}
    description={confirmation === 'reset' ? '只清除本卷的答案和成绩，另一卷保留。' : incomplete ? `还有 ${incomplete} 题没有填完整，空白小问按 0 分算。交卷后可查看评分和解析。` : '已填完所有题。交卷后可以查看解析，本次答案不再修改。'}
    cancelLabel="返回检查"
    bind:open={dialogOpen}
    onCloseAutoFocus={restoreFocus}
  >
    <Button onclick={finishConfirmation}>{confirmation === 'reset' ? '清除并重做' : '确认交卷'}</Button>
  </ConfirmDialog>
</div>

<style>
  .multiply {
    --ink: var(--color-foreground, #263f3a);
    --green: var(--color-primary, #245b4a);
    --line: var(--color-border, #b8c8b0);
    --paper: var(--color-background, #fffdf8);
    --mist: var(--color-muted, #edf2e9);
    --text-muted: #4f675c;
    min-height: 100vh;
    color: var(--ink);
    background: #f5f7f0;
    font: 1rem/1.7 -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  }
  .multiply :is(h1, h2, p) { margin: 0; }
  .multiply :is(a, input, summary):focus-visible {
    outline: 3px solid var(--color-ring, #cb8848);
    outline-offset: 3px;
  }
  .wrap { box-sizing: border-box; width: min(100%, 68rem); margin-inline: auto; padding-inline: clamp(1rem, 4vw, 2rem); }
  .top-inner {
    display: flex; align-items: center; justify-content: space-between;
    min-height: 4.25rem; gap: .8rem; border-bottom: 1px solid #d8e0d3;
    font-size: .875rem;
  }
  .top a { color: var(--green); display: inline-flex; min-height: 44px; align-items: center; text-decoration: none; font-weight: 750; }
  .top a:hover { text-decoration: underline; }
  .top span { color: var(--text-muted); text-align: right; }
  .hero { display: flex; align-items: center; justify-content: space-between; gap: 1.25rem; padding: clamp(1.5rem, 5vw, 3rem) 0 1.45rem; }
  .hero-copy { min-width: 0; }
  .hero h1 { font-size: clamp(2rem, 5vw, 3rem); letter-spacing: -.035em; line-height: 1.18; margin: .4rem 0 .75rem; }
  .hero-description { color: var(--text-muted); font-size: clamp(1rem, 2.2vw, 1.125rem); }
  .cover-mark { flex: 0 0 auto; width: clamp(5rem, 16vw, 8.5rem); height: auto; }
  .eyebrow { color: var(--text-muted); font-size: .77rem; font-weight: 750; letter-spacing: .105em; }
  .pills, .meta { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; }
  .pills { margin-top: .8rem; }
  .pills span, .meta span { padding: .2rem .65rem; border: 1px solid #d3dfcd; border-radius: 999px; font-size: .8rem; }
  .pills span { background: var(--paper); }
  .meta { margin-bottom: .55rem; }
  .meta span { background: var(--mist); }
  .meta span:last-child { margin-left: auto; }

  .sets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(1rem, 2.5vw, 1.5rem); }
  .sets :global(.set) { display: grid; grid-template-rows: auto auto auto 1fr auto; gap: .42rem; }
  .paper-index { display: grid; place-items: center; width: 2.6rem; aspect-ratio: 1; border-radius: .75rem; background: #e2ecd9; color: var(--green); font-size: 1.15rem; font-weight: 800; margin-bottom: .25rem; }
  .paper-index.challenge { background: #eae4f0; color: #4d3d5d; }
  .sets h2 { font-size: clamp(1.25rem, 3vw, 1.55rem); line-height: 1.32; }
  .card-copy { color: var(--text-muted); max-width: 32em; }
  .sets :global(.yoyo-button) { justify-self: start; margin-top: .6rem; font-weight: 720; }
  .note, .notice { font-size: .875rem; margin-top: 1.25rem; padding: .8rem 1rem; border-radius: .8rem; }
  .note { color: var(--text-muted); background: var(--mist); }
  .notice { color: #59452a; background: #fff0cc; }

  .workspace { display: grid; grid-template-columns: 16.75rem minmax(0, 1fr); align-items: start; gap: clamp(1rem, 2.5vw, 1.5rem); margin-top: 1.5rem; }
  .workspace :global(.board) { position: sticky; top: 1rem; --card-padding: 1rem; --card-radius: 1.25rem; }
  .board-actions { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; }
  .board-actions :global(.yoyo-button) { padding-inline: .35rem; }
  .workspace h2 { font-size: 1.125rem; }
  progress { display: block; width: 100%; height: .475rem; margin: .45rem 0; accent-color: var(--green); }
  .numbers { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: .28rem; margin: .8rem 0; }
  .numbers :global(.yoyo-button) { padding: .3rem 0; border-radius: .65rem; font-variant-numeric: tabular-nums; background: var(--paper); position: relative; }
  .numbers :global(.yoyo-button[data-completion="full"]) { background: #dbead6; }
  .numbers :global(.yoyo-button[data-completion="part"]) { background: #f4e9d5; }
  .numbers :global(.yoyo-button[data-completion="full"])::after,
  .numbers :global(.yoyo-button[data-completion="part"])::after {
    content: ""; position: absolute; inset: auto 35% .28rem; border-top: 2px solid currentColor; opacity: .8;
  }
  .numbers :global(.yoyo-button[data-completion="part"])::after { border-top-style: dotted; }
  .numbers :global(.yoyo-button[aria-current="step"]) { background: var(--green); color: white; border-color: var(--green); }
  .workspace h1, #multiplication-report { font-size: clamp(1.4rem, 3.6vw, 1.9rem); line-height: 1.35; }
  .workspace .prompt { font-size: 1.08rem; margin: .55rem 0 .9rem; overflow-wrap: anywhere; }
  fieldset { border: 0; padding: 0; margin: .9rem 0 0; min-width: 0; }
  legend, .numeric label { padding: 0; font-weight: 720; }
  .choice {
    display: flex; align-items: center; gap: .65rem; box-sizing: border-box;
    border: 1px solid #d5dfd0; border-radius: .75rem; padding: .625rem .8rem;
    min-height: 44px; background: white; margin-top: .4rem; cursor: pointer;
  }
  .choice:has(input:checked) { background: var(--mist); border-color: #759982; }
  .choice input { width: 17px; height: 17px; accent-color: var(--green); flex: 0 0 auto; margin: 0; }
  .numeric { margin: .85rem 0 0; }
  .numeric input {
    display: block; box-sizing: border-box; width: min(100%, 20rem); min-height: 46px;
    padding: .5rem .75rem; margin-top: .35rem; border: 1px solid #8ca598;
    border-radius: .75rem; background: white; color: var(--ink); font: inherit;
  }
  .actions, .filters { display: flex; align-items: center; flex-wrap: wrap; gap: .55rem; margin-top: 1rem; }
  .actions { justify-content: space-between; border-top: 1px solid #d8e0d3; padding-top: .9rem; }
  .filters { margin-bottom: .75rem; }
  .filters :global(.yoyo-button[aria-pressed="true"]) { background: var(--mist); border-color: #759982; }

  .wrap :global(.report) { margin-top: 1.5rem; }
  .score { font-size: clamp(2.3rem, 8vw, 3.5rem); line-height: 1; color: var(--green); font-variant-numeric: tabular-nums; }
  .score-row { background: var(--mist); border: 0; border-radius: 1rem; padding: .95rem 1rem; }
  .skills { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem),1fr)); gap: .5rem; margin: .85rem 0; }
  .skills div { border-radius: .75rem; border: 1px solid #d8e0d3; padding: .55rem; font-size: .875rem; }
  .review { border: 1px solid #d8e0d3; border-radius: .8rem; margin-block: .6rem; }
  .review summary { cursor: pointer; padding: .55rem .75rem; box-sizing: border-box; min-height: 44px; font-weight: 750; }
  .review summary span { display: inline-block; background: #dbead6; border-radius: .45rem; padding: .05rem .45rem; font-size: .8rem; }
  .review summary .miss, .explanation.miss { background: #f7ebdc; }
  .solution { padding: .1rem .75rem .75rem; }
  .explanation { border-radius: .65rem; background: var(--mist); padding: .6rem .7rem; margin-top: .55rem; overflow-wrap: anywhere; }
  .explanation p+p { margin-top: .2rem; }
  .hint { font-weight: 740; color: #754126; }
  footer { padding-block: 1.25rem 1.65rem; font-size: .85rem; color: var(--text-muted); }
  footer a { color: var(--green); }

  @media (max-width: 760px) {
    .workspace { grid-template-columns: minmax(0, 1fr); margin-top: 1rem; }
    .workspace :global(.board) { position: static; }
    .numbers { grid-template-columns: repeat(7, minmax(0,1fr)); }
    .board-actions { display: flex; flex-wrap: wrap; }
    .board-actions :global(.yoyo-button) { padding-inline: .7rem; }
  }
  @media (max-width: 540px) {
    .sets { grid-template-columns: 1fr; }
    .hero { position: relative; }
    .cover-mark { display: none; }
  }
  @media (max-width: 410px) {
    .numbers { grid-template-columns: repeat(5, minmax(0,1fr)); }
  }
</style>

<script>
  import { onMount, tick } from 'svelte';
  import { readLocal, writeLocal } from '@yoyo/storage';
  import bank from './multiplication/bank.json';
  import QuestionVisual from './multiplication/QuestionVisual.svelte';
  import { answerKey, completion, displayAnswer, errorHint, examKey, grade, hasAnswer, isCorrect, newPaper, newProgress, paperIds, validProgress } from './multiplication/exam.js';

  const info = {
    A: { title: 'A 卷 · 常规卷', scene: '科技节筹备处', level: '难度适中', description: '从口算和位值起步，再去安排座位、清点物资。重点是算得准，也知道每一步在算什么。' },
    B: { title: 'B 卷 · 挑战卷', scene: '任务调度中心', level: '难度进阶', description: '修复错位竖式、判断上下界、安排车辆和预算。不是单纯换大数字，而是多想一步。' },
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
  let dialog;
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
  function request(action) {
    confirmation = action;
    dialog.returnValue = '';
    dialog.showModal();
  }
  function finishConfirmation() {
    const action = confirmation;
    confirmation = '';
    if (dialog.returnValue !== 'yes' || !paper) return;
    if (action === 'submit') paper.submitted = true;
    else if (action === 'reset') progress[mode] = newPaper();
    onlyWrong = false;
    save();
    focusTitle();
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
        <svg class="orbit" viewBox="0 0 400 400" aria-hidden="true"><circle cx="218" cy="198" r="109" fill="#2c6c54"/><g transform="rotate(-29 218 198)" fill="none" stroke="#e6cb85"><ellipse cx="218" cy="198" rx="180" ry="57"/><ellipse cx="218" cy="198" rx="163" ry="86" opacity=".5"/></g><g fill="#ffe0a1"><circle cx="328" cy="103" r="9"/><circle cx="97" cy="275" r="5"/><path d="M220 144h15v42h42v15h-42v42h-15v-42h-42v-15h42z" transform="rotate(25 218 198)"/><circle cx="99" cy="99" r="4"/></g></svg>
        <div>
          <p class="eyebrow">整数乘法（二） · 两套原创试卷</p>
          <h1 bind:this={activeTitle} tabindex="-1">整数乘法实验站</h1>
          <p>在队形、座位、巴士和预算里用乘法解决问题。交卷后再一起找出错在哪一步。</p>
          <div class="pills"><span>不计时</span><span>可以跳题</span><span>交卷后统一评分</span></div>
        </div>
      </section>
      <div class="sets">
        {#each paperIds as id (id)}
          <section class="set">
            <p class="eyebrow">{info[id].level} · 15 题 · 100 分</p>
            <h2>{info[id].title}</h2>
            <p><strong>{info[id].scene}</strong>　{info[id].description}</p>
            <button class="primary" disabled={!ready} onclick={() => select(id)}>{progress[id].submitted ? `查看 ${id} 卷成绩` : Object.keys(progress[id].answers).length || progress[id].index ? `继续 ${id} 卷` : `开始 ${id} 卷`}</button>
          </section>
        {/each}
      </div>
      <aside class="note"><strong>建议准备纸笔。</strong>笔算题可在纸上写竖式。两卷独立保存在当前浏览器，换设备不会同步；不收集姓名，不上传答案。组合题按小问分别给分。</aside>
    {:else if result}
      <section class="report">
        <p class="eyebrow">已交卷 · {info[mode].title}</p>
        <h1 bind:this={activeTitle} tabindex="-1">我的答题报告</h1>
        <div class="actions score-row"><div><strong class="score">{result.score}</strong> / 100 分<p>{questions.length-result.needsReview} 题全对 · {result.needsReview} 题可回顾</p></div><button onclick={() => select('')}>返回选卷</button></div>
        <div class="skills">
          {#each Object.entries(result.topics) as [topic, value] (topic)}
            <div><strong>{topic}</strong><progress aria-label={topic} max={value.max} value={value.earned}></progress>{value.earned} / {value.max} 分</div>
          {/each}
        </div>
        {#if weakest}<p><strong>先巩固「{weakest}」：</strong>{advice[weakest]}</p>{:else}<p><strong>这套卷全对。</strong>试着讲一讲为什么估算不能总替代精算。</p>{/if}
        <div class="filters"><button aria-pressed={!onlyWrong} onclick={() => onlyWrong = false}>全部解析</button><button aria-pressed={onlyWrong} onclick={() => onlyWrong = true}>只看待回顾（{result.needsReview}）</button></div>
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
        <div class="actions"><button onclick={() => request('reset')}>清除本卷并重做</button><button class="primary" onclick={() => select(mode === 'A' ? 'B' : 'A')}>去 {mode === 'A' ? 'B' : 'A'} 卷</button></div>
      </section>
    {:else if current}
      <div class="workspace">
        <aside class="board" aria-label="答题卡">
          <p class="eyebrow">答题卡</p><h2>{info[mode].title}</h2>
          <p aria-live="polite">已填完 {questions.length-incomplete} / {questions.length} 题</p>
          <progress aria-label="答题进度" max={questions.length} value={questions.length-incomplete}></progress>
          <nav class="numbers" aria-label="选择题目">
            {#each questions as q, i (q.id)}
              {@const status = completion(q, paper.answers)}
              <button class:full={status === 'full'} class:partly={status === 'part'} aria-current={paper.index === i ? 'step' : undefined} aria-label={`第 ${i+1} 题，${status === 'full' ? '已填完' : status === 'part' ? '部分已答' : '未答'}`} onclick={() => go(i)}>{i+1}</button>
            {/each}
          </nav>
          <div class="board-actions"><button class="primary" onclick={() => request('submit')}>交卷评分</button><button onclick={() => select('')}>返回选卷</button></div>
        </aside>
        <section class="sheet" aria-label="当前题目">
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
          <div class="actions"><button disabled={paper.index === 0} onclick={() => go(paper.index-1)}>← 上一题</button>
            {#if paper.index === questions.length-1}<button class="primary" onclick={() => request('submit')}>检查并交卷</button>
            {:else}<button class="primary" onclick={() => go(paper.index+1)}>下一题 →</button>{/if}
          </div>
        </section>
      </div>
    {/if}
  </main>
  <footer class="wrap">原创练习 · <a href="https://ai.xsj21.com/textbooks/grade-4-1/" target="_blank" rel="noopener noreferrer">北师大版四上教材目录参考</a></footer>
  <dialog bind:this={dialog} onclose={finishConfirmation} aria-labelledby="confirm-multiplication">
    <h2 id="confirm-multiplication">{confirmation === 'reset' ? '重新作答本卷？' : '现在交卷吗？'}</h2>
    <p>{confirmation === 'reset' ? '只清除本卷的答案和成绩，另一卷保留。' : incomplete ? `还有 ${incomplete} 题没有填完整，空白小问按 0 分算。交卷后可查看评分和解析。` : '已填完所有题。交卷后可以查看解析，本次答案不再修改。'}</p>
    <form method="dialog" class="actions"><button value="no">返回检查</button><button class="primary" value="yes">{confirmation === 'reset' ? '清除并重做' : '确认交卷'}</button></form>
  </dialog>
</div>

<style>
  .multiply{--ink:#152d27;--pine:#164e3c;--muted:#465f54;--line:#cddace;--paper:#fffdf6;background:#edf3e9;color:var(--ink);font:1rem/1.62 system-ui,sans-serif;min-height:100vh}
  .multiply :is(h1,h2,p){margin:0}
  .multiply :is(button,a,input,summary):focus-visible{outline:3px solid #9e4626;outline-offset:3px}
  .wrap{max-width:1080px;padding:0 24px;margin:auto;box-sizing:border-box}
  .top{background:#133c31;color:#f1f7ee}.top-inner{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:62px}.top a,.top span{color:inherit;font-size:.875rem}.top a{padding:9px 0;font-weight:740}
  .hero{margin-top:24px;background:#174936;color:#f5f7e9;border-radius:28px;position:relative;isolation:isolate;overflow:hidden;min-height:270px;padding:32px;display:flex;align-items:center;box-sizing:border-box}
  .hero h1{font-size:clamp(2.15rem,6vw,3.7rem);letter-spacing:-.04em;line-height:1.15;margin:.25rem 0 .55rem}.hero p{max-width:31em}.hero .eyebrow{color:#f9d995}.orbit{position:absolute;width:390px;height:390px;right:-26px;top:-30px;z-index:-1;opacity:.65}
  .eyebrow{font-weight:800;letter-spacing:.1em;font-size:.76rem;color:#346753}.pills,.meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.pills span,.meta span{border-radius:999px;padding:3px 9px;font-size:.82rem;font-weight:700}.pills span{background:#28604d;color:#fffbea}.meta{margin:0 0 10px}.meta span{background:#e7f1e6}.meta span:last-child{margin-left:auto}
  .sets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;margin:16px 0}.set,.sheet,.board,.report,.note{border:1px solid var(--line);border-radius:20px;background:var(--paper);padding:clamp(15px,3vw,26px);min-width:0}.set{display:grid;align-content:start;gap:8px}.set p:not(.eyebrow),.note{color:var(--muted)}.set .primary{justify-self:start}
  button{border:1px solid #9eb5a4;border-radius:11px;padding:8px 13px;background:var(--paper);color:var(--ink);font:inherit;font-weight:720;cursor:pointer;min-height:44px;touch-action:manipulation}.primary{background:var(--pine);border-color:var(--pine);color:#fff}button:hover:not(:disabled):not(.primary){background:#e5f1e3}.primary:hover:not(:disabled){background:#20684f}button:disabled{opacity:.5;cursor:default}
  .workspace{display:grid;grid-template-columns:252px minmax(0,1fr);gap:15px;margin-top:19px;align-items:start}.board{padding:15px;position:sticky;top:10px}.board h2{font-size:1.15rem}.board p{font-size:.82rem}.board-actions{display:flex;flex-wrap:wrap;gap:5px}.board-actions button{padding-inline:8px}
  progress{height:8px;display:block;width:100%;accent-color:#3a7d5b;margin:7px 0}.numbers{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin:10px 0}.numbers button{padding:4px 0;min-width:0;background:white}.numbers .full{background:#d6ebd5;border-color:#82a985}.numbers .partly{background:#fff0c9;border-color:#b8a052}.numbers button[aria-current=step]{background:var(--pine);color:#fff}
  .sheet h1,.report h1{font-size:clamp(1.45rem,4vw,2.15rem);line-height:1.3}.sheet .prompt{margin:10px 0 14px;font-size:1.09rem}.sheet fieldset{border:0;padding:0;margin:12px 0 0;min-width:0}.sheet legend,.numeric label{font-weight:740;padding:0}
  .choice{display:flex;align-items:center;gap:9px;border:1px solid var(--line);border-radius:11px;padding:8px 11px;min-height:44px;background:white;cursor:pointer;margin-top:6px;box-sizing:border-box}.choice:has(input:checked){background:#e0f0df;border-color:#508f71}.choice input{width:17px;height:17px;accent-color:var(--pine);flex:0 0 auto;margin:0}
  .numeric{margin:12px 0 0}.numeric input{display:block;box-sizing:border-box;width:min(100%,320px);min-height:47px;padding:8px 11px;border:1px solid #92a99b;border-radius:11px;background:white;color:var(--ink);font:inherit;margin-top:6px}
  .report{margin-top:19px}.score{font-size:clamp(2.3rem,8vw,3.7rem);line-height:1;color:var(--pine)}.actions,.filters{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:15px}.actions{justify-content:space-between;border-top:1px solid var(--line);padding-top:12px}.score-row{border:0;padding:0}.filters button[aria-pressed=true]{background:#d6ebd5;border-color:#5e9274}
  .skills{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:7px;margin:12px 0}.skills div{background:#edf4ea;border-radius:11px;padding:8px;font-size:.85rem}
  .review{border:1px solid var(--line);border-radius:12px;margin:8px 0}.review summary{display:list-item;cursor:pointer;padding:9px 12px;font-weight:750;line-height:1.55;min-height:44px;box-sizing:border-box}.review summary span{display:inline-block;background:#d6ebd5;border-radius:7px;padding:2px 7px;font-size:.8rem}.review summary .miss,.explanation.miss{background:#fff0e5}.solution{padding:2px 12px 10px}.explanation{border-radius:10px;background:#eff5ed;padding:9px 11px;margin-top:8px}.explanation p+p{margin-top:3px}.hint{font-weight:740;color:#753b27}
  .notice{background:#fff0cc;border-radius:11px;padding:8px 11px}.multiply .notice{margin-top:10px}footer{padding-block:17px 27px!important;font-size:.83rem;color:var(--muted)}footer a{color:var(--pine)}
  dialog{width:min(85vw,440px);border:1px solid #a9c4b2;border-radius:18px;background:var(--paper);color:var(--ink);padding:19px;box-sizing:border-box}dialog::backdrop{background:#142e26a0}
  @media(max-width:740px){.wrap{padding-inline:13px}.hero{padding:25px 18px;min-height:233px;margin-top:14px}.orbit{opacity:.32;right:-140px}.workspace{grid-template-columns:minmax(0,1fr);gap:9px;margin-top:12px}.board{position:static;padding:12px}.numbers{grid-template-columns:repeat(7,minmax(0,1fr))}}
  @media(max-width:480px){.sets{grid-template-columns:1fr;gap:8px}}
  @media(max-width:380px){.numbers{grid-template-columns:repeat(5,minmax(0,1fr))}}
</style>

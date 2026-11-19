<script>
  import { onMount, tick } from 'svelte';
  import { readLocal, writeLocal } from '@yoyo/storage';
  import bank from './math-exam-bank.json';
  import { examKey, isCorrect, summarize, validProgress } from './math-exam.js';
  let answers = $state({}), index = $state(0), started = $state(false), submitted = $state(false), extension = $state(false);
  let confirmSubmit = $state(false), confirmReset = $state(false), storageNotice = $state(''), ready = $state(false);
  const questions = $derived(bank.filter(q => extension || !q.bonus));
  const question = $derived(questions[index]);
  const result = $derived(summarize(bank, answers));
  function save() {
    if (!writeLocal(examKey, {version:1, answers, index, started, submitted, extension})) storageNotice = '此浏览器无法保存进度，请保持页面打开。答案不会上传。';
  }
  onMount(() => {
    const saved = readLocal(examKey, null, validProgress);
    if (saved.status === 'ok') {
      ({ answers, index, started, submitted, extension } = saved.value);
      index = Math.min(index, bank.filter(q => extension || !q.bonus).length - 1);
    } else if (saved.status === 'invalid') storageNotice = '旧进度无法读取，本次从空白开始。';
    else if (saved.status === 'unavailable') storageNotice = '此浏览器无法读取本地进度，请保持页面打开。';
    ready = true;
  });
  function answer(value) { if (submitted) return; answers = {...answers, [question.id]: value}; save(); }
  async function go(next) { index = Math.max(0, Math.min(questions.length - 1, next)); confirmSubmit = false; save(); await tick(); document.getElementById('question-title')?.focus(); }
  function start() { started = true; save(); }
  async function submit() { submitted = true; confirmSubmit = false; save(); await tick(); document.getElementById('result-title')?.focus(); }
  function reset() { answers = {}; index = 0; started = false; submitted = false; extension = false; confirmReset = false; save(); }
</script>

<svelte:head><title>四年级上册数学 · 慢慢想，认真答</title><meta name="description" content="参考北师大版四年级上册编写的数学互动练习，无倒计时、本地保存、提交后逐题讲解。" /></svelte:head>
<div class="exam">
  <header><a href="/learning/math/">← 数学小世界</a><span>悠悠 · 学习之旅</span></header>
  <main>
    <div class="intro"><p class="eyebrow">GRADE 4 · 数学探索</p><h1>慢慢想，认真答。</h1><p>四年级上册综合练习 · 每一道题，都是一次发现。</p><div class="tags"><span>不计时</span><span>可以跳题</span><span>进度仅存本机</span></div></div>
    {#if storageNotice}<p class="notice" role="status">{storageNotice}</p>{/if}
    {#if !started}
      <section class="welcome"><div class="orb" aria-hidden="true">＋<small>×</small>÷</div><h2>准备好，开启你的数学小旅程</h2><p>共 {bank.filter(q => !q.bonus).length} 道正卷题。准备纸和笔，想不出来可以先跳过，回来再想。</p><p>交卷前不展示答案。交卷后一起看思路，不用和别人比。</p><label class="extension"><input type="checkbox" disabled={!ready} bind:checked={extension} onchange={save} /> 加入选做拓展题（不计入正卷分数）</label><button class="primary" disabled={!ready} onclick={start}>开始练习 →</button></section>
    {:else}
      {#if submitted}<section class="result" aria-live="polite"><p class="eyebrow">这一次的发现</p><h2 id="result-title" tabindex="-1">{result.score}<small> / {result.maximum} 分</small></h2><p>正卷答对 {result.correct} / {result.total} 题。分数只是线索，下面的思路更重要。</p><p>点击题号逐题回看。未作答也会展示讲解；选做拓展不计分。</p></section>{/if}
      <div class="workspace">
        <aside aria-label="答题进度"><div class="progress-title"><strong>{submitted ? '逐题回看' : '答题地图'}</strong><span>正卷已答 {result.answered}/{result.total}</span></div><progress max={result.total} value={result.answered} aria-label="正卷完成进度"></progress><nav class="numbers" aria-label="选择题目">{#each questions as q,i}<button class:current={index===i} class:answered={!!answers[q.id]} class:correct={submitted && isCorrect(q,answers[q.id])} class:incorrect={submitted && !isCorrect(q,answers[q.id])} aria-current={index===i?'step':undefined} aria-label={`第${i+1}题${q.bonus?'，选做':''}${answers[q.id]?'，已作答':'，未作答'}`} onclick={()=>go(i)}>{i+1}{#if q.bonus}<sup>选</sup>{/if}</button>{/each}</nav><small>实色表示已答，描边表示当前题。</small></aside>
        {#if question}<section class="question" aria-label="当前题目"><div class="meta"><span>{question.topic}</span><span>{question.bonus ? '选做 · 不计分' : `${question.points} 分`} · {index+1}/{questions.length}</span></div><h2 id="question-title" tabindex="-1">{question.prompt}</h2>
          {#if question.diagram?.type === 'table'}<div class="table-scroll"><table><caption>{question.diagram.caption || '题目数据'}</caption><thead><tr>{#each question.diagram.headers as heading}<th scope="col">{heading}</th>{/each}</tr></thead><tbody>{#each question.diagram.rows as row}<tr>{#each row as cell}<td>{cell}</td>{/each}</tr>{/each}</tbody></table></div>{/if}
          {#if question.type === 'choice'}<fieldset disabled={submitted}><legend>请选择一个答案</legend>{#each question.options as option,i}<label class="option" class:selected={answers[question.id]===option}><input type="radio" name={question.id} value={option} checked={answers[question.id]===option} onchange={()=>answer(option)} /><span class="letter">{String.fromCharCode(65+i)}</span><span>{option}</span></label>{/each}</fieldset>
          {:else}<label class="number-label" for="numeric-answer">你的答案{question.unit ? `（${question.unit}）` : ''}</label><input id="numeric-answer" class="numeric" type="text" inputmode="decimal" autocomplete="off" maxlength="200" value={answers[question.id] || ''} oninput={event=>answer(event.currentTarget.value)} disabled={submitted} placeholder="输入数字" />{/if}
          {#if submitted}<div class="explanation" aria-live="polite"><strong>{isCorrect(question,answers[question.id])?'✓ 这题答对了': answers[question.id] ? '一起再想一想' : '这题还没有作答'}</strong><p>你的答案：{answers[question.id] || '未作答'}</p><p>参考答案：{question.answer}{question.unit || ''}</p><p>{question.explanation}</p></div>{/if}
          <div class="navigation"><button disabled={index===0} onclick={()=>go(index-1)}>← 上一题</button>{#if index<questions.length-1}<button class="primary" onclick={()=>go(index+1)}>{!answers[question.id]&&!submitted?'先跳过':'下一题'} →</button>{/if}</div>
        </section>{/if}
      </div>
      {#if !submitted}<div class="submit-area">{#if confirmSubmit}<div class="confirm" role="status"><h3>现在交卷吗？</h3><p>{result.total-result.answered ? `正卷还有 ${result.total-result.answered} 题未答，将按未作答计分。` : '正卷已全部作答。'}交卷后将显示答案，不能修改本次作答。</p><button onclick={()=>confirmSubmit=false}>继续检查</button><button class="primary" onclick={submit}>确认交卷，查看讲解</button></div>{:else}<button onclick={()=>confirmSubmit=true}>完成检查，准备交卷</button>{/if}</div>{/if}
      <div class="reset">{#if confirmReset}<p>重新开始会清除这套练习在本机保存的答案。</p><button onclick={()=>confirmReset=false}>保留进度</button><button onclick={reset}>确认重新开始</button>{:else}<button class="text-button" onclick={()=>confirmReset=true}>重新开始这套练习</button>{/if}</div>
    {/if}
    <details class="parents"><summary>给家长：范围、来源与隐私说明</summary><p>参考数学课程标准及北师大版 2026 秋新版四年级上册八单元内容自编，不是学校试卷或官方真题。深圳市教科院 2025—2026 免费教辅目录列出的四年级数学配套教材为北师大版，但不同学校和学年的实际教材进度可能不同，请结合孩子课本使用。</p><p>题目中的深圳生活场景和数字均为题设，不代表实时统计。选做题包含课内延伸与课外策略，不计入正卷成绩。本练习不计时，不收集姓名，不上传答案，没有广告；刷新后可在同一浏览器继续。清理浏览器数据会丢失进度。</p><p><a href="https://ai.xsj21.com/textbooks/grade-4-1/" target="_blank" rel="noreferrer">北师大版 2026 秋教材及培训目录 ↗</a> · <a href="https://www.szjky.edu.cn/attachment/0/95/95450/1614133.pdf" target="_blank" rel="noreferrer">深圳市教科院教辅目录 ↗</a> · <a href="https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220510531636118932.pdf" target="_blank" rel="noreferrer">义务教育数学课程标准 ↗</a></p></details>
  </main><footer>不急着答完，重要的是想明白。</footer>
</div>

<style>
.exam{font-family:system-ui,sans-serif;color:#24453e;background:#f5f7f0;min-height:100vh;line-height:1.7}header,main,footer{max-width:1040px;margin:auto;padding:24px}header{display:flex;justify-content:space-between;font-size:14px}a{color:#306652}header span{color:#6d7b72}.intro{padding:25px 0 32px}.eyebrow{font-size:12px;letter-spacing:.15em;color:#697963;font-weight:700}h1{font-size:clamp(30px,5vw,48px);line-height:1.2;margin:15px 0}h2{line-height:1.6}p{margin:10px 0}.tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}.tags span{font-size:12px;border:1px solid #ccd8c4;border-radius:20px;padding:4px 13px}.welcome,.question,.result{background:white;border:1px solid #dce3d5;border-radius:24px;padding:30px}.welcome{max-width:680px;margin:auto;text-align:center}.orb{font-size:48px;background:#edf2c9;border-radius:50%;width:110px;height:110px;margin:5px auto 20px;display:flex;align-items:center;justify-content:center;gap:8px}.orb small{color:#839b5a}.extension{display:block;margin:25px 0}button{font:inherit;cursor:pointer;min-height:46px;border-radius:12px;padding:10px 18px;background:#fff;color:#24453e;border:1px solid #c4d4c9}button:hover{background:#eef3e8}button:focus-visible,a:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #be8b2c;outline-offset:4px}button:disabled{opacity:.45;cursor:default}.primary{background:#315d4e;color:white;border-color:#315d4e}.primary:hover{background:#24493c}.workspace{display:grid;grid-template-columns:230px 1fr;gap:20px;align-items:start}aside{border-radius:20px;padding:20px;background:#eaf0df}.progress-title{display:grid;font-size:14px}progress{width:100%;accent-color:#315d4e;height:8px}.numbers{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:18px 0}.numbers button{padding:5px;min-width:0;border:2px solid transparent;position:relative}.numbers button.answered{background:#315d4e;color:#fff}.numbers button.current{outline:2px solid #b5842c;outline-offset:2px}.numbers button.incorrect{background:#f8e5d1;color:#6e3f20}.numbers button.correct{background:#315d4e;color:white}sup{font-size:8px;position:absolute;right:1px;top:0}.meta{display:flex;justify-content:space-between;gap:12px;font-size:12px;color:#687a6e}.question h2{font-size:21px;white-space:pre-line;margin:24px 0}.question h2:focus{outline:none}fieldset{border:0;padding:0;margin:0}legend,.number-label{font-size:14px;color:#66786c;margin-bottom:12px}.option{display:flex;align-items:center;gap:12px;padding:13px;border:1px solid #dbe2d7;border-radius:12px;margin:10px 0;cursor:pointer}.option.selected{background:#edf3e4;border-color:#53775c}.option input{accent-color:#315d4e}.letter{color:#839081;font-size:12px}.number-label{display:block}.numeric{box-sizing:border-box;font:inherit;border:1px solid #9caf9d;border-radius:12px;padding:14px;width:100%;max-width:360px}.navigation{display:flex;justify-content:space-between;gap:12px;margin-top:30px}.submit-area,.reset{text-align:center;margin:25px 0}.confirm{background:#fff5db;border-radius:18px;padding:24px}.confirm button,.reset button{margin:5px}.text-button{border:0;background:none;color:#66786c;font-size:13px}.result{margin-bottom:24px;background:#e6efdb}.result h2{font-size:42px;margin:0}.result small{font-size:20px;font-weight:400}.explanation{background:#f1f4e9;padding:20px;border-radius:14px;margin-top:25px}.parents{font-size:13px;border-top:1px solid #d4ddcd;padding-top:20px;margin-top:36px}.parents summary{cursor:pointer;font-weight:600}.notice{background:#fff2d9;padding:12px;border-radius:12px}footer{text-align:center;color:#697963;font-size:12px}.table-scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:14px;margin-bottom:20px}th,td{padding:10px;border:1px solid #d4ddcd;text-align:center}th{background:#edf2e6}caption{text-align:left;margin-bottom:8px}input[type=checkbox],input[type=radio]{width:18px;height:18px;vertical-align:middle}@media(max-width:700px){header,main,footer{padding:18px}.workspace{grid-template-columns:1fr}aside{padding:16px}.numbers{grid-template-columns:repeat(6,1fr);margin:12px 0}.progress-title{display:flex;justify-content:space-between}.welcome,.question,.result{padding:22px;border-radius:20px}.question h2{font-size:19px}header span{font-size:12px}.intro{padding-top:15px}.navigation button{padding:10px 14px}.meta{font-size:11px}}
</style>

<script>import './learning.css';
import RecordJournal from './RecordJournal.svelte';
import Button from '@yoyo/ui/button';
import Card from '@yoyo/ui/card';

const exams = [
  { unit: '03', label: '第三单元 · 两套互动卷', title: '整数乘法实验站', detail: '常规卷和挑战卷各 15 题，练竖式、估算和应用推理。交卷后按小问计分，解释错在哪一步。', href: '/learning/math/integer-multiplication/', action: '打开第三单元两套试卷' },
  { unit: '02', label: '第二单元 · 专项互动卷', title: '线与角：把线画清，把角想明白', detail: '20 道正卷题与 4 道较难选做，配图看得清，量角器可以点、可以画。不计时，独立保存进度。', href: '/learning/math/lines-and-angles/', action: '开始线与角互动卷' },
  { unit: 'Σ', label: '四年级上册 · 综合练习', title: '慢慢想，认真答', detail: '15 道正卷题，另有 3 道选做拓展。不计时，可跳题，本机保存进度，交卷后逐题讲解。', href: '/learning/math/grade-four-fall/', action: '开始数学综合练习' },
];
</script>
<svelte:head><title>数学 · 悠悠的学习之旅</title></svelte:head>

    <div class="learning-page"><div class="page">
      <header class="topbar">
        <a class="wordmark" href="/learning/">✳ 悠悠的学习之旅</a
        ><a class="back" href="/">← 游戏大厅</a>
      </header>
      <main>
        <nav class="breadcrumb">
          <a href="/learning/">学习地图</a><span>/</span><span>数学</span>
        </nav>
        <section class="subject-heading" style="--card: #c2e6d3">
          <span class="subject-icon" aria-hidden="true">✦</span>
          <div>
            <p class="eyebrow">线与角 · 几何探险</p>
            <h1>数学小世界</h1>
            <p>从一条线出发，找到推理的乐趣。</p>
          </div>
        </section>
        <section class="exam-shelf" aria-labelledby="exam-shelf-title">
          <div class="shelf-heading">
            <h2 id="exam-shelf-title">数学试卷</h2>
            <p>选一套慢慢做。每套单独保存进度。</p>
          </div>
          <div class="exam-cards">
            {#each exams as exam, i (exam.href)}
              <Card class="exam-card" aria-labelledby={`math-exam-${i}`}>
                <span class="unit-icon" class:geometry={i === 1} class:overview={i === 2} aria-hidden="true">{exam.unit}</span>
                <div class="exam-copy">
                  <p class="eyebrow">{exam.label}</p>
                  <h3 id={`math-exam-${i}`}>{exam.title}</h3>
                  <p>{exam.detail}</p>
                </div>
                <Button href={exam.href} variant={i === 0 ? 'default' : 'outline'}>{exam.action} <span aria-hidden="true">→</span></Button>
              </Card>
            {/each}
          </div>
        </section>
        <section class="featured">
          <div>
            <p class="eyebrow">已收录 · 第二单元学业质量测评</p>
            <h2>先认识这次的发现</h2>
            <p>
              计算是已有的优势。接下来，重点探索线段与射线、角的度量、平行垂直，以及生活中的图形推理。
            </p>
            <p class="report-date">报告生成于 2026-10-30 · 考试日期未提供</p>
            <div class="actions">
              <a class="button secondary" href="/learning/math/report/">阅读原版分析 ↗</a
              ><a class="button" href="/learning/math/practice/"
                >错题巩固 · 几何思维闯关 →</a
              >
            </div>
          </div>
          <div class="score-stamp">
            <strong>82<span>/100</span></strong
            ><small>一次记录，不是能力的标签</small>
          </div>
        </section>
        <aside class="note">
          <strong>先说明依据：</strong
          >原报告根据照片中可辨认的答案与批改痕迹整理，部分笔迹不清晰，属于定性分析，不能代替精确逐题核对。练习针对报告中的知识薄弱点新编，不冒充原卷错题。
        </aside>
        <section class="improvement">
          <h2>把“会记住”，变成“会解释”</h2>
          <div class="plan-grid">
            <article>
              <span>✋ 先动手</span>
              <h3>看见不变的性质</h3>
              <p>
                延长线条、调整角度、旋转图形。方向变了，端点数量与角度关系会变吗？
              </p>
            </article>
            <article>
              <span>✎ 再画图</span>
              <h3>用图说清已知条件</h3>
              <p>把生活中的路线和物体变成点、线、角。先分清问题，再选方法。</p>
            </article>
            <article>
              <span>💡 最后推理</span>
              <h3>答案之外，说出原因</h3>
              <p>
                从图形关系过渡到算式，再用一道变式题检验。错了先看提示，不靠反复猜答案。
              </p>
            </article>
          </div>
        </section>
        <RecordJournal subject="math" />
      </main>
      <footer>
        一点点发现，一步步成长。<span>不和别人比，只看见自己的进步。</span>
      </footer>
    </div>
  
</div>

<style>
  .exam-shelf { margin-block: 0 2.25rem; }
  .shelf-heading { margin-block-end: .95rem; }
  .shelf-heading h2 { margin: 0; font-size: clamp(1.35rem, 3vw, 1.65rem); }
  .shelf-heading p { margin: .2rem 0 0; color: #52675e; }
  .exam-cards { display: grid; gap: clamp(1rem, 2.3vw, 1.5rem); }
  .exam-cards :global(.exam-card) {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: .9rem 1.25rem;
    --card-padding: clamp(1rem, 3vw, 1.65rem);
  }
  .unit-icon {
    display: grid; place-items: center; width: 3rem; aspect-ratio: 1;
    border-radius: .9rem; background: #e2ecd9; color: #294f40;
    font-size: 1.1rem; font-weight: 800; font-variant-numeric: tabular-nums;
  }
  .unit-icon.geometry { background: #eae4f0; color: #4d3d5d; }
  .unit-icon.overview { background: #f2e8d4; color: #634b31; }
  .exam-copy .eyebrow { margin: 0 0 .15rem; letter-spacing: .075em; color: #52675e; }
  .exam-copy h3 { margin: 0; font-size: clamp(1.05rem, 3.2vw, 1.35rem); line-height: 1.4; }
  .exam-copy p:not(.eyebrow) { margin: .3rem 0 0; color: #52675e; }
  .exam-cards :global(.yoyo-button) { color: var(--color-primary-foreground, #fff); gap: .5rem; font-weight: 720; }
  .exam-cards :global(.yoyo-button.outline) { color: var(--color-primary, #245b4a); }
  @media (max-width:760px) {
    .exam-cards :global(.exam-card) { grid-template-columns: auto minmax(0, 1fr); align-items: start; }
    .exam-cards :global(.yoyo-button) { grid-column: 2; justify-self: start; }
  }
  @media (max-width:420px) {
    .unit-icon { width: 2.4rem; font-size: .95rem; }
    .exam-cards :global(.exam-card) { column-gap: .65rem; }
    .exam-cards :global(.yoyo-button) { grid-column: 1 / -1; justify-self: stretch; }
  }
</style>

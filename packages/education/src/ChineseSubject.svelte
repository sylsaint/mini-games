<script>import './learning.css';
import RecordJournal from './RecordJournal.svelte';</script>
<svelte:head><title>语文 · 悠悠的学习之旅</title></svelte:head>

    <div class="learning-page"><div class="page">
      <header class="topbar">
        <a class="wordmark" href="/learning/">✳ 悠悠的学习之旅</a
        ><a class="back" href="/">← 游戏大厅</a>
      </header>
      <main>
        <nav class="breadcrumb">
          <a href="/learning/">学习地图</a><span>/</span><span>语文</span>
        </nav>
        <section class="subject-heading" style="--card: #f3d4bf">
          <span class="subject-icon" aria-hidden="true">文</span>
          <div>
            <p class="eyebrow">阅读 · 表达 · 积累</p>
            <h1>语文小世界</h1>
            <p>把读过的故事，变成自己的表达。</p>
          </div>
        </section>
        <section class="featured">
          <div>
            <p class="eyebrow">已收录 · 四年级语文考试复盘</p>
            <h2>从会认、读懂，到用得准确、说得清楚</h2>
            <p>
              对照真实作答寻找优势和改进方向。先看情境、找线索，再解释理由，把学会的方法带进新题与自己的表达。
            </p>
            <p class="report-date">报告生成于 2026-10-30 · 考试日期未核实</p>
            <div class="actions">
              <a class="button secondary" href="/learning/chinese/report/"
                >阅读完整考试分析 ↗</a
              >
              <a class="button" href="/learning/chinese/practice/"
                >错题巩固 · 语文闯关 →</a
              >
            </div>
          </div>
          <div class="score-stamp">
            <strong>82<span>/100</span></strong
            ><small>一次发现，不是能力的标签</small>
          </div>
        </section>
        <aside class="note">
          <strong>分析依据：</strong
          >根据四张试卷照片中可辨认的题目、作答及批改整理。部分笔迹和分项得分不清，报告区分明确错误、部分完成与待核实内容，不推算失分。只展示去身份化的分析，原始照片不公开上传。练习为针对薄弱点设计的原创变式，不冒充原卷原题。
        </aside>
        <section class="improvement">
          <h2>从一个画面，走向一句有依据的话</h2>
          <div class="plan-grid">
            <article>
              <span>✋ 先观察</span>
              <h3>把情境和线索看见</h3>
              <p>看图、读句、摆顺序，先说“发生了什么”，再找词语和细节。</p>
            </article>
            <article>
              <span>✎ 再解释</span>
              <h3>让答案有依据</h3>
              <p>圈出题目的每个任务，用“我认为……因为……”说清自己的判断。</p>
            </article>
            <article>
              <span>💡 最后迁移</span>
              <h3>换一种情境也会用</h3>
              <p>
                把字词用进新句子，把想象写成具体行动；再用自查清单做一次修改。
              </p>
            </article>
          </div>
        </section>
        <RecordJournal subject="chinese" />
      </main>
      <footer>
        一点点发现，一步步成长。<span>不和别人比，只看见自己的进步。</span>
      </footer>
    </div>
  
</div>

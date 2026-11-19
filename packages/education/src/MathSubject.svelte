<script>import './learning.css';
import RecordJournal from './RecordJournal.svelte';</script>
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
        <section class="featured"><div><p class="eyebrow">新练习 · 四年级上册综合</p><h2>慢慢想，认真答</h2><p>15 道正卷题，另有 3 道选做拓展。不计时，可跳题，本机保存进度，交卷后逐题讲解。</p><a class="button" href="/learning/math/grade-four-fall/">开始数学综合练习 →</a></div></section>
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

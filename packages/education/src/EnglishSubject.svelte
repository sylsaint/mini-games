<script>import './learning.css';
import RecordJournal from './RecordJournal.svelte';</script>
<svelte:head><title>英语 · 悠悠的学习之旅</title></svelte:head>

    <div class="learning-page"><div class="page">
      <header class="topbar">
        <a class="wordmark" href="/learning/">✳ 悠悠的学习之旅</a
        ><a class="back" href="/">← 游戏大厅</a>
      </header>
      <main>
        <nav class="breadcrumb">
          <a href="/learning/">学习地图</a><span>/</span><span>英语</span>
        </nav>
        <section class="subject-heading" style="--card: #d9d2f1">
          <span class="subject-icon" aria-hidden="true">Aa</span>
          <div>
            <p class="eyebrow">听说 · 阅读 · 词句</p>
            <h1>英语小世界</h1>
            <p>在熟悉的生活中，发现新的语言。</p>
          </div>
        </section>
        <section class="empty-intro">
          <span aria-hidden="true">Aa</span>
          <div>
            <h2>这个世界，等你的第一份发现。</h2>
            <p>
              目前还没有英语考试分析或专属练习。先记录考试与疑问，之后可根据真实题目添加复盘和巩固内容。
            </p>
          </div>
        </section>
        <RecordJournal subject="english" />
      </main>
      <footer>
        一点点发现，一步步成长。<span>不和别人比，只看见自己的进步。</span>
      </footer>
    </div>
  
</div>

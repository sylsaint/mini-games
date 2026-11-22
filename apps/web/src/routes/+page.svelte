<script>
import { onMount } from 'svelte';
import AboutDialog from '../../../../packages/ui/src/Dialog.svelte';

let games = $state([]); let error = $state(false);
async function load(){error=false;try{const r=await fetch('/games.json');if(!r.ok)throw Error();games=await r.json();}catch{error=true;}}
onMount(load);
</script>
<svelte:head><title>Mini Games · 玩心不打烊</title><meta name="description" content="悠悠的学习、旅行和游戏世界。"/></svelte:head>

<div class="home-page"><div class="shell">
      <header>
        <a class="brand" href="/" aria-label="Mini Games 首页"
          ><span class="brand-icon">m<span>g</span></span
          >mini games<span class="dot">●</span></a
        ><span class="header-note">小小的游戏 · 大大的快乐</span>
      </header>
      <main>
        <section class="hero">
          <div>
            <p class="eyebrow">
              <span class="live-dot"></span> YOUR LITTLE PLAYGROUND
            </p>
            <h1>
              给生活，<br />留一点<span class="highlight"
                >好玩的空隙<i>✦</i></span
              >
            </h1>
            <p class="hero-copy">
              不用下载，不用登录。<br />随手打开，和好奇心一起玩一会儿。
            </p>
            <a class="primary-link" href="#games">发现小游戏 <span>↗</span></a>
          </div>
          <div class="hero-art" aria-hidden="true">
            <div class="orbit orbit-one"></div>
            <div class="orbit orbit-two"></div>
            <div class="tile tile-purple">×</div>
            <div class="tile tile-orange">24</div>
            <div class="tile tile-green">+</div>
            <span class="spark spark-one">✦</span
            ><span class="spark spark-two">✧</span>
            <div class="art-label">PLAY. THINK. SMILE.</div>
          </div>
        </section>
        <section id="games" class="games-section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">PICK YOUR NEXT LITTLE ADVENTURE</p>
              <h2>今天，玩点什么？</h2>
            </div>
            <span id="game-count" class="count">{error ? "加载遇到一点问题" : games.length + " 款小游戏 · 持续上新"}</span>
          </div>
          <div id="game-list" class="grid" aria-live="polite">{#each games as game}<a class="game-card" href={game.id === "mawangdui-treasure" ? "/games/mawangdui-treasure/" : game.url}><img src={game.cover} alt={game.name + ' 游戏封面'} width="640" height="400"/><div class="card-body"><div class="tags">{#each game.tags as tag}<span>{tag}</span>{/each}</div><h3>{game.name}</h3><p>{game.description}</p><div class="card-bottom">即刻开玩<span>↗</span></div></div></a>{/each}</div>
          <p id="load-error" hidden={!error}>
            游戏列表暂时没有加载成功。<button id="retry" class="text-button" onclick={load}>
              再试一次
            </button>
          </p>
          <noscript
            ><p>
              请开启 JavaScript 查看游戏列表，也可直接打开
              <a href="/games/twenty-four/">24点 · 数字探险家</a>。
            </p></noscript
          >
        </section>
        <a
          class="learning-entry"
          href="/learning/"
          aria-label="悠悠的学习之旅：数学、语文、英语、科学、计算机"
        >
          <span class="learning-mark" aria-hidden="true">✳</span>
          <div>
            <p>YOYO’S LITTLE LEARNING WORLD</p>
            <h2>悠悠的学习之旅</h2>
            <span
              >收藏每一次发现，把小困惑变成新冒险。<br />数学 · 语文 · 英语 ·
              科学 · 计算机</span
            >
          </div>
          <b aria-hidden="true">↗</b>
        </a>
        <a class="learning-entry" href="/travel/hunan/"><span class="learning-mark" aria-hidden="true">山</span><div><p>FAMILY TRAVEL JOURNAL</p><h2>长沙岳阳亲子游手册</h2><span>读历史、赏诗词，带着好奇心出发。</span></div><b aria-hidden="true">↗</b></a><section class="manifesto">
          <span>✳</span>
          <p>不必每一分钟都很有用。<br /><strong>有趣，就很好。</strong></p>
          <span class="manifesto-note">Made for your little breaks.</span>
        </section>
      </main>
      <div style="text-align:center;padding:12px"><AboutDialog title="悠悠的探索世界" description="教育、旅行与游戏，同一个轻量入口。" trigger="关于本站"><p>学习进度只保存在当前浏览器，不会自动上传。换设备前可以在各页面导出自己的记录。</p></AboutDialog></div><footer>
        <span>© <span id="year">2026</span> Mini Games</span
        ><span>小屏幕，也有大乐趣。<span class="footer-dot">✦</span></span>
      </footer>
    </div>
  </div>
<style>
.home-page {
  font-family:
    ui-sans-serif,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    "PingFang SC",
    "Microsoft YaHei",
    sans-serif;
  color: #252828;
  background: #f7f6f2;
  font-synthesis: none;
  scroll-behavior: smooth;
}
* {
  box-sizing: border-box;
}
.home-page {
  margin: 0;
}
a {
  color: inherit;
  text-decoration: none;
}
a {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
a:focus-visible,
button:focus-visible {
  outline: 3px solid #714fc0;
  outline-offset: 5px;
}
.shell {
  max-width: 1160px;
  padding: 0 40px;
  margin: auto;
}
header {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #deded7;
}
.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  font-size: 23px;
  font-weight: 800;
  letter-spacing: -1px;
}
.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #2c3230;
  border-radius: 12px;
  width: 41px;
  height: 41px;
  font-size: 24px;
  letter-spacing: -3px;
  padding-right: 3px;
}
.brand-icon span {
  color: #d5e6b2;
}
.dot {
  font-size: 9px;
  color: #ff8d55;
  align-self: flex-start;
  margin: 10px 0 0 -6px;
}
.header-note {
  font-size: 12px;
  color: #6f7770;
}
.hero {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 35px;
  align-items: center;
  padding: 73px 0 76px;
}
.eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.8px;
  color: #747b73;
}
.live-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #899e5c;
  margin-right: 9px;
}
h1 {
  font-size: clamp(36px, 4.2vw, 57px);
  line-height: 1.4;
  letter-spacing: -2px;
  margin: 22px 0;
}
.highlight {
  position: relative;
  white-space: nowrap;
}
.highlight:after {
  content: "";
  height: 13px;
  position: absolute;
  bottom: 5px;
  left: 0;
  right: 0;
  background: #dce8bd;
  z-index: -1;
}
.highlight i {
  font-style: normal;
  color: #de9564;
  position: absolute;
  right: -28px;
  top: -22px;
  font-size: 32px;
}
.hero-copy {
  color: #747972;
  font-size: 14px;
  line-height: 1.9;
}
.primary-link {
  display: inline-flex;
  margin-top: 15px;
  background: #2e3c32;
  color: white;
  align-items: center;
  gap: 32px;
  padding: 15px 21px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 650;
}
.primary-link span {
  font-size: 22px;
  line-height: 1;
}
.hero-art {
  position: relative;
  height: 330px;
  background: radial-gradient(ellipse, #edece3 0, transparent 70%);
}
.tile {
  position: absolute;
  width: 112px;
  height: 128px;
  display: grid;
  place-items: center;
  border: 3px solid rgba(255, 255, 255, 0.7);
  border-radius: 22px;
  box-shadow:
    0 14px 0 -5px #0000000c,
    0 24px 40px #34342a12;
  font-size: 62px;
  font-weight: 750;
}
.tile-purple {
  left: 15%;
  top: 65px;
  transform: rotate(-16deg);
  background: #ded4f1;
  color: #786398;
}
.tile-orange {
  left: 42%;
  top: 30px;
  transform: rotate(10deg);
  background: #ffc18f;
  color: #855531;
  z-index: 2;
}
.tile-green {
  left: 55%;
  top: 156px;
  transform: rotate(16deg);
  background: #d7e4bc;
  color: #697e4e;
}
.orbit {
  position: absolute;
  width: 300px;
  height: 220px;
  border: 1px dashed #c9cec1;
  border-radius: 50%;
  top: 45px;
  left: 12%;
  transform: rotate(-20deg);
}
.orbit-two {
  transform: rotate(35deg);
  width: 250px;
}
.spark {
  position: absolute;
  font-size: 40px;
  color: #868f77;
}
.spark-one {
  right: 3%;
  top: 35px;
}
.spark-two {
  left: 13%;
  bottom: 48px;
  color: #d09978;
}
.art-label {
  position: absolute;
  bottom: 0;
  left: 25%;
  font-size: 10px;
  letter-spacing: 3px;
  color: #8a9184;
}
.games-section {
  padding: 22px 0 50px;
  scroll-margin-top: 25px;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  margin-bottom: 28px;
}
h2 {
  font-size: 28px;
  letter-spacing: -1px;
  margin: 12px 0 0;
}
.count {
  font-size: 11px;
  color: #777e73;
  border: 1px solid #dddcd4;
  border-radius: 30px;
  padding: 9px 12px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.game-card {
  display: block;
  background: #fffefb;
  border: 1px solid #e3e2da;
  border-radius: 20px;
  overflow: hidden;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px #3133250d;
}
.game-card img {
  width: 100%;
  height: auto;
  display: block;
  aspect-ratio: 8/5;
  object-fit: cover;
}
.card-body {
  padding: 23px;
}
.tags {
  display: flex;
  gap: 6px;
}
.tags span {
  font-size: 10px;
  padding: 5px 8px;
  background: #f0f2e9;
  border-radius: 5px;
  color: #788064;
}
h3 {
  margin: 15px 0 10px;
  font-size: 21px;
}
.card-body p {
  font-size: 12px;
  line-height: 1.8;
  color: #7e8179;
  min-height: 43px;
  margin: 0;
}
.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  margin-top: 24px;
  padding-top: 15px;
  border-top: 1px solid #eeeee6;
}
.card-bottom span {
  width: 29px;
  height: 29px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #e7eddc;
  font-size: 19px;
}
.manifesto {
  display: flex;
  align-items: center;
  gap: 22px;
  margin: 15px 0 45px;
  border: 1px solid #e1e3d5;
  border-radius: 16px;
  padding: 24px 30px;
  background: #eeefe5;
}
.manifesto > span:first-child {
  font-size: 45px;
  color: #8b9c68;
}
.manifesto p {
  font-size: 13px;
  line-height: 1.8;
  color: #777d70;
  margin: 0;
}
.manifesto strong {
  color: #414b3b;
  font-weight: 600;
}
.manifesto-note {
  margin-left: auto;
  font-size: 11px;
  color: #858d7a;
}
footer {
  border-top: 1px solid #dfdfd6;
  display: flex;
  justify-content: space-between;
  padding: 25px 0 35px;
  font-size: 10px;
  color: #8a8e83;
}
.footer-dot {
  color: #a1ae83;
  padding-left: 15px;
}
.text-button {
  border: 0;
  background: none;
  text-decoration: underline;
  cursor: pointer;
  min-height: 44px;
  color: inherit;
}
@media (max-width: 750px) {
  .shell {
    padding: 0 23px;
  }
  header {
    height: 80px;
  }
  .header-note {
    display: none;
  }
  .hero {
    grid-template-columns: 1fr;
    gap: 15px;
    padding: 38px 0 43px;
  }
  h1 {
    font-size: 40px;
  }
  .hero-art {
    height: 260px;
    max-width: 360px;
    width: 100%;
    margin: 0 auto;
  }
  .tile {
    width: 94px;
    height: 108px;
    font-size: 50px;
  }
  .tile-green {
    top: 132px;
  }
  .tile-purple {
    top: 57px;
  }
  .orbit {
    height: 170px;
    width: 260px;
  }
  .art-label {
    bottom: -10px;
  }
  .hero-copy {
    font-size: 13px;
  }
  .section-heading {
    display: block;
  }
  .count {
    display: inline-block;
    margin-top: 18px;
  }
  .grid {
    grid-template-columns: 1fr;
  }
  .game-card img {
    max-height: 270px;
  }
  .manifesto {
    padding: 20px;
    gap: 15px;
  }
  .manifesto-note {
    display: none;
  }
  h2 {
    font-size: 25px;
  }
  footer {
    gap: 16px;
    line-height: 1.8;
    padding-bottom: max(25px, env(safe-area-inset-bottom));
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    scroll-behavior: auto !important;
    transition: none !important;
  }
}

.learning-entry {
  display: flex;
  align-items: center;
  gap: 26px;
  background: #e4eddf;
  color: #294f40;
  border: 1px solid #d1dfc9;
  border-radius: 24px;
  padding: 32px;
  margin: 38px 0;
}
.learning-entry .learning-mark {
  font-size: 70px;
  color: #6f9771;
}
.learning-entry p {
  font-size: 10px;
  letter-spacing: 2px;
  margin: 0 0 9px;
}
.learning-entry h2 {
  font-size: 29px;
  letter-spacing: -0.6px;
  margin: 0 0 12px;
}
.learning-entry div > span {
  font-size: 14px;
  line-height: 1.8;
  color: #59735d;
}
.learning-entry b {
  margin-left: auto;
  font-size: 35px;
}
.learning-entry:hover {
  background: #dce8d5;
}
@media (max-width: 600px) {
  .learning-entry {
    gap: 16px;
    padding: 24px;
  }
  .learning-entry .learning-mark {
    display: none;
  }
  .learning-entry h2 {
    font-size: 25px;
  }
  .learning-entry div > span {
    font-size: 12px;
  }
  .learning-entry b {
    font-size: 25px;
  }
}

</style>

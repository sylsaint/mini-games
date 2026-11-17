# @yoyo/games

24 点独立领域包。`@yoyo/games/twenty-four` 导出 Svelte 5 页面组件；`@yoyo/games/math` 导出无浏览器依赖的精确分数与表达式算法。

- `bank.json` 原样提取原始 50 关、500 题；进入游戏页面才动态加载引擎和题库，不进入全站首页 bundle。
- `TwentyFour.svelte` 及九个子组件负责题牌、运算符、模式、题目进度、反馈、讲解、方法手册、地图和结算的声明式渲染。没有 iframe、整页 HTML 注入、`innerHTML` 或 `{@html}`。
- `engine.js` 保留原规则和音效，封装为每次挂载独立的控制器。局部文案、原生 dialog、拖拽动画和按钮 disabled 的 DOM 更新保留，所有动态结构由 Svelte 管理。监听器、定时器和 AudioContext 在卸载时释放。
- `math.js` 纯逻辑：精确有理数、四牌校验和表达式解析，不使用 `eval`。
- `game.css` 全部规则限定 `.twenty-four-game`，不影响其他领域。
- localStorage 继续使用 `math24_adventure_v1`，记录、历史星级、计时模式、剩余时间、合并牌面和方法学习统计均兼容。
- 原始单文件保留为源文件 checksum 基线；站点构建应复制到 `/games/twenty-four/offline.html`，页面提供明确的原版离线下载链接。这个下载版本保持原版，不声称拆包在线版无需网络。

验证：`node --test packages/games/src/*.test.js` 校验全部精选解法、分数精度、非法输入。现有 `tests/browser/game.spec.js` 继续覆盖点选、拖拽、计时、音效、回退与触屏流程。

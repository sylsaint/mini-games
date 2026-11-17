# @yoyo/games

24 点独立领域包。`@yoyo/games/twenty-four` 导出 Svelte 5 页面组件；`@yoyo/games/math` 导出无浏览器依赖的精确分数与表达式算法。

## 结构与交互边界

- `bank.json` 原样提取原始 50 关、500 题。游戏页面挂载后才动态加载引擎和题库，不进入全站首页 bundle。
- `TwentyFour.svelte` 和九个子组件声明式渲染牌面、模式、进度、计时、提示、按钮状态、反馈、讲解、方法手册、地图、总结、拖拽样式和保存状态。没有 iframe、整页 HTML 注入、`innerHTML` 或 `{@html}`。
- 所有按钮、模式、题牌、运算符、方法及反思选项使用显式 Svelte 事件回调，不再依赖页面级 click 委托或 DOM 数据反查。
- `engine.js` 为领域控制器：`createGame(notify, browser)` 返回显式命令和生命周期方法。它发出普通视图状态，不持有 DOM 节点，不查询选择器、不写 `textContent`、`hidden`、class 或 style；没有虚拟 DOM 代理。
- `browser` 是窄能力边界，仅处理原生 dialog 开关、布局刷新后的滚动、pointer capture/release 和拖拽落点命中测试。Svelte 通过 `<svelte:window>` / `<svelte:document>` 管理 pointer、Escape、页面隐藏和可见性事件。
- AudioContext 和游戏计时留在引擎中；销毁时暂停并保存有效会话，清除所有计时任务并关闭音频。重复的原生 close 通知不会重置剩余时间。
- `math.js` 保留精确有理数、四牌校验与表达式解析，不使用 `eval`。
- `game.css` 全部规则限定 `.twenty-four-game`，不影响其他领域。

## 存储与兼容

通过 `@yoyo/storage` 的 `readLocal` / `writeLocal` 读写，领域包仍负责旧数据校验及恢复。key 保持 `math24_adventure_v1`；记录、历史星级、计时模式、剩余时间、合并牌面和方法学习统计均兼容。首次挂载不写默认值，不覆盖损坏记录；保存失败以现有中文提示显示，游戏仍可继续。

原始单文件保持源文件 checksum 基线；构建复制到 `/games/twenty-four/offline.html`，页面有明确的原版离线下载链接。下载版本保持原版，不声称拆包在线版无需网络。

## 验证

`node --test packages/games/src/*.test.js` 验证全部精选解法、分数精度、非法输入、显式动作求解、局部进度恢复、提示/方法/反思、计时模式、原生弹窗暂停、后台暂停、超时前进、拖拽取消、存储损坏/配额失败与生命周期清理。控制器测试不模拟 DOM；仅使用计时、存储与浏览器能力桩。

`tests/browser/game.spec.js` 保留点选、拖拽、计时、真实 AudioContext、浏览器回退与触屏覆盖，另加声明式方法按钮/反馈重置、重新载入的牌面与音效偏好恢复。浏览器结果以实际运行环境/CI 的报告为准，单测与编译通过不代表浏览器回归已通过。

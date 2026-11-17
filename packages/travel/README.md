# 旅游领域：湘行小课堂

`src/HunanGuide.svelte` 是网络版入口。景点、照片、人物、诗词、小游戏均为 Svelte 组件/响应式状态，不注入旧 HTML，不运行旧 DOM 渲染器。

- `Station.svelte` 保留讲解、来源、亲子任务、封护结构及昼夜湖景交互。
- `PhotoCard.svelte` 用 IntersectionObserver 按接近视口加载，仅当前景点渲染其图片；打印按钮显式加载全册。
- `data/guide.json` 与已公开基线逐字节一致，图片哈希、署名与许可不变。
- 构建时将 `data/` 与 `assets/` 复制到 `/travel/hunan/`。文本从 `./data/guide.json` 请求，有错误提示与重试。
- 护照 `xiangxing-passport-v1` 保持 key 与数组格式；异常数据不会覆盖已有存储，保存失败明确提示。
- `@yoyo/speech` 保留 e5efc43 的本机普通话选择和 iOS 同步队列实现，增加卸载清理。真实 iOS 仍需设备验证。
- 网络样式统一在 `.hunan-guide` 下，避免离开旅游页后污染其他领域。
- 离线导出是明确的独立交付格式：用户点击后才动态导入 `src/offline.js`，读取全部图片，并基于 `offline/` 中归档静态模板和原生运行时生成无需网络的单 HTML。此导出运行时不会初始化网络版，也不进首屏依赖。

本包内容与语音契约：`node --test packages/travel/test/*.test.mjs`。整站浏览器回归继续使用 `tests/browser/hunan.spec.js`，覆盖真实网络版及无网络离线导出。

## 在线事件与原生浏览器边界

在线页面不再安装 `document.click` 委托，也不通过 `innerHTML` 改写操作按钮。`Station` 与 `PhotoCard` 通过显式回调通信，问答、诗词译文、地图、盖章、下载中的禁用状态由 Svelte 状态驱动。护照持久化使用 `@yoyo/storage` 的安全读取/写入边界，读取不会写默认值。

保留必要的原生能力：照片 `dialog.showModal/close` 及焦点行为、IntersectionObserver 图片懒加载、打印时图片解码与展开/还原原生 details、Blob/下载链接、URL hash、页面离开清理。共享 speech 仍保留已经验证的 DOM 适配器（音色控件与朗读按钮更新），其同步 iOS 队列没有重写。独立离线 HTML 继续使用导出专用原生运行时，不代表在线组件仍依赖该运行时。

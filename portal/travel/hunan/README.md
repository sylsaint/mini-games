# 湘行小课堂：渐进式前端

沿用 mini-games 的原生 ES modules + 静态构建，不增加框架运行时。

- `index.html`：约 17 KB 的语义化页面骨架、图标、首屏图片引用。
- `src/styles.css`：独立样式。
- `src/main.js`：入口、内容 JSON 加载与失败重试。
- `src/app.js`：讲解、照片灯箱、搜索、诗词、小游戏与学习护照。
- `data/guide.json`：约 64 KB 的完整文本与图像元数据，不再混入二进制图片。
- `assets/`：9 张原始 JPEG，以 SHA-256 内容摘要命名，保留原图、比例、作者及许可。
- `src/offline.js`：只有点击「离线保存」才动态加载，按需获取全套资源并合成可独立打开的单文件 HTML。

## 加载与兼容

首屏只加载页面、CSS、模块、轻量文本 JSON 和首页图片。其余图片以 IntersectionObserver 在距离可视区域 120 px 时加载；隐藏景点不触发下载。进入景点后再随滚动加载。放大图片按点击加载。不自动预取完整手册。

完整文本一起下载（约 64 KB），保留原有全文搜索、全站打印与全部小游戏，不为很小的文本制造更多往返。照片是主要流量，按需加载。离线保存仍生成原有的单文件 HTML，仅用户显式操作时支付完整下载成本；未保存的网络版不承诺断网冷启动。原 localStorage 键 `xiangxing-passport-v1`、站点 ID、链接锚点均保持不变。

从仓库根目录运行 `npm run check`、`npm run serve`、`npm run test:e2e`。不要双击网络版 index.html，模块及 JSON 需要 HTTP 服务；下载的离线 HTML 可以双击打开。

通过 GitHub PR → CI → main → 现有 Cloudflare Pages CD 发布，不改变其他页面及其部署方式。浏览器回归覆盖三种视口、慢图片加载、错误重试、学习记录兼容、按需图片和完整离线导出。

# 悠悠前端工程设计

基线：`e5efc43`，2026-11-17。先记录设计，再分阶段实现，完成状态见 migration-plan.md。

## 目标和边界
同一个 GitHub 仓库、同一个 Cloudflare Pages 域名。教育、旅游、游戏按领域解耦，保留全部正文、题库、规则、旧路径及浏览器记录。没有新账号、付费语音、服务端儿童数据存储或新发布平台。真实 iOS 朗读仍待用户验证。

## 技术决策
Svelte 5、TypeScript、SvelteKit 静态适配器、npm workspaces。UI 采用 shadcn-svelte 源码式组件及 Bits UI 原语；Tailwind 4 只用于受控基础组件，不以全局 reset 破坏遗留图形、打印和排版。精确版本由安装时的稳定 registry 与 peer dependency 验证确定，并锁定 lockfile。

相比 Skeleton，shadcn-svelte 更方便对教育森林、旅游手册、游戏三种视觉做轻量定制；不全量引入组件、不引入不必要的后台、重型图表或 monorepo 编排器。

官方参考：[shadcn-svelte](https://www.shadcn-svelte.com/docs/migration)、[Bits UI](https://www.bits-ui.com/docs/getting-started)、[SvelteKit static](https://svelte.dev/docs/kit/adapter-static)。

## 依赖方向
apps/web → packages/education、travel、games → ui、storage、speech。领域包不互相导入；应用仅负责路由与资源组合。浏览器 API 只能在挂载/事件内使用，不在服务端模块初始化时读取。每个领域按显式子路径导出，避免根 barrel 引入所有内容。

## 性能
静态预渲染首屏文字；路由独立 chunk；题库、景点正文按领域/交互需要加载；图片 viewport lazy；离线导出模块点击后加载。湖南最新图片资源化优化不可回退成 base64。全站不自动安装 service worker，避免旧版本缓存扩大故障。资源有内容哈希时可长缓存，HTML 保持可更新。

## 发布
继续 GitHub Actions 单测、构建、浏览器验证、Wrangler Pages 发布、build.json revision 校验与线上交互测试。先 draft PR，通过准确提交的检查才合并。允许通过上一通过验证的 commit 回滚，不改域名、不迁移浏览器原点。

## 实际锁定版本与兼容取舍
Svelte 5.57.3、SvelteKit 2.70.4、adapter-static 3.0.11、Vite 8.3.8、TypeScript 6.0.3、svelte-check 4.7.8、Tailwind 4.3.5、Bits UI 2.21.0。官方 shadcn-svelte 1.8.1 CLI 的 nova Button 已引入源码并作儿童触控尺寸适配。未选择 Kit 3.2.1，因为 Bits UI 间接依赖 runed 当前声明 Kit 2 peer；未选择 TypeScript 7，因为 svelte-check 当前只声明 TS 5/6。最终依赖树不依赖 --force/--legacy-peer-deps。

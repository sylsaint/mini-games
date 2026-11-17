# 教育领域包

- `LearningHome`：学习地图。
- `SubjectPage`：传入 `subject`（math / chinese / english / science / computing），展示学科内容和设备本地记录。
- `ChineseReport` / `MathReport`：完整分析正文、14 天打卡、诊断作答、打印与 JSON 导出。
- `ChinesePractice` / `GeometryPractice`：文字探险森林与几何探险岛。

所有页面由 Svelte 编译模板渲染，不依赖旧 HTML 文件运行；题库及纯校验函数独立于组件。学科记录只在 onMount 后读取浏览器存储，新增记录不上传，导入先校验和预览，再由用户确认合并。文件超过 1 MB、错误学科和无效记录不会改变已有记录。

## 兼容约定

保留 `yoyo.learning.records.v1.<subject>`、报告 `yoyo-{chinese,math}-report-v1`、练习与奖励和作文的旧 key。不要把默认空状态自动写回存储。所有用户输入由 Svelte 文本渲染，不能作为 HTML 注入。

各路由应直接从 package 子路径引入组件，不把所有报告和练习入口打入首页。学习地图与学科页面 CSS 限制在 `.learning-page` 下；报告采用组件作用域样式。

## 检查

```sh
node --test packages/education/tests/*.test.mjs
```

完整浏览器兼容测试继续沿用仓库 `tests/browser/learning.spec.js` 与 `chinese.spec.js`，最终对构建产物和线上域名分别运行。浏览器测试结果以根发布文档为准，不能仅凭编译成功宣称功能通过。

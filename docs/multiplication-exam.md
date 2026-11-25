# 四上第三单元：整数乘法实验站

- 学习入口：`/learning/math/` → `/learning/math/integer-multiplication/`。
- 题库：`packages/education/src/multiplication/bank.json`，A / B 各 15 道原创新题，分别为 100 分；每题在各小问间均分。题号 ID 应保持稳定，不能对应到新题。
- 判分与本地存储校验：`exam.js`。答题值仅保存在当前浏览器的 `yoyo-math-integer-multiplication-v1`，与数学综合卷、线与角分开。不上传姓名或作答；仅提交后显示分数和解析。
- 互动：队形分块、座位示意、指定题内计算器。计算器不替学生作答，队形结果在交卷前不显示。每个小问包含解法，常见误答附针对性提示。
- 参考 [北师大版四上教材课时目录](https://ai.xsj21.com/textbooks/grade-4-1/)，不冒充官方真题。
- 单测随 `npm run check`；浏览器流程由 CI 和 Cloudflare Pages 发布后的 live E2E 核对。

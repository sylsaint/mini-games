# 设备本地 JSON 存储

`@yoyo/storage` 只封装浏览器 localStorage 的同步 JSON 读写，不是同步服务、迁移服务或通用状态仓库。浏览器入口应在 `onMount` 或用户操作时调用，模块导入不会访问浏览器全局。

```js
import { readLocal, writeLocal } from '@yoyo/storage';
const result = readLocal('existing-key', [], Array.isArray);
if (!result.available) showRecoveryWarning();
const items = result.value;
// Only after a deliberate user edit, never merely because defaults were loaded:
if (!writeLocal('existing-key', items)) showExportWarning();
```

`readLocal(key, fallback, validate?)` 返回 `{value, available, status}`：
- `ok`：JSON 解析及领域校验通过。
- `missing`：没有此 key，返回 fallback，但**不会写入它**。
- `invalid`：JSON 或领域校验失败（包括校验函数抛错），原存储不变。
- `unavailable`：访问 localStorage getter 或 getItem 失败，或在无浏览器环境调用。

`available` 在 ok/missing 为 true，其余为 false。它表示本次读取能否安全使用，不意味着已探测写权限。领域包自行决定是否允许之后用户明确编辑来恢复记录；工具不会覆盖、删除或自动修复损坏数据。

`writeLocal` 返回 boolean，处理权限、配额、循环数据和不能序列化的顶层值；不会将 `undefined` 文本写入存储。只有显式调用才写。标准 JSON 数值/对象语义保持不变。key、版本、schema、题目 ID 过滤与用户提示仍由领域拥有。

测试可通过读函数第 4 参数、写函数第 3 参数传入 `{getItem,setItem}`；正常页面不需传入。测试覆盖无写入副作用、旧 key、损坏数据、getter 拒绝、SSR、配额和非 JSON 值。

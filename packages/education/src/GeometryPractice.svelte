<script>
import Adventure from './chinese-practice/Adventure.svelte';
import {topics,Q,rewards} from './geometry-practice/data.js';
import './geometry-practice/practice.css';
</script>
<div class="geometry-adventure"><Adventure {topics} {Q} {rewards} chinese={false}><div slot="parents" let:reset><details class="panel"><summary>家长小角落：为什么这样练？</summary><p>本练习依据原分析报告的知识主题设计，并非原卷错题逐题复刻。原报告基于照片中可辨认的答案和批改痕迹，不能据此精确推断每道题的失分原因。</p><ul><li><b>原报告的不足：</b>“点开答案”不能检验是否会做；主题诊断缺少独立验证；14 天计划缺少具体反馈依据。这里增加操作、选择理由、重新作答和易错回访，但不把一次闯关等同于长期掌握。</li><li><b>具体 → 图形 → 抽象：</b>移动落脚点、转动小木棒、改变角度，再读数学图，最后用定义或算式解释。请让孩子先预测，再操作验证。</li><li><b>概念要准确：</b>射线 AB 的端点是 A；不同点 A、B 对应的 AB 与 BA 不是同一条射线。垂线段最短只适用于点到直线；两个固定点之间应用“两点间线段最短”。不把“相交”当作“垂直”。</li><li><b>家长观察：</b>让孩子口头讲一次理由。答题正确也可能是猜对，建议隔天不看提示再测，并改变图形方向。页面统计只反映这一次训练，不是能力评级。</li><li><b>每天约 10–15 分钟：</b>一次完成一两座岛即可，保留少量口算。优先理解、表达和迁移，不追求速度。</li></ul><p>练习记录只保存在当前浏览器。换设备、清理浏览器数据或隐私模式可能丢失；没有账号同步。浏览器保存不是防作弊系统，奖励由家长确认兑现，每份预算不超过 20 元。</p><button id="resetButton" onclick={reset}>重新练习（保留已选奖励）</button></details></div></Adventure></div>

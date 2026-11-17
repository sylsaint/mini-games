<script>
import Adventure from './chinese-practice/Adventure.svelte';
import {topics,Q,rewards} from './chinese-practice/data.js';
import './chinese-practice/practice.css';
</script>
<div class="chinese-adventure"><Adventure {topics} {Q} {rewards} chinese={true}><div slot="parents" let:reset><details class="panel"><summary>家长小角落：怎么用才有帮助？</summary><p>练习根据本次语文试卷中可辨认的作答设计，使用原创短文和变式，不是原卷答案复刻。部分批改与题意存在不确定性，不能把所有问题都归为粗心，也不能用一次成绩判断能力。原卷句式例句与“反问”要求存在歧义，本页改用清楚的原创例子区分疑问、设问、反问。</p><ul><li>字词选择不等于独立默写：完成第一站后，请遮住页面在纸上写词，隔天再检查。</li><li>提问有多种合理答案。本页限定“理解原因、找证据”等具体目标；开放提问和作文不自动评判。</li><li>首次无提示答对只反映本轮作答；错后同题回访不是独立掌握。隔天用另一段短文检验迁移。</li><li>每天一两站即可。请让孩子说说证据在哪里、为什么这么选，而不只追求通关。</li></ul><p>进度和表达小本只保存在当前浏览器，清理数据或换设备可能丢失。没有账号同步。奖励由家长确认兑现，每份预算不超过 20 元；页面不会购买或付款，浏览器保存不是防作弊系统。</p><button id="resetButton" onclick={reset}>重新练习（保留已选奖励与表达小本）</button></details></div></Adventure></div>

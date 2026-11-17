<script>let { progress = [], onchoose = () => {} } = $props(); const labels = {timeout:'，本轮超时',correct:'，本轮答对',learned:'，本轮已学习'};</script>
<div class="progress" id="progress" aria-label="本关题目">
{#each progress as question (question.index)}
<button disabled={question.outcome !== null} class="dot" class:active={question.active} class:timedout={question.outcome === 'timeout'} class:solved={question.outcome === 'correct'} class:learned={question.outcome === 'learned'} data-question={question.index} onclick={() => onchoose(question.index)} aria-label={`第 ${question.index + 1} 题${labels[question.outcome] ?? ''}`} aria-current={question.active ? 'step' : undefined}>{question.outcome === 'timeout' ? '⏱' : question.outcome === 'correct' ? '✓' : question.outcome === 'learned' ? '·' : question.index + 1}</button>
{/each}
</div>

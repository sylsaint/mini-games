<script>let { board = null, onchoose = () => {} } = $props(); const operators = [['+','+','加'], ['-','−','减'], ['*','×','乘'], ['/','÷','除']];</script>
<div class="keys operators" id="keys" aria-label="选择运算符">
{#each operators as [operator, label, name]}
<button class="operator" class:selected={board?.selectedOp === operator} data-operator={operator} onclick={() => onchoose(operator)} aria-label={`${name}法`} aria-pressed={board?.selectedOp === operator} disabled={!board || board.disabled || board.tiles.length === 1}><b>{label}</b><small>{name}</small></button>
{/each}
</div>

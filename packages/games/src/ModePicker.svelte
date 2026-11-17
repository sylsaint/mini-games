<script>let { modes = [], onchoose = () => {} } = $props();</script>
<div id="modeChoices" class="mode-choices" aria-label="选择计时模式">
{#each modes as mode (mode.key)}<button class="mode-choice" class:active={mode.active} data-mode={mode.key} onclick={() => onchoose(mode.key)} aria-pressed={mode.active}>{mode.icon} {mode.label} <b>{mode.seconds}秒</b></button>{/each}
</div>

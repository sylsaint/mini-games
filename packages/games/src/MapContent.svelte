<script>let { groups = [], onchoose = () => {} } = $props();</script>
<div class="modalbody" id="mapContent">
{#each groups ?? [] as group, i}<div class="mapgroup">0{i + 1} / {group.name}</div><div class="mapgrid">{#each group.levels as level}<button class="maplevel" class:current={level.current} class:done={level.passed} data-level={level.level} onclick={() => onchoose(level.level)}>{String(level.level + 1).padStart(2,'0')}<small>{level.passed ? '本模式已通关' : `${level.done}/10 已探索`} · {level.stars}★</small></button>{/each}</div>{/each}
</div>

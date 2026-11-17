<script>
  let { board = null, drag = null, element = $bindable(), onchoose = () => {}, ondragstart = () => {} } = $props();
  const format = v => v[1] === 1 ? String(v[0]) : `${v[0]}/${v[1]}`;
</script>
<div class="cards merge-board" class:drag-ready={!!board?.selectedOp && !board?.solved} id="cards" bind:this={element} aria-label="数字合成区">
  {#each [0, 1, 2, 3] as slot (slot)}
    {@const tile = board?.tiles.find(t => t.slot === slot)}
    {#if tile}
      <button class="number-tile" class:selected={board.selectedSlot === slot} class:combined={tile.made} class:merge-pop={slot === board.popSlot} class:victory={board.solved} data-tile={slot} onclick={() => onchoose(slot)} onpointerdown={event => ondragstart(event,slot)} class:drag-source={drag?.from === slot} class:drop-target={drag?.to === slot} aria-label={`${tile.made ? '合成的数字 ' : '数字 '}${format(tile.v)}，第 ${slot + 1} 个位置`} aria-pressed={board.selectedSlot === slot} disabled={board.disabled}>
        <span class="tile-marker">{board.selectedSlot === slot ? '先选的数' : tile.made ? '合成啦' : '✦'}</span>
        {#if tile.v[1] === 1}<span class="tile-number">{tile.v[0]}</span>
        {:else}<span class="tile-fraction"><span>{tile.v[0]}</span><span>{tile.v[1]}</span></span>{/if}
        {#if tile.made}<span class="tile-expression">{tile.expression}</span>{:else}<span class="tile-dots">{Array.from({length:tile.v[0]}, ()=>'•').join(' ')}</span>{/if}
      </button>
    {:else}<div class="tile-empty" aria-hidden="true"><span>✦</span></div>{/if}
  {/each}
</div>

<script>
  import Calculator from './Calculator.svelte';
  let { visual, review = false } = $props();
  const parts = $derived(visual.split(':'));
  const kind = $derived(parts[0]);
  const blocks = $derived([[parts[1],parts[3]], [parts[2],parts[3]], [parts[1],parts[4]], [parts[2],parts[4]]]);
  const positions = ['左上','右上','左下','右下'];
  let selected = $state(-1);
</script>

{#if visual && (kind !== 'calc' || !review)}
  <div class="visual">
    {#if kind === 'vertical'}
      <div class="vertical" role="img" aria-label={`${parts[1]} 乘 ${parts[2]} 的竖式框架`}><div>{parts[1]}</div><div class="rule">× {parts[2]}</div><div>_____</div><div class="rule">_____　</div><div>_____</div></div>
    {:else if kind === 'labels' || kind === 'lines'}
      <div class:labels={kind === 'labels'} class:lines={kind === 'lines'}>
        {#each parts[1].split('|') as label (label)}<span>{label}</span>{/each}
      </div>
    {:else if kind === 'seats'}
      <svg viewBox="0 0 360 280" role="img" aria-label="座位图，共 28 排、每排 36 座，左上角有 4 排各 6 座封闭。">
        <defs><pattern id={review ? 'review-seats' : 'question-seats'} width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" rx="2" fill="white"/>
        </pattern><mask id={review ? 'review-seat-mask' : 'question-seat-mask'}><rect width="360" height="280" fill={review ? 'url(#review-seats)' : 'url(#question-seats)'}/></mask></defs>
        <g mask={review ? 'url(#review-seat-mask)' : 'url(#question-seat-mask)'}><rect width="360" height="280" fill="#729c8a"/><rect width="60" height="40" fill="#a64731"/></g>
      </svg>
      <p class="readout">绿色为可用座位，棕红色为检修区（左上）。</p>
    {:else if kind === 'area'}
      <div class="area">
        {#each blocks as [x,y],i (i)}
          <button type="button" aria-pressed={selected === i} onclick={() => selected = i}>{positions[i]}</button>
        {/each}
      </div>
      <p class="readout" aria-live="polite">
        {#if selected < 0}点一个方块查看它有几列、几排。
        {:else}{blocks[selected][0]} 列 × {blocks[selected][1]} 排{review ? ` ＝ ${Number(blocks[selected][0]) * Number(blocks[selected][1])} 人` : ''}
        {/if}
      </p>
    {:else if kind === 'calc'}
      <Calculator />
    {/if}
  </div>
{/if}

<style>
  .visual{background:#e9f2e7;border:1px solid #d6e3d5;border-radius:16px;padding:13px;margin:12px 0 15px}
  .vertical{font:700 1.2rem/1.4 ui-monospace,monospace;width:max-content;margin:auto;text-align:right}
  .rule{border-bottom:2px solid #557d66}
  .labels{display:flex;flex-wrap:wrap;gap:8px}
  .labels span{border:1px solid #c7d8c9;background:#fffdf6;border-radius:10px;padding:7px 11px;font-weight:740}
  .lines{font-family:ui-monospace,monospace;line-height:1.8;font-size:1rem;display:grid}
  .area{display:grid;grid-template-columns:2fr 1fr;grid-template-rows:66px 54px;width:min(100%,410px);gap:3px;margin:auto}
  .area button{border:1px solid #7b9f88;border-radius:8px;font:inherit;font-weight:800;cursor:pointer;color:#152d27;background-color:#d4e8d2;background-image:radial-gradient(#9ebba4 1px,transparent 1px);background-size:8px 8px}
  .area button:nth-child(2n){background-color:#f6e5b9}
  .area button[aria-pressed=true]{border:2px solid #285843;box-shadow:inset 0 0 0 2px white}
  .area button:focus-visible{outline:3px solid #9e4626;outline-offset:2px}
  .readout{margin:8px 0 0;text-align:center;font-size:.87rem;color:#304b40}
  svg{display:block;width:min(100%,334px);height:auto;margin:auto}
</style>

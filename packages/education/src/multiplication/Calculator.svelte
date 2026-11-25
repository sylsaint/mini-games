<script>
  import Button from '@yoyo/ui/button';
  let left = $state(''), right = $state(''), multiplying = $state(false), result = $state(null);
  const keys = ['7', '8', '9', '×', '4', '5', '6', '退格', '1', '2', '3', '清空', '0', '='];
  const reading = $derived(result !== null ? String(result) : multiplying ? `${left} × ${right}` : left || '0');
  function reset() { left = ''; right = ''; multiplying = false; result = null; }
  function press(key) {
    if (key === '清空') reset();
    else if (key === '×') {
      if (result !== null) { left = String(result); right = ''; result = null; }
      if (left) multiplying = true;
    } else if (key === '=') {
      if (multiplying && right) {
        const product = Number(left) * Number(right);
        result = Number.isSafeInteger(product) ? product : null;
      }
    } else if (key === '退格') {
      if (result !== null) reset();
      else if (multiplying && right) right = right.slice(0,-1);
      else if (multiplying) multiplying = false;
      else left = left.slice(0,-1);
    } else {
      if (result !== null) reset();
      if (multiplying) { if (right.length < 7) right = (right + key).replace(/^0+(?=\d)/, ''); }
      else if (left.length < 7) left = (left + key).replace(/^0+(?=\d)/, '');
    }
  }
</script>

<p class="label">本题专用计算器</p>
<div class="calc">
  <output aria-label="计算器显示" aria-live="polite">{reading}</output>
  {#each keys as key (key)}
    <Button variant={key === '=' ? 'default' : 'outline'} onclick={() => press(key)}>{key}</Button>
  {/each}
</div>
<p class="note">按 ×、再按 =，最后在下方独立填写答案。</p>

<style>
  .label{font-weight:800;letter-spacing:.1em;font-size:.8rem;margin:0}
  .calc{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;max-width:310px;margin-top:10px}
  output{grid-column:1/-1;background:#16372b;color:white;border-radius:9px;text-align:right;padding:8px 12px;font-family:monospace;font-size:1.13rem;min-height:43px;overflow-wrap:anywhere}
  .calc :global(.yoyo-button){padding: .35rem .2rem; font-variant-numeric: tabular-nums;}
  .calc :global(.yoyo-button.outline){background:var(--color-background,#fffdf8);}
  .note{font-size:.85rem;color:#4e665e;margin:8px 0 0}
</style>

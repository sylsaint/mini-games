<script>
  import { clampDegrees, pointOnRay, degreesFromPoint, degreesFromKey } from './protractor-math.js';

  /**
   * Controlled response component. The parent owns answers and scoring.
   * measure: angle is the fixed diagram, value is the child's reading (empty string means unanswered).
   * draw: value is the ray direction; angle is deliberately ignored.
   */
  let { mode = 'measure', base = 'right', startAngle = 0, angle = 60, value = null, onchange = () => {}, disabled = false } = $props();
  const uid = $props.id();
  const origin = { x: 220, y: 208 };
  const ticks = Array.from({ length: 37 }, (_, index) => index * 5);
  const labels = Array.from({ length: 19 }, (_, index) => index * 10);
  let svg;
  let dragging = $state(null);
  let current = $derived(value === null || value === undefined || value === '' ? null : clampDegrees(value));
  let drawing = $derived(mode === 'draw');
  let startingAngle = $derived(drawing ? (base === 'left' ? 180 : 0) : base === 'left' && Number(startAngle) === 0 ? 180 : clampDegrees(startAngle));
  let shownAngle = $derived(drawing ? (base === 'left' ? 180 - (current ?? 0) : current ?? 0) : clampDegrees(angle));
  let baselineEnd = $derived(pointOnRay(startingAngle, 200));
  let arcStart = $derived(pointOnRay(startingAngle, 45));
  let endpoint = $derived(pointOnRay(shownAngle, 176));
  let arcEnd = $derived(pointOnRay(shownAngle, 45));
  let arc = $derived(`M ${arcStart.x} ${arcStart.y} A 45 45 0 0 ${shownAngle >= startingAngle ? 0 : 1} ${arcEnd.x} ${arcEnd.y}`);

  function choose(next) {
    if (!disabled && next !== null) onchange(clampDegrees(next));
  }

  function locate(event) {
    const matrix = svg?.getScreenCTM();
    if (!matrix) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    const absolute = degreesFromPoint(local.x, local.y);
    choose(absolute === null ? null : base === 'left' ? 180 - absolute : absolute);
  }

  function pointerDown(event) {
    if (!drawing || disabled || event.isPrimary === false || (event.button !== undefined && event.button !== 0)) return;
    event.preventDefault();
    dragging = event.pointerId;
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    locate(event);
  }

  function pointerMove(event) {
    if (event.pointerId !== dragging || !drawing || disabled) return;
    event.preventDefault();
    locate(event);
  }

  function pointerEnd(event) {
    if (event.pointerId !== dragging) return;
    if (event.type === 'pointerup' && drawing && !disabled) locate(event);
    dragging = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function keyDown(event) {
    if (!drawing || disabled) return;
    const next = degreesFromKey(event.key, current ?? 0, event.shiftKey);
    if (next !== null) {
      event.preventDefault();
      choose(next);
    }
  }

  function numberInput(event) {
    // Let children erase and replace a number without inserting a forced zero.
    if (event.currentTarget.value === '') {
      if (!disabled) onchange('');
      return;
    }
    const next = event.currentTarget.valueAsNumber;
    if (Number.isFinite(next)) choose(next);
  }
</script>

<section class="protractor" class:locked={disabled} data-protractor-mode={mode} aria-label={drawing ? '画角工具' : '量角工具'}>
  <p class="instruction" id={`${uid}-help`}>
    {#if drawing}
      拖动绿色射线，把角画出来。也可以用下面的控件调整。
    {:else}
      {#if startingAngle !== 0 && startingAngle !== 180}
        始边没有对准 0°。分别读出两条射线所在的刻度，再想一想怎样求它们的夹角。
      {:else}
        找到顶点 O，从{startingAngle === 180 ? '左' : '右'}边始边的 0° 开始读刻度，再填写你的读数。
      {/if}
    {/if}
  </p>
  {#snippet diagramSvg()}
    <svg bind:this={svg} viewBox="0 0 440 270" role="img" aria-labelledby={`${uid}-title`}>
      <title id={`${uid}-title`}>{drawing ? '半圆量角器上的可调整射线' : '半圆量角器上的待测角'}</title>
      <defs>
        <marker id={`${uid}-baseline-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill="#bd7638" /></marker>
        <marker id={`${uid}-ray-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill="#246954" /></marker>
      </defs>
      <path d="M 32 208 A 188 188 0 0 1 408 208 Z" fill="#fffdf4" stroke="#9aac92" stroke-width="1.5" />
      <path d="M 93 208 A 127 127 0 0 1 347 208" fill="none" stroke="#dce7d3" stroke-width="1" />
      {#each ticks as degree}
        {@const outside = pointOnRay(degree, 188)}
        {@const inside = pointOnRay(degree, degree % 10 === 0 ? 173 : 180)}
        <line x1={outside.x} y1={outside.y} x2={inside.x} y2={inside.y} stroke={degree % 10 === 0 ? '#526f5d' : '#9aae94'} stroke-width={degree % 10 === 0 ? 1.6 : 1} />
      {/each}
      {#each labels as degree}
        {@const inner = pointOnRay(degree, 136)}
        {@const outer = pointOnRay(degree, 160)}
        <text x={inner.x} y={inner.y} class="scale inner-scale" dominant-baseline="middle" text-anchor="middle">{degree}</text>
        <text x={outer.x} y={outer.y} class="scale outer-scale" dominant-baseline="middle" text-anchor="middle">{180 - degree}</text>
      {/each}
      <path d={arc} fill="none" stroke="#91b681" stroke-width="2.5" />
      <line x1="220" y1="208" x2={baselineEnd.x} y2={baselineEnd.y} stroke="#bd7638" stroke-width="3" marker-end={`url(#${uid}-baseline-arrow)`} />
      <line x1="220" y1="208" x2={endpoint.x} y2={endpoint.y} stroke="#246954" stroke-width="3.5" marker-end={`url(#${uid}-ray-arrow)`} />
      {#if drawing}
        <circle cx={endpoint.x} cy={endpoint.y} r="17" fill="#246954" fill-opacity="0.12" />
        <circle cx={endpoint.x} cy={endpoint.y} r="7" fill="#fffdf4" stroke="#246954" stroke-width="3" />
      {/if}
      <circle cx="220" cy="208" r="4" fill="#203e34" />
      <text x="220" y="230" class="vertex" text-anchor="middle">O</text>
      <text x="220" y="251" class="baseline-label" text-anchor="middle">{startingAngle === 180 ? "橙色为左向始边" : startingAngle === 0 ? "橙色为右向始边" : "橙色射线是始边"}</text>
    </svg>
  {/snippet}
  {#if drawing}
  <div
    class="diagram"
    class:drawable={drawing && !disabled}
    class:dragging={dragging !== null}
    role="slider"
    tabindex={disabled ? -1 : 0}
    aria-label="调整所画角的角度"
    aria-describedby={`${uid}-help ${uid}-keys`}
    aria-valuemin="0"
    aria-valuemax="180"
    aria-valuenow={current ?? 0}
    aria-valuetext={`${current ?? 0} 度`}
    aria-orientation="horizontal"
    aria-disabled={disabled}
    onpointerdown={pointerDown}
    onpointermove={pointerMove}
    onpointerup={pointerEnd}
    onpointercancel={pointerEnd}
    onlostpointercapture={() => { dragging = null; }}
    onkeydown={keyDown}
  >
    {@render diagramSvg()}
  </div>
  {:else}
    <div class="diagram" role="group" aria-label="待测角与双圈量角器" aria-describedby={`${uid}-help`}>{@render diagramSvg()}</div>
  {/if}
  <div class="reading-key" aria-hidden="true"><span class="inner-dot"></span>内圈从右边 0° 读起 <span class="outer-dot"></span>外圈从左边 0° 读起</div>
  <div class="controls">
    <label for={`${uid}-number`}>{drawing ? '我画的角' : '我的读数'}</label>
    <div class="number-controls">
      <button type="button" onclick={() => choose((current ?? 0) - 1)} disabled={disabled || current === null || current <= 0} aria-label="减少 1 度">−</button>
      <input id={`${uid}-number`} class="degree-input" type="number" min="0" max="180" step="1" inputmode="numeric" value={current ?? ''} placeholder="填入度数" oninput={numberInput} {disabled} aria-describedby={`${uid}-range`} />
      <span class="unit">度（°）</span>
      <button type="button" onclick={() => choose((current ?? 0) + 1)} disabled={disabled || (current !== null && current >= 180)} aria-label="增加 1 度">+</button>
    </div>
    {#if drawing}
      <label class="range-label" for={`${uid}-slider`}>滑动调整角度</label>
      <input id={`${uid}-slider`} class="angle-range" type="range" min="0" max="180" step="1" value={current ?? 0} oninput={event => choose(event.currentTarget.valueAsNumber)} {disabled} aria-label="滑动调整角度" />
      <div class="range-ends" aria-hidden="true"><span>0°</span><span>90°</span><span>180°</span></div>
    {/if}
    <small id={`${uid}-range`}>可以填写 0° 到 180°，这里不会判断对错。</small>
  </div>
  <p class="keyboard-help" id={`${uid}-keys`}>
    {#if drawing}键盘也能画：方向键每次 1°，按住 Shift 每次 10°；Home 回到 0°，End 到 180°。
    {:else}在输入框填写读数，也可以用加减按钮每次调整 1°。{/if}
  </p>
</section>

<style>
  .protractor { --green:#246954; background:#f7f9ef; border:1px solid #d8e4cd; border-radius:20px; padding:16px; color:#294438; width:100%; box-sizing:border-box; font-family:inherit; }
  .instruction { margin:0 0 10px; font-size:15px; line-height:1.7; }
  .diagram { width:100%; max-width:620px; margin-inline:auto; border-radius:14px; }
  .diagram.drawable { touch-action:none; cursor:crosshair; user-select:none; -webkit-user-select:none; }
  .diagram.dragging { cursor:grabbing; }
  .diagram:focus-visible { outline:3px solid #d59544; outline-offset:3px; }
  svg { display:block; width:100%; height:auto; overflow:visible; }
  .scale { font:600 12px system-ui,sans-serif; pointer-events:none; }
  .inner-scale { fill:#246954; }
  .outer-scale { fill:#7a795f; }
  .vertex { font:bold 15px system-ui,sans-serif; fill:#203e34; }
  .baseline-label { font:12px system-ui,sans-serif; fill:#965b28; }
  .reading-key { display:flex; justify-content:center; align-items:center; flex-wrap:wrap; gap:5px; font-size:12px; line-height:1.7; margin:-2px 0 12px; color:#526650; }
  .inner-dot,.outer-dot { width:7px; height:7px; border-radius:50%; display:inline-block; background:#246954; }
  .outer-dot { background:#7a795f; margin-left:8px; }
  .controls { display:grid; gap:8px; max-width:420px; margin-inline:auto; }
  .controls label { font-size:15px; font-weight:700; }
  .number-controls { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  button { width:44px; height:44px; border-radius:12px; border:1px solid #b4c9a5; background:#e8f0dd; color:#245e4b; font:700 22px system-ui,sans-serif; cursor:pointer; touch-action:manipulation; }
  button:disabled { opacity:.45; cursor:default; }
  .degree-input { box-sizing:border-box; width:116px; min-width:0; height:44px; border:1px solid #b4c9a5; border-radius:10px; background:#fffef9; color:#203e34; padding:8px 10px; font:600 17px system-ui,sans-serif; }
  .degree-input::placeholder { font-size:13px; font-weight:400; }
  .unit { font-size:14px; }
  .angle-range { width:100%; height:32px; margin:0; accent-color:var(--green); touch-action:none; }
  .range-label { margin-top:5px; }
  .range-ends { display:flex; justify-content:space-between; color:#6a785e; font-size:12px; margin-top:-8px; }
  .controls small,.keyboard-help { color:#61735d; font-size:12px; line-height:1.7; }
  .keyboard-help { margin:10px 0 0; }
  button:focus-visible,input:focus-visible { outline:3px solid #d59544; outline-offset:2px; }
  .locked .diagram { cursor:default; }
  @media(max-width:380px) { .protractor{padding:10px}.number-controls{gap:6px}.degree-input{width:100px}.reading-key{font-size:11px} }
  @media print { .controls,.keyboard-help{display:none}.protractor{break-inside:avoid;background:white} }
</style>

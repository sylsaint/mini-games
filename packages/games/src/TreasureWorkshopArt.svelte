<script>
  /** @type {{examined?:number[], selected?:number|null, tool?:'light'|'hem'|'seal', beam?:{x:number,y:number}|null}} */
  let { examined = [], selected = null, tool = 'light', beam = null } = $props()
  const uid = $props.id()
  const ref = (/** @type {string} */ key) => 'url(#' + uid + '-' + key + ')'
  const points = [
    { x: 160, y: 285, angle: -9, cloth: '#9e593e', stripe: '#d8af70' },
    { x: 344, y: 215, angle: 8, cloth: '#9d9871', stripe: '#dbbf91' },
    { x: 520, y: 285, angle: -8, cloth: '#638780', stripe: '#bea377' },
    { x: 664, y: 210, angle: 13, cloth: '#b18e65', stripe: '#eee0a7' },
  ]
  let chosen = $derived(selected === null ? null : points[selected])
</script>

<svg class="workshop" viewBox="0 0 800 500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id={uid + '-wall'} x2="0" y2="1">
      <stop stop-color="#192e2b" />
      <stop offset=".74" stop-color="#39473a" />
      <stop offset="1" stop-color="#272c21" />
    </linearGradient>
    <linearGradient id={uid + '-wood'} x2=".15" y2="1">
      <stop stop-color="#a2754d" />
      <stop offset=".52" stop-color="#805639" />
      <stop offset="1" stop-color="#4c3629" />
    </linearGradient>
    <linearGradient id={uid + '-lacquer'} x2="0" y2="1">
      <stop stop-color="#66352b" />
      <stop offset="1" stop-color="#351f1d" />
    </linearGradient>
    <linearGradient id={uid + '-paper'} x2=".7" y2="1">
      <stop stop-color="#fde4ae" />
      <stop offset=".65" stop-color="#bd8c5b" />
      <stop offset="1" stop-color="#875d3c" />
    </linearGradient>
    <radialGradient id={uid + '-lamp'}>
      <stop stop-color="#ffe4a1" stop-opacity=".75" />
      <stop offset=".48" stop-color="#eeb773" stop-opacity=".25" />
      <stop offset="1" stop-color="#eeb773" stop-opacity="0" />
    </radialGradient>
    <radialGradient id={uid + '-vignette'} r=".66">
      <stop offset=".52" stop-color="#071311" stop-opacity="0" />
      <stop offset="1" stop-color="#071311" stop-opacity=".66" />
    </radialGradient>
    <pattern id={uid + '-grain'} patternUnits="userSpaceOnUse" width="165" height="34">
      <path d="M0 6q41-3 82 0t83 0M0 19q35 2 53-2t41 0 71 0M17 25q27-3 51 0m27 5q31 1 55-3M0 10h24m94 3 47-3" fill="none" stroke="#2d231d" stroke-opacity=".18" stroke-width="1.4" />
      <path d="M0 28q37-5 68 0t97-1m-40-20 22-2M32 3h41" fill="none" stroke="#edb076" stroke-opacity=".17" />
    </pattern>
    <pattern id={uid + '-weave'} patternUnits="userSpaceOnUse" width="6" height="6">
      <path d="M0 0h6M0 0v6" fill="none" stroke="#493026" stroke-opacity=".32" stroke-width="1" />
      <path d="M3 0v6m-3-3h6" fill="none" stroke="#f8d698" stroke-opacity=".15" />
    </pattern>
    <pattern id={uid + '-dust'} width="92" height="64" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="5" r="1" fill="#ebbe88" /><circle cx="58" cy="43" r="1.2" fill="#e3ad73" />
      <circle cx="33" cy="28" r=".8" fill="#dab176" /><circle cx="79" cy="21" r=".6" fill="#e3ad73" />
      <path d="m14 53 4-1m31 10 3 1m14-36 5-1m9 27 3 2" fill="none" stroke="#d4b67f" stroke-width="1" />
    </pattern>
  </defs>

  <path d="M0 0h800v500H0z" fill={ref('wall')} />
  <path d="M0 122 800 105v63H0Z" fill="#172c27" opacity=".33" />
  <path d="M0 115 800 102M0 146l800-4M0 57l800-7" stroke="#a2a68d" opacity=".16" fill="none" />
  <path d="M40 0h14v185H36zM746 0h12v192h-14z" fill="#778070" opacity=".35" />

  <!-- Loom. Threads hang individually; the work-in-progress pattern is decorative, not a clue. -->
  <g transform="translate(64 23)">
    <path d="M9 112V5m124 113V-1M0 17l144-11M0 97l148-10" stroke="#0c201b" stroke-width="15" stroke-linecap="round" />
    <path d="M9 112V5m124 113V-1M0 17l144-11M0 97l148-10" stroke="#715642" stroke-width="8" stroke-linecap="round" />
    <path d="M26 17v76m11-76v76m11-77v75m11-75v75m11-76v76m11-77v76m11-77v77m11-77v76m11-77v76m11-77v76" stroke="#c6a87a" stroke-width="1" opacity=".74" />
    <path d="m24 54 99-7 4 37-101 7z" fill="#975341" stroke="#ab795d" stroke-width="2" />
    <path d="m24 54 99-7 4 37-101 7z" fill={ref('weave')} />
    <path d="m30 63 12 3 13-5 14 3 12-5 13 3 12-5 12 2m-85 19 11 3 12-5 15 3 12-5 13 3 12-5 12 2" stroke="#d3a365" stroke-width="1.6" fill="none" opacity=".76" />
    <path d="M15 69 141 58" stroke="#9a6f57" stroke-width="4" />
  </g>

  <!-- Overhead lamp and the far wall with tucked-away archivist papers. -->
  <path d="M398 0v30" stroke="#13231d" stroke-width="7" />
  <path d="M353 62q12-21 34-28h24q23 9 36 28z" fill="#1c2a22" stroke="#111e18" stroke-width="4" />
  <path d="M355 62h89" stroke="#deaf72" stroke-width="4" />
  <path d="M361 67h79l117 111H227z" fill="#ebbd79" opacity=".065" />
  <ellipse cx="400" cy="146" rx="183" ry="117" fill={ref('lamp')} opacity=".42" />

  <g transform="translate(578 25) rotate(5)">
    <path d="M0 4h146v81H0z" fill="#172a22" stroke="#23322a" stroke-width="3" />
    <path d="M10 11h124v66H10z" fill="#615844" />
    <path d="M19 18h48v49H19zm55 4h45v41H74z" fill="#b49c6d" />
    <path d="M25 28h30m-30 7h33m-33 7h25m-25 11h26m31-18h29m-29 6h19m-19 7h13" stroke="#6d583e" stroke-width="1.5" opacity=".72" />
    <path d="M102 54h12v6h-12z" fill="#924237" />
    <path d="M35 15h19v4H35zm49 4h20v4H84z" fill="#73644e" />
    <path d="M3 72h141v16H3z" fill="#362f24" />
  </g>

  <!-- Deep lacquer chest front and long workbench with inset tools. -->
  <path d="M27 355 771 342l17 139-771 8z" fill="#091713" opacity=".72" />
  <path d="M52 171 721 164l78 188-782 11z" fill={ref('wood')} stroke="#382a24" stroke-width="3" />
  <path d="M52 171 721 164l78 188-782 11z" fill={ref('grain')} />
  <path d="m47 198 689-8m-701 52 723-8m-737 65 762-11m-764 60 776-12" fill="none" stroke="#d5a877" stroke-opacity=".24" stroke-width="3" />
  <path d="M18 359 797 350 789 457 22 467Z" fill={ref('lacquer')} stroke="#291f1b" stroke-width="3" />
  <path d="m19 359 777-8-2 19-773 11z" fill="#896549" stroke="#38281f" stroke-width="3" />
  <path d="m39 388 724-11-1 65-726 8z" fill="none" stroke="#b55340" stroke-width="2" />
  <path d="m50 397 704-10v46l-704 7z" fill="none" stroke="#c2a268" stroke-opacity=".46" />
  <path d="m66 416 25-12 24 10-25 13zM672 407l25-12 24 10-25 13z" fill="none" stroke="#aa7f59" stroke-width="1.4" opacity=".75" />
  <path d="m394 407 21-2 9 9-9 11-20 1-9-9z" fill="#ad895c" stroke="#423025" stroke-width="2" />
  <path d="M402 413h7v8h-7z" fill="#3c2d24" />

  <!-- Open scholar's paper at left, brush, inspection glass, twine and an unlabeled tag. -->
  <g transform="translate(67 188) rotate(-11)">
    <path d="M-21 37q28-3 38 3l26 8-4 23-62-6z" fill="#523a2c" opacity=".44" />
    <path d="M-22 31q30-4 47 4l18 6-5 26-61-6z" fill={ref('paper')} stroke="#77523a" stroke-width="1.6" />
    <path d="M-16 40q17-2 35 3m-35 3 25 2m-26 5 27 2m12-9 14 4m-15 4 11 4" fill="none" stroke="#75543b" opacity=".62" />
  </g>
  <g transform="translate(300 322) rotate(-7)">
    <ellipse cx="0" cy="4" rx="36" ry="11" fill="#34291e" opacity=".34" />
    <circle cx="-10" cy="-6" r="18" fill="#826f50" fill-opacity=".65" stroke="#d1a881" stroke-width="3" />
    <path d="M3 6l42 18" stroke="#5f3c29" stroke-width="6" stroke-linecap="round" />
    <path d="M-21-9q5-10 16-8" stroke="#efe4aa" stroke-width="1.4" opacity=".62" fill="none" />
  </g>
  <path d="m733 270 29 21-4 6-30-18z" fill="#d3ad7f" stroke="#563929" stroke-width="1.4" />
  <path d="m752 288 12 8 15 19-19-10-8-11z" fill="#a07850" />
  <ellipse cx="418" cy="320" rx="21" ry="7" fill="none" stroke="#c8a474" stroke-width="2" transform="rotate(13 418 320)" />
  <ellipse cx="422" cy="321" rx="17" ry="7" fill="none" stroke="#c8a474" stroke-width="1.5" transform="rotate(16 422 321)" />
  <path d="M32 168h735v179H32Z" fill={ref('dust')} opacity=".33" />

  {#if beam}
    <ellipse cx={beam.x * 800} cy={beam.y * 500} rx="155" ry="113" fill={ref('lamp')} />
  {:else if chosen && tool === 'light'}
    <ellipse cx={chosen.x} cy={chosen.y} rx="142" ry="98" fill={ref('lamp')} />
  {/if}

  {#each points as point, index (index)}
    {@const focused = selected === index}
    {@const moved = examined.includes(index)}
    <g transform={'translate(' + point.x + ' ' + point.y + ') rotate(' + point.angle + ')'}>
      <ellipse cy="20" rx="73" ry="28" fill="#241c17" opacity=".48" />
      <path d="M-61-12q17-13 39-16l59 4 24 19 3 31-25 12-81-2-25-14z" fill="#5a3c2e" stroke="#493126" stroke-width="2" />
      <path d="M-59-16q14-12 37-15l58 4 22 19 4 29-25 11-76-3-26-12z" fill={point.cloth} stroke="#53382b" stroke-width="2" />
      <path d="M-59-16q14-12 37-15l58 4 22 19 4 29-25 11-76-3-26-12z" fill={ref('weave')} />
      <path d="M-59-16q25 1 45 17L-39 29m3-58L5-6 38-25m20 17L25 7l36 14M-5 31l11-17 31 18" fill="none" stroke="#f3d399" stroke-opacity=".39" stroke-width="2.2" />
      <path d="M-41 10q26-9 43-18m-55 21 12-19m61 30 23-10" fill="none" stroke="#4c3328" stroke-opacity=".46" stroke-width="1.6" />
      {#if !moved}
        <path d="M-7-29q0 19 15 35l11 25M-62 6q32 7 60 0l64-7" fill="none" stroke={point.stripe} stroke-width="3.5" />
        <path d="M10 5q6-16-10-15-7 4 10 15 15-11 20-6 7 9-19 7l7 15m-8-15-9 15" fill="none" stroke={point.stripe} stroke-width="3" stroke-linecap="round" />
      {:else}
        <path d="M4-31 37-24l15 20-14 8L15-6z" fill={point.stripe} stroke="#78543d" stroke-width="1.5" />
        <path d="M6-30 37-24l15 20-14 8L15-6z" fill={ref('weave')} />
        <path d="M-47 25q20 7 28-3 12-9 24-3m29 9 9-9" fill="none" stroke={point.stripe} opacity=".6" stroke-width="2" />
      {/if}
      <path d="M38 17 53 14l18 14-18 9-14-9z" fill={ref('paper')} stroke="#7b4b34" stroke-width="1.5" />
      <circle cx="45" cy="22" r="2" fill="#563829" />
      <path d="m53 24 8 5-8 4-5-4z" fill="none" stroke="#a24537" stroke-width="1.3" />
      {#if focused}
        <path d="M-73-19v-13h16m113 0h15v13m0 42v13H56m-113 0h-16V23" fill="none" stroke="#f5cd87" stroke-width="3.5" stroke-linecap="round" />
      {/if}
    </g>
  {/each}

  <path d="M0 0h800v500H0z" fill={ref('vignette')} pointer-events="none" />
</svg>

<style>
  .workshop {
    display: block;
    width: 100%;
    height: auto;
    pointer-events: none;
    user-select: none;
  }
</style>

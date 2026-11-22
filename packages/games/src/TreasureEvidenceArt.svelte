<script>
  /** @type {{sample?:{transmits:boolean,straight:boolean,seal:boolean},mode?:'cloth'|'hem'|'seal',strength?:number}} */
  let {
    sample = { transmits: false, straight: false, seal: false },
    mode = 'cloth',
    strength = 0,
  } = $props()
  const uid = $props.id()
  const ref = (/** @type {string} */ key) => 'url(#' + uid + '-' + key + ')'
  const layers = [
    { x: 115, opacity: 0.18 },
    { x: 127, opacity: 0.32 },
    { x: 143, opacity: 0.39 },
    { x: 154, opacity: 0.2 },
  ]
  let progress = $derived(Math.max(0, Math.min(1, strength / 100)))
  let reveal = $derived(Math.max(0, (progress - 0.49) / 0.51))
  let clothShape = 'M105 52q22-13 55-13l214 2 70 16 10 121-89 13-170-5-81-12z'
  let hemShape = $derived(
    sample.straight
      ? 'M89 37 446 40l-2 126-356 3z'
      : 'M92 38 446 40v82q-60 3-112 29-90 46-162 31-46-5-84-42z',
  )
  let hemEdge = $derived(sample.straight ? 'M86 166 444 165' : 'M91 143q41 37 80 40 73 17 163-30 55-29 109-30')
</script>

<svg class="evidence" viewBox="0 0 560 225" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id={uid + '-surface'} x2=".6" y2="1">
      <stop stop-color="#483b31" /><stop offset=".59" stop-color="#292e28" /><stop offset="1" stop-color="#1a2926" />
    </linearGradient>
    <linearGradient id={uid + '-cloth'} x2=".95" y2="1">
      <stop stop-color="#bd996e" /><stop offset=".61" stop-color="#ae835b" /><stop offset="1" stop-color="#6f533a" />
    </linearGradient>
    <linearGradient id={uid + '-paper'} x2=".5" y2="1">
      <stop stop-color="#f3d9a1" /><stop offset="1" stop-color="#c09666" />
    </linearGradient>
    <radialGradient id={uid + '-beam'}>
      <stop stop-color="#ffeda6" stop-opacity=".8" />
      <stop offset=".4" stop-color="#eed49b" stop-opacity=".39" />
      <stop offset="1" stop-color="#d5ac68" stop-opacity="0" />
    </radialGradient>
    <pattern id={uid + '-fabric'} width="7" height="7" patternUnits="userSpaceOnUse">
      <path d="M0 0v7m3.5-7v7M0 0h7m-7 3.5h7" fill="none" stroke="#503727" stroke-width=".65" stroke-opacity=".45" />
      <path d="M1.4 0v7M0 1.4h7" fill="none" stroke="#f7d6a3" stroke-width=".65" stroke-opacity=".7" />
    </pattern>
    <pattern id={uid + '-rules'} width="26" height="26" patternUnits="userSpaceOnUse">
      <path d="M0 0h26M0 0v26" fill="none" stroke="#dfc08a" stroke-opacity=".14" />
    </pattern>
    <pattern id={uid + '-flecks'} width="41" height="25" patternUnits="userSpaceOnUse">
      <path d="m2 6 3 .5m19 3h4m10 7 2 2m-22 3h5" stroke="#52372a" stroke-width="1" opacity=".42" />
      <circle cx="16" cy="8" fill="#efc384" r="1" opacity=".56" />
    </pattern>
    <clipPath id={uid + '-swatch'}><path d={clothShape} /></clipPath>
    <clipPath id={uid + '-hem-reveal'}><rect x="74" y="25" width={390 * reveal} height="169" /></clipPath>
  </defs>

  <path d="M0 0h560v225H0z" fill={ref('surface')} />
  <path d="M16 15h528v195H16z" fill={ref('rules')} stroke="#af8a61" stroke-opacity=".43" />
  <path d="M16 36V15h20m488 0h20v21m0 154v20h-20m-488 0H16v-20" fill="none" stroke="#d7a76c" stroke-width="2.5" />

  {#if mode === 'cloth'}
    <!-- The same backing and light are used for both samples; only transmission changes. -->
    <path d="M83 56q25-16 63-13l239-2 87 21-11 126-85 12-288-19z" fill="#0c1717" opacity=".64" />
    <ellipse cx={131 + 149 * progress} cy="112" rx={100 + 106 * progress} ry="105" fill={ref('beam')} opacity={0.17 + .58 * progress} />
    <path d={clothShape} fill={ref('cloth')} stroke="#d5a76b" stroke-width="2" />
    <path d={clothShape} fill={ref('fabric')} />
    <g clip-path={'url(#' + uid + '-swatch)'}>
      <ellipse cx={131 + 146 * progress} cy="111" rx="166" ry="100" fill={ref('beam')} opacity={.12 + (sample.transmits ? .53 : .12) * reveal} />
      <path d="M145 76q41 17 57 4t56-10m67-14q43-4 79 17m-209 89q69 6 91-15m34 14 57-7" fill="none" stroke="#704e35" stroke-width="2" opacity=".5" />
      {#if sample.transmits}
        <g opacity={reveal * .94}>
          <path d="m180 116 25-20 25 20-25 20zm67 0 28-23 28 23-28 23zm73 0 25-20 25 20-25 20z" fill="#6b382b" stroke="#56362a" stroke-width="2" />
          <path d="m190 116 15-12 15 12-15 11zm67 0 18-15 18 15-18 15zm73 0 15-12 15 12-15 11z" fill="none" stroke="#d7b37e" stroke-width="2" opacity=".78" />
        </g>
      {/if}
    </g>
    {#each layers as layer (layer.x)}
      <path d={'M' + layer.x + ' 49q14 63 7 124'} fill="none" stroke="#efce95" opacity={layer.opacity} stroke-width="1.3" />
    {/each}
    <path d="m69 76 12 9-6 70-12 8zm425 8-10 8-2 57 10 8z" fill="#b38759" stroke="#3d3028" stroke-width="2" />
    <path d="M55 114h42m367 0h41" stroke="#e8b87a" stroke-opacity=".55" stroke-dasharray="4 4" />
  {:else if mode === 'hem'}
    <path d="M67 31h426v165H67z" fill="#b99160" fill-opacity=".32" stroke="#d2ad77" stroke-opacity=".45" />
    <ellipse cx="277" cy="104" rx="209" ry="110" fill={ref('beam')} opacity=".37" />
    <path d="M86 186h359" stroke="#efd6a4" stroke-width="1.4" stroke-dasharray="4 6" opacity={.24 + .46 * reveal} />
    <path d="M90 38h354v58l-356 14z" fill={ref('cloth')} stroke="#76553d" stroke-width="2" />
    <path d="M90 38h354v58l-356 14z" fill={ref('fabric')} />
    <path d="M90 110l353-14" fill="none" stroke="#c39868" stroke-width="1" />
    <g clip-path={'url(#' + uid + '-hem-reveal)'}>
      <!-- The ruler is stable; no marks tell the player which edge to choose. -->
      <path d={hemShape} fill={ref('cloth')} stroke="#674b36" stroke-width="3" />
      <path d={hemShape} fill={ref('fabric')} />
      <path d="M87 40q43 25 90 11 85-11 177 0l92-9m-301 18q12 23 12 83m42-86 8 76m62-70 9 56m83-59-7 44" fill="none" stroke="#f2cb92" opacity=".44" stroke-width="2" />
      <path d={hemEdge} fill="none" stroke="#562f23" stroke-width="7" />
      <path d={hemEdge} fill="none" stroke="#e8bd7d" stroke-width="1.5" stroke-dasharray="3 3" />
    </g>
    <path d="M86 199h359m-347 0v-8m23 8v-4m23 4v-8m23 8v-4m23 4v-8m23 8v-4m23 4v-8m23 8v-4m23 4v-8m23 8v-4m23 4v-8m23 8v-4m23 4v-8m23 8v-4m23 4v-8m23 8v-4" fill="none" stroke="#ddbb8b" stroke-width="1.6" opacity=".66" />
  {:else}
    <path d="M150 41 377 32l45 16-13 145-36 7-228-10-17-16 8-123z" fill="#101d16" opacity=".66" />
    <path d="M147 38 377 30l44 15-16 142-31 9-229-10-17-16 8-122z" fill={ref('paper')} stroke="#b88955" stroke-width="2.4" />
    <path d="M147 38 377 30l44 15-16 142-31 9-229-10-17-16 8-122z" fill={ref('flecks')} />
    <path d="m148 51 248-7-9 127-231 3z" fill="none" stroke="#7e6349" stroke-width="1.2" opacity=".48" />
    <path d="M157 63h30m-28 10h41m-41 10h26m180 70h15m-24 8h24m-14 8h11" stroke="#735942" stroke-width="1.4" opacity=".43" fill="none" />
    <path d="m216 74 119-3 4 81-119 4z" stroke="#824433" stroke-width="2" fill="#a74837" fill-opacity=".07" opacity={.14 + .6 * reveal} />
    <g opacity={reveal} transform={'rotate(' + Math.round(-57 * (1 - progress)) + ' 276 110)'}>
      <!-- Open curve and 3 marks match the reference; a closed curve with 2 marks is a plausible neighboring tag. -->
      {#if sample.seal}
        <path d="M242 110q8-25 35-24t35 24M235 115l7-6 5 9m61 0 5-8 7 7" stroke="#8b3527" stroke-width="4" stroke-linecap="round" fill="none" />
        <circle cx="254" cy="133" r="5.4" fill="#8b3527" />
        <circle cx="276" cy="133" r="5.4" fill="#8b3527" />
        <circle cx="299" cy="133" r="5.4" fill="#8b3527" />
      {:else}
        <ellipse cx="276" cy="102" rx="30" ry="15" stroke="#8b3527" stroke-width="4" fill="none" />
        <circle cx="264" cy="133" r="5.4" fill="#8b3527" />
        <circle cx="289" cy="133" r="5.4" fill="#8b3527" />
      {/if}
    </g>
    <path d="m87 57 11 19m8-22 6 19m338-10-7 22m22-14-12 18" stroke="#b28a62" stroke-width="1.2" opacity=".56" fill="none" />
  {/if}
</svg>

<style>
  .evidence {
    display: block;
    width: 100%;
    height: auto;
    user-select: none;
    pointer-events: none;
  }
</style>

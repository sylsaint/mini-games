<script>
  /** @type {{target?: number, illuminated?: number[], excavated?: number[], beam?: {x:number,y:number} | null}} */
  let { target = 1, illuminated = [], excavated = [], beam = null } = $props();
  const uid = $props.id();
  const ref = (/** @type {string} */ name) => `url(#${uid}-${name})`;
  const sites = [
    { x: 176, y: 317, angle: -11 },
    { x: 400, y: 245, angle: 5 },
    { x: 624, y: 317, angle: 10 },
  ];
</script>

<svg class="field-art" viewBox="0 0 800 480" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id={uid + '-room'} x2="0" y2="1">
      <stop stop-color="#1b2925" />
      <stop offset=".57" stop-color="#2f3e33" />
      <stop offset="1" stop-color="#15231f" />
    </linearGradient>
    <radialGradient id={uid + '-ground'}>
      <stop stop-color="#ae7b4e" />
      <stop offset=".7" stop-color="#8b5c3e" />
      <stop offset="1" stop-color="#674332" />
    </radialGradient>
    <linearGradient id={uid + '-wood'} x2=".7" y2="1">
      <stop stop-color="#53413a" />
      <stop offset=".6" stop-color="#392a26" />
      <stop offset="1" stop-color="#231f1b" />
    </linearGradient>
    <linearGradient id={uid + '-sample'} x2="1" y2="1">
      <stop stop-color="#fff1b4" />
      <stop offset="1" stop-color="#d3ac70" />
    </linearGradient>
    <radialGradient id={uid + '-glow'}>
      <stop stop-color="#fff5c3" stop-opacity=".58" />
      <stop offset=".4" stop-color="#ffd596" stop-opacity=".23" />
      <stop offset="1" stop-color="#ffd596" stop-opacity="0" />
    </radialGradient>
    <pattern id={uid + '-dirt'} width="83" height="53" patternUnits="userSpaceOnUse">
      <path d="m3 7 9-3m70 7-14 4m-26 21-9 1m12-26 3-1m8 43 16-4M15 51l10-6" fill="none" stroke="#e0aa6e" stroke-opacity=".25" stroke-linecap="round" />
      <path d="m12 16 16-4m32 10 12 1M8 27l6-2m33 19 15-5M37 3l6-2" fill="none" stroke="#492d22" stroke-opacity=".37" stroke-linecap="round" />
      <path d="M16 35q9-3 13 1l-8 5zM46 24l6-4 5 5-3 4zM72 35l3 4-5 3-4-3z" fill="#5b3c29" opacity=".55" />
      <circle cx="30" cy="19" r="1.5" fill="#d39863" />
      <circle cx="59" cy="11" r="1" fill="#e3a879" />
      <circle cx="10" cy="44" r="1.6" fill="#4c3025" />
    </pattern>
    <pattern id={uid + '-pits'} width="9" height="8" patternUnits="userSpaceOnUse">
      <path d="M0 8 7 1m1 6 1-1" stroke="#d59e62" stroke-opacity=".38" stroke-width="1" />
    </pattern>
    <pattern id={uid + '-fabric'} width="5" height="5" patternUnits="userSpaceOnUse">
      <path d="M0 0h5M0 0v5" stroke="#8f6138" stroke-opacity=".62" stroke-width="1.2" />
    </pattern>
    <clipPath id={uid + '-digframe'}>
      <path d="M68 157 718 152 781 369 47 377z" />
    </clipPath>
  </defs>

  <path d="M0 0h800v480H0z" fill={ref('room')} />
  <path d="M0 51 800 27M0 99 800 95M0 146h800M0 440l800 5M0 460l800 9" stroke="#87a692" stroke-opacity=".13" fill="none" />
  <path d="M0 119 800 115V134L0 140z" fill="#121c19" opacity=".32" />
  <path d="M32 1h14v132l-14 5ZM751 0h13v142l-13-4Z" fill="#a89973" opacity=".15" />

  <!-- An expeditioner's ledger, string and reference swatches hang under the lamp. -->
  <g transform="translate(68 62) rotate(-8)">
    <path d="M2 4h102v66H0z" fill="#0e1715" opacity=".56" />
    <path d="M0 0h100v65H-2z" fill="#a49069" />
    <path d="M5 5h89v53H4z" fill="#b49d74" stroke="#514838" stroke-width="1" />
    <path d="M11 16h33m-33 7h23m60 17H12m2 6h39m-39 7h24" stroke="#675944" fill="none" />
    <path d="m67 9 6 5-3 13-12 5-7-8 4-10 10-2m-5 2-3 12m11-13-4 13" stroke="#68563d" fill="none" />
    <path d="m44-5 15 1-1 10-15-1z" fill="#786b53" />
  </g>
  <g transform="translate(587 66) rotate(7)">
    <path d="M0 7h118l3 50H0z" fill="#151c17" opacity=".46" />
    <path d="M1 1h111l5 49H-1z" fill="#637260" stroke="#1f2e25" stroke-width="2" />
    <path d="M14 12h26v23H13zm35 0h26v23H48zm35 0h17v23H85z" fill="none" stroke="#a5ae84" stroke-width="1.3" />
    <path d="m15 31 21-17m-21 10 13-10m23 15 22-13m-19 19 19-12m16-3 7 10 5-12" stroke="#a5ae84" stroke-opacity=".7" fill="none" />
  </g>
  <path d="M400 0v60" stroke="#111c17" stroke-width="5" />
  <path d="M341 109 386 63h28l45 46z" fill="#121f19" opacity=".73" />
  <path d="M347 104 392 64h16l45 40z" fill="#637666" stroke="#111d19" stroke-width="3" />
  <path d="M347 104h106" stroke="#f1bf78" stroke-width="4" opacity=".72" />
  <path d="m347 111-148 298 401-8-147-290z" fill="#edbd7a" opacity=".045" />

  <!-- The dig tray is a fictional training diorama rather than a real grave. -->
  <path d="M42 152 722 142 793 362l-19 75-735 8-24-54z" fill="#080f0d" opacity=".48" />
  <path d="M59 144 725 140l66 229-16 55-738 11-18-56z" fill={ref('wood')} stroke="#181b15" stroke-width="4" />
  <path d="M68 157 718 152l63 217-734 8z" fill={ref('ground')} />
  <g clip-path={ref('digframe')}>
    <path d="M28 148h761v240H28z" fill={ref('dirt')} />
    <path d="M59 195q144-31 286-24t415 5M47 352q172-25 346-2t394-25M49 376q160-7 333 0t403-19" fill="none" stroke="#583a2a" stroke-opacity=".52" stroke-width="3" />
    <path d="M61 202q121-26 223-12m170-5 240-14M69 360q152-24 238-19m148 13q104 12 252-8" fill="none" stroke="#d5a36c" stroke-opacity=".4" stroke-width="2" />
    <path d="M69 187 718 174M62 219l665-12M56 254l682-12M50 296l700-11M40 343l730-10M162 152l-4 225m120-221-4 221m120-220 7 219m106-221 15 221m98-226 29 219" fill="none" stroke="#f5cf96" stroke-width="1" stroke-opacity=".19" stroke-dasharray="3 7" />
    <path d="m93 227 23-4 10 8-9 9-26-5zM731 280l15-2 12 9-19 5-8-4zm-205 38 5-5 17 3 4 7-13 3zM251 273l10-8 21 4-4 8-16 5zm209 35 3-7 19 7 2 5-13 3zm-203 42 12-4 8 7-11 8zM699 336l9-9 15 5-1 8-11 4z" fill="#6c4733" stroke="#a9774c" />
    <path d="m115 224-12 10m425 83 13 5m199-40 10 5m-484-15 12-4m424 70 14-7" fill="none" stroke="#bb8c60" stroke-opacity=".6" stroke-linecap="round" />
  </g>
  <path d="M44 378 784 370l-4 15-737 15z" fill="#715747" />
  <path d="M43 400 780 385l-7 30-732 12z" fill="#342820" />
  <path d="M55 414l712-11m-700-7 680-10" stroke="#674d38" fill="none" />
  <path d="M73 407l6-3 5 4-5 5zm267-4 6-3 5 4-6 5zm376-8 8-3 5 4-6 5z" fill="#a18a5e" />
  <path d="m41 377 28-226m711 214-62-216" stroke="#ac8962" stroke-opacity=".75" stroke-width="4" fill="none" />

  {#if beam}
    <circle cx={beam.x * 800} cy={beam.y * 480} r="156" fill={ref('glow')} class="beam" />
  {/if}

  {#each sites as site, i (i)}
    {@const revealed = illuminated.includes(i) || excavated.includes(i)}
    {@const lifted = excavated.includes(i)}
    <g transform="translate({site.x} {site.y}) rotate({site.angle})">
      <ellipse cy="9" rx="84" ry="28" fill="#36291f" opacity=".28" />
      <path d="M-83 13q4-14 29-20 8-15 26-14 27-12 54 0 24 3 32 11 17-2 27 23-9 14-45 19-39 2-88-1-26-5-35-18z" fill={lifted ? '#6b4934' : '#8c5e3f'} stroke="#673f28" stroke-width="2" />
      <path d="M-65 12q14-11 28-8 25-17 54-10 16 9 41 12M-54 25q24-5 34 0m46-4q28 8 42-1" stroke="#d5a16f" stroke-opacity=".56" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M-58 15q4-7 34-11 27-13 52-9 14 2 29 11-20 14-44 12-20 9-71-3z" fill={ref('pits')} />
      {#if !lifted}
        {#if revealed}
          <ellipse rx="97" ry="82" fill={ref('glow')} />
        {/if}
        <g opacity={revealed ? 1 : .65} class="sample">
          {#if i === target}
            <path d="M-40 1-34-16-10-27 23-15 40 15 2 22-13 15z" fill={revealed ? ref('sample') : '#af8052'} stroke={revealed ? '#fff1c6' : '#ca9a68'} stroke-width="1.5" />
            <path d="M-40 1-34-16-10-27 23-15 40 15 2 22-13 15z" fill={ref('fabric')} />
            <path d="m-34-16 31 5 29 32M-10-27l-3 15m28-7 1 13" stroke={revealed ? '#fbebbe' : '#a37147'} stroke-width="2.4" fill="none" />
          {:else if i === (target + 1) % 3}
            <path d="M-41 10q10-2 20-17 14-16 35-12 15 6 16 10t15 9l-4 15q-12 7-28 1t-29 3q-13 1-25-9z" fill={revealed ? ref('sample') : '#b48b60'} stroke={revealed ? '#eedca8' : '#976f49'} stroke-width="1.4" />
            <path d="M-41 10q10-2 20-17 14-16 35-12 15 6 16 10t15 9l-4 15q-12 7-28 1t-29 3q-13 1-25-9z" fill={ref('fabric')} />
            <path d="M-32 14q15-1 32-19 18-8 30 3" stroke="#a86b3f" stroke-width="1.5" fill="none" />
          {:else}
            <path d="M-40 9-27-17 4-26l36 20L22 17-8 21z" fill={revealed ? '#a46849' : '#8a5942'} stroke={revealed ? '#dda275' : '#9d7358'} stroke-width="1.5" />
            <path d="m-23-16 25 13L-8 20m12-45 5 20L22 17m-48-35 12 15L-40 9M-9-7l18-16" fill="none" stroke="#5f4036" stroke-width="2" />
            <path d="m-26 10 9-6 6 2-2 6zm38-10 5-7 6 6-5 5z" fill="#d79d60" opacity=".61" />
          {/if}
        </g>
        <path d="M-45 14q18-4 26 2l12-3 17 7 34-6 9 7q-42 17-98-7z" fill="#744b32" opacity=".82" />
      {:else}
        <path d="M-53 11q4-11 32-19 30-10 61 8 10 6 13 15-42 21-106-4z" fill="#453327" opacity=".82" />
        <path d="M-32 7q22-17 55-4M-24 16q22-8 54-3" stroke="#a57350" stroke-opacity=".65" fill="none" />
      {/if}
    </g>
  {/each}

  <!-- Scale marks and packing supplies help the set feel handled. -->
  <g transform="translate(85 403) rotate(-1)">
    <path d="M0 0h121v10H0z" fill="#c49c66" stroke="#795a3a" />
    <path d="M7 1v7m9-7v4m9-4v7m9-7v4m9-4v7m9-7v4m9-4v7m9-7v4m9-4v7m9-7v4m9-4v7m9-7v4m9-4v7" stroke="#63503b" fill="none" />
  </g>
  <g transform="translate(592 392) rotate(-4)">
    <path d="M0 16q6-8 22-7l31 2-2 9-41 3z" fill="#ac7c52" stroke="#412b23" stroke-width="2" />
    <path d="m47 11 73-6 11-3 3 4-9 6-76 9z" fill="#937359" stroke="#4e372a" stroke-width="2" />
    <path d="m53 11-1 8m9-9-1 7m-47-2 27 1m-22 3 10-1" stroke="#d4a774" opacity=".65" fill="none" />
  </g>
</svg>

<style>
  .field-art {
    display: block;
    width: 100%;
    height: auto;
    pointer-events: none;
  }
  .sample {
    transition: opacity 160ms ease;
  }
  @media (prefers-reduced-motion: reduce) {
    .sample {
      transition: none;
    }
  }
</style>

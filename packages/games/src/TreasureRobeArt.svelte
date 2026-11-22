<script>
  /** @type {{overlay?: number | boolean, label?: string}} */
  let { overlay = 0, label = '直裾素纱单衣复原示意' } = $props();
  const uid = $props.id();
  const silhouette =
    'M134 31q11-7 23-9l24 9h19l24-9q12 2 23 9l103 34-14 58-87-14-17-12 11 128q-54 16-107 0l14-127-18 11-89 14-14-58z';
  const undercoat =
    'M129 37q14-10 28-14l24 10h19l24-10q14 4 28 14l98 29-14 57-88-13-16-13 11 129q-53 16-107 0l14-129-16 13-91 13-14-56z';
  let reveal = $derived(typeof overlay === 'number' ? Math.max(0, Math.min(1, overlay / 100)) : Number(overlay));
</script>

<svg class="robe-art" viewBox="0 0 380 256" role="img" aria-label={label} xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id={uid + '-silk'} width="4" height="4" patternUnits="userSpaceOnUse">
      <path d="M0 0h4M0 0v4" fill="none" stroke="#a66b48" stroke-opacity=".57" stroke-width=".5" />
    </pattern>
    <pattern id={uid + '-brocade'} width="35" height="23" patternUnits="userSpaceOnUse" patternTransform={`translate(${Math.round((reveal - 1) * 82)} 0)`}>
      <path d="M0 15q6-10 13-5l-1 6 4-1 3-6q5-8 14-4M-5 6l9 5m23 6 10-9M0 21q12 1 17-4t18-3" fill="none" stroke="#f8bf76" stroke-opacity=".75" stroke-width="2.2" stroke-linecap="round" />
      <circle cx="25" cy="9" r="1.5" fill="#f8d08d" />
      <circle cx="4" cy="7" r="1" fill="#f8d08d" />
    </pattern>
    <linearGradient id={uid + '-gauze'} x2=".75" y2="1">
      <stop stop-color="#fff6d2" stop-opacity=".79" />
      <stop offset=".56" stop-color="#efe2ba" stop-opacity=".65" />
      <stop offset="1" stop-color="#b79060" stop-opacity=".62" />
    </linearGradient>
    <linearGradient id={uid + '-hem'} x2="1" y2="1">
      <stop stop-color="#dbb97f" />
      <stop offset="1" stop-color="#8d6847" />
    </linearGradient>
    <clipPath id={uid + '-outer-shape'}>
      <path d={silhouette} />
    </clipPath>
    <clipPath id={uid + '-slide'} clipPathUnits="userSpaceOnUse">
      <rect x="28" y="18" width={324 * reveal} height="222" />
    </clipPath>
  </defs>
  <path d="M16 137h348M192 12v232" fill="none" stroke="#b28b5f" stroke-opacity=".52" stroke-dasharray="2 5" />
  <path d="M15 26V14h16m317 0h16v12m0 199v12h-16m-317 0H15v-12" fill="none" stroke="#ac825a" stroke-width="2" opacity=".65" />
  <path d={silhouette} transform="translate(4 5)" fill="#795438" opacity=".24" />
  <g clip-path={'url(#' + uid + '-outer-shape)'}>
    <g clip-path={'url(#' + uid + '-slide)'}>
      <path d={undercoat} fill="#aa3a2f" />
      <path d={undercoat} fill={'url(#' + uid + '-brocade)'} />
      <path d="m157 25 50 66 18 130m-2-196-46 65-12 135" fill="none" stroke="#d6ab67" stroke-width="3" />
    </g>
  </g>
  <path d={silhouette} fill={'url(#' + uid + '-gauze)'} stroke="#947658" stroke-width="1.7" />
  <path d={silhouette} fill={'url(#' + uid + '-silk)'} />
  <path d="m29 65 21-7 14 61-21 4zm322 0-21-7-14 61 20 4zM136 216q49 14 106 0l1 9q-51 16-107 0z" fill={'url(#' + uid + '-hem)'} stroke="#916b4a" stroke-width="1" />
  <path d="M156 24q18 10 34 10t35-10l-6 13-20 34-10-10 18-31m-51-6 10 19 38 47-1 136-8 3V92l-19-24-24-44z" fill={'url(#' + uid + '-hem)'} stroke="#916b4a" stroke-width="1.2" />
  <path d="m67 63 16 46m-12-32 13-2q13-2 15 14m19-47-5 61m184-43-8 44m-5-49-6 31m-120 22-9 87m79-87 7 105m-69-4 3-78m44 67-1-53m-80-48-2 9m118-10 2 8" fill="none" stroke="#a9875b" stroke-opacity=".62" stroke-width="1.4" stroke-linecap="round" />
  <path d="M156 31q16 28 44 60l-1 136M46 118l13-3m265 1 11 3m-194 101q49 13 97 0" fill="none" stroke="#ffe6b3" stroke-opacity=".74" stroke-width="1.3" stroke-dasharray="2 2" />
</svg>

<style>
  .robe-art {
    width: 100%;
    height: auto;
    display: block;
  }
</style>

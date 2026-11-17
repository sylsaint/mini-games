<script>
  let { photo: p, compact = false, enabled = true } = $props();
  function lazy(node) {
    if (!('IntersectionObserver' in window)) { node.src = p.src; return; }
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { node.src = p.src; observer.disconnect(); } }, {rootMargin: '120px'});
    observer.observe(node);
    return {destroy() { observer.disconnect(); }};
  }
</script>
<figure class="photo-card"><button class:contain={p.contain} class="photo-open" data-photo={p.id} aria-label={'放大查看：'+p.title}>
{#if enabled}<img use:lazy data-src={p.src} width={p.width} height={p.height} loading="lazy" decoding="async" alt={p.alt}>{/if}</button>
<figcaption><div class="photo-meta"><span class="photo-type" class:historic={p.kind === 'historic' || p.kind === 'drawing'}>{p.kindLabel}</span><span class="photo-year">{p.yearLabel}</span></div><h5>{p.title}</h5><p>{p.caption}</p>{#if !compact && p.lookFor}<p class="photo-look"><b>一起找一找：</b>{p.lookFor}</p>{/if}<div class="photo-credit">{p.author} · <a href={p.licenseUrl} target="_blank" rel="noopener noreferrer">{p.license}</a> · <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">图片来源 ↗</a></div></figcaption></figure>

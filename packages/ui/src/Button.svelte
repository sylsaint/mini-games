<script lang="ts">
  import type { Snippet } from 'svelte';
  import ShadcnButton from './components/button/button.svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  let { children, class: className = '', variant = 'default', ...rest }: HTMLButtonAttributes & {children?: Snippet; variant?: 'default'|'outline'} = $props();
</script>
<ShadcnButton class={`yoyo-button ${variant} ${className}`} {...rest}>{#if children}{@render children()}{/if}</ShadcnButton>
<style>:global(.yoyo-button){font:inherit;min-height:44px;padding:.6rem 1.1rem;border:1px solid transparent;border-radius:.75rem;background:#245b4a;color:#fff;cursor:pointer;transition:background .15s}:global(.yoyo-button:hover){background:#194334}:global(.yoyo-button.outline){background:transparent;border-color:#98b4a5;color:#245b4a}:global(.yoyo-button:focus-visible){outline:3px solid #d48848;outline-offset:3px}:global(.yoyo-button:disabled){opacity:.5;cursor:not-allowed}@media(prefers-reduced-motion:reduce){:global(.yoyo-button){transition:none}}</style>

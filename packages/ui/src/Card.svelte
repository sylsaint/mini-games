<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    children,
    class: className = "",
    tone = "paper",
    ...rest
  }: HTMLAttributes<HTMLElement> & {
    children?: Snippet;
    tone?: "paper" | "muted";
  } = $props();
</script>

<section class={`yoyo-card ${className}`} data-tone={tone} {...rest}>
  {@render children?.()}
</section>

<style>
  .yoyo-card {
    min-width: 0;
    box-sizing: border-box;
    padding: var(--card-padding, clamp(1rem, 3vw, 1.75rem));
    color: var(--color-foreground, #263f3a);
    background: var(--color-background, #fffdf8);
    border: 1px solid var(--color-border, #b8c8b0);
    border-radius: var(--card-radius, 1.5rem);
  }
  .yoyo-card[data-tone="muted"] {
    background: var(--color-muted, #edf2e9);
  }
</style>

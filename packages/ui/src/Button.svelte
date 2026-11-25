<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
  import ShadcnButton, { buttonVariants } from "./components/button/button.svelte";

  type Variant = "default" | "outline";
  type Shared = { children?: Snippet; class?: string; variant?: Variant };
  type Props = Shared & (
    | ({ href: string } & Omit<HTMLAnchorAttributes, keyof Shared>)
    | ({ href?: undefined } & Omit<HTMLButtonAttributes, keyof Shared>)
  );

  let props: Props = $props();
  const classNames = $derived(`yoyo-button ${props.variant ?? "default"} ${props.class ?? ""}`);
</script>

{#if props.href !== undefined}
  {@const { children, class: _, href, variant, ...rest } = props}
  <a {...(rest as HTMLAnchorAttributes)} {href} class={`${buttonVariants({ variant })} ${classNames}`}>{@render children?.()}</a>
{:else}
  {@const { children, class: _, href, variant, ...rest } = props}
  <ShadcnButton {variant} class={classNames} {...(rest as HTMLButtonAttributes)}>{@render children?.()}</ShadcnButton>
{/if}

<style>
  :global(.yoyo-button) {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    height: auto;
    padding: .6rem 1.1rem;
    border: 1px solid transparent;
    border-radius: .75rem;
    background: var(--color-primary, #245b4a);
    color: var(--color-primary-foreground, #fff);
    font: inherit;
    text-decoration: none;
    white-space: normal;
    text-align: center;
    touch-action: manipulation;
    cursor: pointer;
    transition: background .15s;
  }
  :global(.yoyo-button:hover) { background: #194334; }
  :global(.yoyo-button.outline) {
    background: transparent;
    border-color: #98b4a5;
    color: var(--color-primary, #245b4a);
  }
  :global(.yoyo-button.outline:hover) { background: var(--color-muted, #edf2e9); }
  :global(.yoyo-button:focus-visible) {
    outline: 3px solid var(--color-ring, #cb8848);
    outline-offset: 3px;
  }
  :global(.yoyo-button:disabled) { opacity: .5; cursor: not-allowed; }
  @media (prefers-reduced-motion: reduce) {
    :global(.yoyo-button) { transition: none; }
  }
</style>

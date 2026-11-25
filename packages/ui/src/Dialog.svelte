<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { Snippet } from "svelte";
  import Button from "./Button.svelte";

  let {
    title,
    description,
    trigger,
    open = $bindable(false),
    cancelLabel = "关闭",
    onCloseAutoFocus,
    children,
  }: {
    title: string;
    description: string;
    trigger?: string;
    open?: boolean;
    cancelLabel?: string;
    onCloseAutoFocus?: (event: Event) => void;
    children?: Snippet;
  } = $props();
</script>

<Dialog.Root bind:open>
  {#if trigger}
    <Dialog.Trigger>
      {#snippet child({ props })}<Button {...props} variant="outline">{trigger}</Button>{/snippet}
    </Dialog.Trigger>
  {/if}
  <Dialog.Portal>
    <Dialog.Overlay class="yoyo-dialog-overlay" />
    <Dialog.Content class="yoyo-dialog-content" {onCloseAutoFocus}>
      <Dialog.Title class="yoyo-dialog-title">{title}</Dialog.Title>
      <Dialog.Description class="yoyo-dialog-description">{description}</Dialog.Description>
      <div class="dialog-actions">
        <Dialog.Close>
          {#snippet child({ props })}<Button {...props} variant="outline">{cancelLabel}</Button>{/snippet}
        </Dialog.Close>
        {@render children?.()}
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(.yoyo-dialog-overlay) { position: fixed; inset: 0; background: #153e336b; z-index: 100; }
  :global(.yoyo-dialog-content) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(calc(100% - 2rem), 28rem);
    max-height: 85vh;
    overflow: auto;
    box-sizing: border-box;
    padding: clamp(1.25rem, 4vw, 1.75rem);
    border: 1px solid var(--color-border, #b8c8b0);
    border-radius: 1.5rem;
    background: var(--color-background, #fffdf8);
    color: var(--color-foreground, #263f3a);
    box-shadow: 0 16px 60px #153e3326;
    font: 1rem/1.65 system-ui, sans-serif;
    z-index: 101;
  }
  :global(.yoyo-dialog-title) { margin: 0; font-size: 1.35rem; line-height: 1.35; }
  :global(.yoyo-dialog-description) { margin: .65rem 0 0; }
  .dialog-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: .6rem; margin-top: 1.25rem; }
</style>

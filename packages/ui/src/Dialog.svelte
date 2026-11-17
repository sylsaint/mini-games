<script lang="ts">
import { Dialog } from 'bits-ui';
import type { Snippet } from 'svelte';
let { title, description, trigger, children }: {title:string;description:string;trigger:string;children?:Snippet} = $props();
</script>
<Dialog.Root><Dialog.Trigger class="dialog-trigger">{trigger}</Dialog.Trigger><Dialog.Portal><Dialog.Overlay class="dialog-overlay"/><Dialog.Content class="dialog-content"><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description>{#if children}{@render children()}{/if}<Dialog.Close class="dialog-close">关闭</Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>
<style>:global(.dialog-overlay){position:fixed;inset:0;background:#153e3370;z-index:100}:global(.dialog-content){position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(90vw,480px);max-height:80vh;overflow:auto;padding:28px;border-radius:20px;background:#fffdf8;color:#263f3a;z-index:101;box-shadow:0 20px 80px #0003}:global(.dialog-trigger),:global(.dialog-close){font:inherit;border:1px solid #90a69d;border-radius:10px;padding:10px 16px;background:#fffdf8;color:#245b4a;cursor:pointer;min-height:44px}:global(.dialog-trigger:focus-visible),:global(.dialog-close:focus-visible){outline:3px solid #c87235;outline-offset:3px}</style>

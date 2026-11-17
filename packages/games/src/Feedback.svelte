<script>let { feedback = null } = $props();</script>
<div class="feedback" class:ok={feedback?.ok} id="feedback" role="status" aria-live="polite" hidden={!feedback}>
{#if feedback}<h3>{feedback.title}</h3><p>{feedback.body}</p>{#each feedback.actions as action}<button class={action.className} id={action.id}>{action.label}</button>{/each}{/if}
</div>

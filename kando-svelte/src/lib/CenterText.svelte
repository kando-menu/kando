<script lang="ts">
  export let text: string = '';
  export let visible: boolean = false;
  export let wrapWidth: number | null = null;
</script>

{#if visible}
  <div class="center-text" aria-hidden="true"
       style={`position:absolute; left:0; top:0; transform: translate(-50%, -50%); ${wrapWidth != null ? `max-width:${wrapWidth}px;` : ''}`}>{text}</div>
{/if}

<style>
  .center-text {
    text-align: center;
    font-family: 'Noto Sans', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    font-weight: 500;
    line-height: 1.25;
    user-select: none;
    -webkit-user-select: none;
    pointer-events: none;
  }
</style>

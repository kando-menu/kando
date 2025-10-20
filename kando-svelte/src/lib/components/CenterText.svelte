<script lang="ts">

  const { text = '', visible = false, wrapWidth = null as (number | null) } = 
    $props<{
      text?: string; 
      visible?: boolean; 
      wrapWidth?: number | null
    }>();

</script>

{#if visible}

  <div 
    class="center-text" aria-hidden="true"
    style={`position:absolute; left:0; top:0; transform: translate(-50%, -50%); ${wrapWidth != null ? `max-width:${wrapWidth}px;` : ''}`}>{text}</div>

{/if}

<style>

  .center-text { pointer-events: none; font-family: var(--kando-text-font, 'Noto Sans', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, sans-serif); text-align: center; }

</style>

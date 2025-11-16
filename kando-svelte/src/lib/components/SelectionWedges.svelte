<script lang="ts">

  const { center = { x: 0, y: 0 } as { x: number; y: number }, wedge = null as ({ start: number; end: number } | null) } = $props<{ center?: { x:number;y:number }; wedge?: { start:number; end:number } | null }>();

</script>

<div class={`selection-wedges ${wedge ? 'hovered' : ''}`} style={`--center-x:${center.x}px; --center-y:${center.y}px; ${wedge ? `--start-angle:${wedge.start}deg; --end-angle:${wedge.end}deg;` : ''}`}></div>

<style>

  .selection-wedges { position: absolute; inset: 0; pointer-events: none; }
  
</style>

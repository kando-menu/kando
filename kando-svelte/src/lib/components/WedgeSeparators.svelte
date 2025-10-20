<script lang="ts">

  const { center = { x: 0, y: 0 } as { x: number; y: number }, angles = [] as number[] } = $props<{ center?: { x:number;y:number }; angles?: number[] }>();

</script>

<div class="wedge-separators">

  {#each angles as ang}

    <div class="separator" style={`transform: translate(${center.x}px, ${center.y}px) rotate(${ang - 90}deg); --angle:${ang}deg;`}></div>

  {/each}
  
</div>

<style>

  .wedge-separators { position: absolute; inset: 0; pointer-events: none; }
  .separator { position: absolute; width: 100vmax; height: 1px; transform-origin: 0% 0; }
  
</style>

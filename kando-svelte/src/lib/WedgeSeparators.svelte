<script lang="ts">
  export let angles: number[] = [];
  export let centerX = 0;
  export let centerY = 0;
  export let radius = 0; // outer ring radius
  export let innerRadius = 0; // inactive center radius

  type Line = { x1: number; y1: number; x2: number; y2: number };
  let lines: Line[] = [];
  $: lines = angles.map((a) => {
    const rad = (a - 90) * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    return {
      x1: centerX + cos * innerRadius,
      y1: centerY + sin * innerRadius,
      x2: centerX + cos * radius,
      y2: centerY + sin * radius
    };
  });
</script>

<svg class="wedge-separators" aria-hidden="true">
  <circle cx={centerX} cy={centerY} r={radius} class="ring" />
  {#each lines as l}
    <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} class="spoke" />
  {/each}
  <circle cx={centerX} cy={centerY} r={innerRadius} class="center" />
</svg>

<style>
  .wedge-separators { position: absolute; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
  .ring { fill: none; stroke: rgba(127,127,127,0.5); stroke-width: 1; stroke-dasharray: 6 6; }
  .spoke { stroke: rgba(127,127,127,0.5); stroke-width: 1; stroke-dasharray: 6 6; }
  .center { fill: rgba(127,127,127,0.5); }
</style>

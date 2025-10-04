<script lang="ts">
  export let centerX = 0;
  export let centerY = 0;
  export let startAngle: number | null = null;
  export let endAngle: number | null = null;
</script>

<div class="selection-wedges {startAngle != null && endAngle != null ? 'hovered' : ''}"
     style="--center-x: {centerX}px; --center-y: {centerY}px; {startAngle != null ? `--start-angle: ${startAngle}deg;` : ''} {endAngle != null ? `--end-angle: ${endAngle}deg;` : ''}"></div>

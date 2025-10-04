<script lang="ts">
  import type { MenuItem } from './types';
  export let item: MenuItem;
  export let level: number = 0;
  export let dirX: number = 0;
  export let dirY: number = 0;
  export let angle: number = 0;
  export let siblingCount: number = 0;
  export let parentAngle: number | undefined = undefined;
</script>

<div class={`menu-node level-${level} type-${item.type}`}
     style="--dir-x: {dirX}; --dir-y: {dirY}; --angle: {angle}deg; --sibling-count: {siblingCount}; {parentAngle != null ? `--parent-angle: ${parentAngle}deg;` : ''}">
  <!-- TODO: render theme layers here -->
</div>

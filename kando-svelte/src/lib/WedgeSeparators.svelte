<script lang="ts">
  // Minimal placeholder for wedge separators; themed via CSS.
  export let angles: number[] = [];
</script>

<div class="wedge-separators" aria-hidden="true">
  {#each angles as a}
    <div class="separator" style={`--angle:${a}deg`}></div>
  {/each}
  <slot />
  <!-- Theme CSS should target .wedge-separators .separator using --angle -->
</div>



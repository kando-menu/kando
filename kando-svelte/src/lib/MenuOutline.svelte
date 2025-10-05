<script lang="ts">
  import type { MenuItemV1 } from '@kando/schemata/menu-settings-v1';
  export let item: MenuItemV1;
</script>

<li>
  <span>{item.name} ({item.type}{item.angle != null ? ` @ ${item.angle}°` : ''})</span>
  {#if item.children?.length}
    <ul>
      {#each item.children as c}
        <svelte:self item={c} />
      {/each}
    </ul>
  {/if}
</li>

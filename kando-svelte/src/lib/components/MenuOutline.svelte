<script lang="ts">

  import type { MenuItemV1 } from '../../../../src/common/settings-schemata/menu-settings-v1.ts';
  import Self from './MenuOutline.svelte';

  const { item } = $props<{ item: MenuItemV1 }>();

</script>

<li>

  <span>
    {item.name} ({item.type}{item.angle != null ? ` @ ${item.angle}°` : ''}
    {item.icon ? `, icon: ${item.icon}` : ''}
    {item.iconTheme ? `, theme: ${item.iconTheme}` : ''})
  </span>

  {#if item.children?.length}

    <ul>
      {#each item.children as c}
        <Self item={c} />
      {/each}
    </ul>

  {/if}
  
</li>

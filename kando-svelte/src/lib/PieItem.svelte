<script lang="ts">
  import type { MenuItem } from './types';
  import type { Snippet } from 'svelte';
  // DOM/CSS alignment with Kando: no math here
  export let item: MenuItem;
  export let level: number = 0;
  export let dirX: number = 0;
  export let dirY: number = 0;
  export let angle: number = 0;
  export let siblingCount: number = 0;
  export let parentAngle: number | undefined = undefined;
  export let stateClasses: string = '';
  export let pointerAngle: number | null = null;
  export let hoverAngle: number | null = null;
  export let parentHovered: boolean = false;
  export let connectorStyle: string = '';
  export let angleDiff: number | null = null; // for child nodes per Kando theme
  // Debug/diagnostic absolute positioning to rule out CSS transform bias
  export let forceAbsolute: boolean = false;
  export let absLeft: number | null = null;
  export let absTop: number | null = null;
  // Directional helper class
  $: dirClass = dirX < -0.2 ? 'left' : (dirX > 0.2 ? 'right' : (dirY < 0 ? 'top' : 'bottom'));
  // Optional transform for active/root like Kando updateTransform()
  export let transformStyle: string = '';
  // Allow center node to define child distance for descendants
  export let childDistancePx: number | null = null;
  // Path/level for Kando-like dataset attributes
  export let dataPath: string | null = null;
  export let dataLevel: number | null = null;
  // Theme layers (back-to-front iterate reversed) like Kando's MenuThemeDescription.layers
  export let layers: Array<{ class: string; content?: 'icon' | 'name' }>|null = null;
  // Snippet insertion points to replace slots
  export let below: Snippet<{ index?: number }>|null = null;
  export let belowIndex: number | null = null;
  export let content: Snippet<{ index?: number }>|null = null;
  // No explicit nubs here; grandchildren are rendered as real `.menu-node.grandchild` elements

</script>

<div class={`menu-node level-${level} type-${item.type} ${dirClass} ${stateClasses}`}
     data-name={item.name}
     data-type={item.type}
     data-path={dataPath}
     data-level={dataLevel}
     style="--dir-x: {dirX}; --dir-y: {dirY}; --angle: {angle}deg; --sibling-count: {siblingCount}; {parentAngle != null ? `--parent-angle: ${parentAngle}deg;` : ''}{angleDiff != null ? ` --angle-diff: ${angleDiff};` : ''}{childDistancePx != null ? ` --child-distance: ${childDistancePx}px;` : ''}{forceAbsolute && absLeft != null && absTop != null ? ` left: ${absLeft}px; top: ${absTop}px; transform: translate(-50%, -50%) !important;` : ''}{transformStyle ? ` transform: ${transformStyle};` : ''}">
  {#if (item as any)?.children?.length}
    <div class="connector" style={connectorStyle}></div>
  {/if}
  <!-- Theme layers are supplied by CSS; expose angles for center per Kando -->
  {#if below}
    {@render below(belowIndex != null ? { index: belowIndex } : {})}
  {/if}
  {#if layers && layers.length}
    {#each [...layers].reverse() as layer}
      <div class={layer.class}
           style="{pointerAngle != null ? `--pointer-angle: ${pointerAngle}deg;` : ''}{hoverAngle != null ? ` --hover-angle: ${hoverAngle}deg;` : ''}{hoverAngle != null && !parentHovered ? ` --hovered-child-angle: ${hoverAngle}deg;` : ''}">
        {#if layer.content === 'name'}
          {item.name}
        {:else if layer.content === 'icon'}
          <div class="icon-container">
            {#if (item as any).iconTheme === 'material-symbols-rounded'}
              <span class="material-symbols-rounded">{(item as any).icon}</span>
            {:else if (item as any).iconTheme === 'simple-icons'}
              <i class={`si si-${(item as any).icon}`}></i>
            {:else if (item as any).icon}
              <img src={`/kando/icon-themes/${(item as any).iconTheme}/${(item as any).icon}.svg`} alt={item.name} />
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  {:else}
    <div class="label-layer"><div class="label-container"></div></div>
    <div class="icon-layer" style="{pointerAngle != null ? `--pointer-angle: ${pointerAngle}deg;` : ''}{hoverAngle != null ? ` --hover-angle: ${hoverAngle}deg;` : ''}{hoverAngle != null && !parentHovered ? ` --hovered-child-angle: ${hoverAngle}deg;` : ''}">
      <div class="icon-container"></div>
    </div>
  {/if}
  {#if content}
    {@render content({})}
  {/if}
</div>

<style>
  .menu-node { position: absolute; left: 0; top: 0; }
  .connector { position: absolute; }
  .label-layer { position: absolute; }
  .icon-layer { position: absolute; }
  /* Help center and scale icons for font and img themes while letting theme sizes win */
  .icon-container { display: flex; align-items: center; justify-content: center; }
  .icon-container > img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .icon-container > .material-symbols-rounded,
  .icon-container > .si { font-size: calc(var(--child-size, 50px) * 0.7); line-height: 1; }
  .menu-node, .menu-node *, .menu-node *::before, .menu-node *::after {
    user-select: none; -webkit-user-select: none; -webkit-user-drag: none; -khtml-user-drag: none; -moz-user-select: none; -ms-user-select: none;
  }
  
</style>

<script lang="ts">

  import type { MenuItem } from '../types.js';
  import type { Snippet } from 'svelte';

  const {
    item,
    level = 0,
    dirX = 0,
    dirY = 0,
    angle = 0,
    siblingCount = 0,
    parentAngle = undefined as number | undefined,
    stateClasses = '',
    pointerAngle = null as number | null,
    hoverAngle = null as number | null,
    parentHovered = false,
    connectorStyle = '',
    angleDiff = null as number | null,
    // Debug/diagnostic absolute positioning to rule out CSS transform bias
    forceAbsolute = false,
    absLeft = null as number | null,
    absTop = null as number | null,
    // Optional transform for active/root like Kando updateTransform()
    transformStyle = '',
    // Allow center node to define child distance for descendants
    childDistancePx = null as number | null,
    // Path/level for Kando-like dataset attributes
    dataPath = null as string | null,
    dataLevel = null as number | null,
    // Theme layers (back-to-front iterate reversed) like Kando's MenuThemeDescription.layers
    layers = null as Array<{ class: string; content?: 'icon' | 'name' | 'none' }>|null,
    // Accessibility
    ariaRole = 'menuitem',
    idAttr = null as string | null,
    // Snippet insertion points to replace slots
    below = null as Snippet<[ { index: number } ]>|null,
    belowIndex = null as number | null,
    content = null as Snippet<[ {} ]>|null,
  } = $props<{
    item: MenuItem;
    level?: number;
    dirX?: number;
    dirY?: number;
    angle?: number;
    siblingCount?: number;
    parentAngle?: number | undefined;
    stateClasses?: string;
    pointerAngle?: number | null;
    hoverAngle?: number | null;
    parentHovered?: boolean;
    connectorStyle?: string;
    angleDiff?: number | null;
    forceAbsolute?: boolean;
    absLeft?: number | null;
    absTop?: number | null;
    transformStyle?: string;
    childDistancePx?: number | null;
    dataPath?: string | null;
    dataLevel?: number | null;
    layers?: Array<{ class: string; content?: 'icon' | 'name' | 'none' }>|null;
    ariaRole?: string;
    idAttr?: string | null;
    below?: Snippet<[ { index: number } ]>|null;
    belowIndex?: number | null;
    content?: Snippet<[ {} ]>|null;
  }>();

  const hasNameLayer = 
    $derived(!!(layers && layers.some((l: { content?: 'icon'|'name'|'none' }) => l.content === 'name')));

  // Directional helper class
  const dirClass = 
    $derived(dirX < -0.2 ? 'left' : (dirX > 0.2 ? 'right' : (dirY < 0 ? 'top' : 'bottom')));

</script>

<div class={`menu-node level-${level} type-${item.type} ${dirClass} ${stateClasses}`}
     data-name={item.name}
     data-type={item.type}
     data-path={dataPath}
     data-level={dataLevel}
     role={ariaRole}
     aria-label={hasNameLayer ? undefined : item.name}
     id={idAttr ?? undefined}
     style="--dir-x: {dirX}; --dir-y: {dirY}; --angle: {angle}deg; --sibling-count: {siblingCount}; {parentAngle != null ? `--parent-angle: ${parentAngle}deg;` : ''}{angleDiff != null ? ` --angle-diff: ${angleDiff};` : ''}{childDistancePx != null ? ` --child-distance: ${childDistancePx}px;` : ''}{forceAbsolute && absLeft != null && absTop != null ? ` left: ${absLeft}px; top: ${absTop}px; transform: translate(-50%, -50%) !important;` : ''}{transformStyle ? ` transform: ${transformStyle};` : ''}">

  <!-- Connector should paint behind all layers and content -->
  <div class="connector" style={`transform-origin:left center; ${connectorStyle}`}></div>

  <!-- Theme layers are supplied by CSS; expose angles for center per Kando -->
  {#if below}

    {@render below({ index: belowIndex ?? 0 })}

  {/if}

  {#if layers && layers.length}

    {#each [...layers].reverse() as layer}

      <div 
        class={layer.class}
        data-content={layer.content}
        style="{pointerAngle != null ? `--pointer-angle: ${pointerAngle}deg;` : ''}{hoverAngle != null ? ` --hover-angle: ${hoverAngle}deg;` : ''}{hoverAngle != null && !parentHovered ? ` --hovered-child-angle: ${hoverAngle}deg;` : ''}">

        {#if layer.content === 'name'}

          <span class="label-text">{item.name}</span>

        {:else if layer.content === 'icon'}

          <div class="icon-container" aria-hidden="true">

            {#if (item as any).iconTheme === 'material-symbols-rounded'}
              <i class="material-symbols-rounded" aria-hidden="true" inert>{(item as any).icon}</i>
            {:else if (item as any).iconTheme === 'simple-icons'}
              <i class={`si si-${(item as any).icon}`} aria-hidden="true"></i>
            {:else if (item as any).icon}
              <img src={`/kando/icon-themes/${(item as any).iconTheme}/${(item as any).icon}.svg`} alt={item.name} />
            {/if}

          </div>

        {/if}

      </div>

    {/each}

  {:else}

    <div class="label-layer" hidden><div class="label-container"></div></div>

    <div class="icon-layer" aria-hidden="true" style="{pointerAngle != null ? `--pointer-angle: ${pointerAngle}deg;` : ''}{hoverAngle != null ? ` --hover-angle: ${hoverAngle}deg;` : ''}{hoverAngle != null && !parentHovered ? ` --hovered-child-angle: ${hoverAngle}deg;` : ''}">
      <div class="icon-container"></div>
    </div>

  {/if}

  {#if content}

    {@render content({})}

  {/if}

</div>

<style>

  .menu-node { position: absolute; left: 0; top: 0; }
  .connector { position: absolute; z-index: 0; background: var(--border-color, rgba(0,0,0,0.6)); }
  .label-layer { position: absolute; }
  .icon-layer { position: absolute; display: grid; place-items: center; }
  .icon-layer > .icon-container { display: grid; place-items: center; width: 100%; height: 100%; }
  .label-text { font-family: var(--kando-text-font, 'Noto Sans', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, sans-serif); }
  
</style>

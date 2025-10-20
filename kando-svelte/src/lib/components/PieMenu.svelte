<script lang="ts">

  import type { MenuItem, Vec2 } from '../types.js';
  // Uses Kando math for angles and directions
  // @ts-ignore
  import * as math from '@kando/common/math';
  import PieItem from './PieItem.svelte';
  import CenterText from './CenterText.svelte';
  import SelectionWedges from './SelectionWedges.svelte';
  import WedgeSeparators from './WedgeSeparators.svelte';

  // One-level PieMenu. Draws a ring at center with children around. Can render compact
  // (iconic) or regular (with labels). Transitions/animations to be added later.
  const {
    item,
    center = { x: 0, y: 0 } as Vec2,
    radiusPx = 140,
    parentAngle = undefined as number | undefined,
    compact = false,
    hoverIndex = -1,
    pointer = null as ({ clientX: number; clientY: number; dx: number; dy: number; angle: number; distance: number } | null),
    childStates = [] as string[],
    centerStateClasses = 'active',
    childClassBase = 'child',
    layers = null as ({ class: string; content?: 'icon'|'name'|'none' }[] | null),
    centerTextWrapWidth = null as (number | null),
    drawChildrenBelow = false,
    renderGrandchildren = true,
    drawSelectionWedges = false,
    drawWedgeSeparators = false,
    renderChildren = true,
    drawCenterText = true,
    activeHoverIndex = -1,
    pressedDragging = false,
    showParentLink = false,
    parentPreviewItem = null
  } = $props<{
    item: MenuItem;
    center?: Vec2;
    radiusPx?: number;
    parentAngle?: number;
    compact?: boolean;
    hoverIndex?: number;
    pointer?: { clientX: number; clientY: number; dx: number; dy: number; angle: number; distance: number } | null;
    childStates?: string[];
    centerStateClasses?: string;
    childClassBase?: string;
    layers?: { class: string; content?: 'icon'|'name'|'none' }[] | null;
    centerTextWrapWidth?: number | null;
    drawChildrenBelow?: boolean;
    renderGrandchildren?: boolean;
    drawSelectionWedges?: boolean;
    drawWedgeSeparators?: boolean;
    renderChildren?: boolean;
    drawCenterText?: boolean;
    activeHoverIndex?: number;
    pressedDragging?: boolean;
    showParentLink?: boolean;
    parentPreviewItem?: any;
  }>();

  let hoveredIndex = $state(-1);
  let connectorStyle = $state('');
  let lastConnectorAngle: number | null = null;
  // wedgeInfo and derivatives are computed with $derived below

  function closestEquivalentAngle(target: number, reference: number): number {
    // Normalize both to [0, 360)
    const t = ((target % 360) + 360) % 360;
    const r = ((reference % 360) + 360) % 360;
    let delta = t - r;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return reference + delta;
  }

  function updateConnector() {

    // Active layer: show connector only during pressed-dragging preview
    if (centerStateClasses === 'active') {
      if (!(pressedDragging && pointer && hoveredIndex >= 0)) {
        connectorStyle = 'width: 0px;';
        return;
      }
    }

    if (hoveredIndex < 0) { connectorStyle = 'width: 0px;'; return; }

    // Angle towards hovered child
    const angDir = (pressedDragging && pointer)
      ? pointer.angle
      : (childAngles[hoveredIndex] ?? 0);
    let ang = angDir - 90;
    // Distance: theme contract uses max(--child-distance, 10px * sibling-count)
    const siblings = (item?.children ?? []).length;
    const baseDistance = Math.max(radiusPx, 10 * siblings);

    // Default theme scales children when any child is hovered; approximate scale to match visuals
    let scale = 1;

    if (pointerAngle != null) {
      const d = Math.abs(((angDir - pointerAngle + 540) % 360) - 180);
      // Matches Default theme: 1.15 - pow(angleDiff/180, 0.25) * 0.15
      scale = 1.15 - Math.pow(d / 180, 0.25) * 0.15;
    }

    // In "click-up" hovering preview, pull the connector to the current pointer radius
    // so the submenu center will already be under the pointer when released.
    const len = 
      (pointer && hoveredIndex >= 0)
        ? (pressedDragging ? pointer.distance : Math.max(pointer.distance, baseDistance * 0.95))
        : (baseDistance * scale);

    if (lastConnectorAngle != null) {
      ang = closestEquivalentAngle(ang, lastConnectorAngle);
    }

    lastConnectorAngle = ang;

    // Root node is translated to center; connector rotates in local space.
    // During moving-preview, the hovered child itself is translated to pointer via transformStyle,
    // but the connector must be drawn by the CENTER node to span from center->child.
    connectorStyle = 
      `display:block; pointer-events:none; width:${Math.max(0, len)}px; transform: rotate(${ang}deg); opacity: 1; height: var(--connector-width, 10px); top: calc(-0.5 * var(--connector-width, 10px));`;
      
    try { 
      console.debug('[pie-connector]', { name: (item as any)?.name, hoveredIndex, len: Math.round(len), dragging: pressedDragging, pointer: pointer ? { d: Math.round(pointer.distance), a: Math.round(pointer.angle) } : null }); 
    } catch {}
  }

  const pointerAngle = $derived(pointer ? pointer.angle : null);

  const centerLabel = $derived(hoveredIndex >= 0 ? ((item?.children?.[hoveredIndex] as any)?.name ?? '') : '');

  // no Svelte dispatch; callbacks are handled by PieTree
  // derived label for nested active center
  const activeCenterLabel = $derived((hoveredIndex >= 0 && activeHoverIndex >= 0)
    ? (((item as any).children?.[hoveredIndex]?.children?.[activeHoverIndex]?.name) ?? '')
    : '');

  // Radii
  const innerRadius = $derived(Math.max(30, radiusPx * 0.35));

  // Guard initial render until center is measured to avoid 0,0 flash
  const centerReady = $derived(
    Number.isFinite(center?.x) && Number.isFinite(center?.y) && !(center.x === 0 && center.y === 0)
  );

  const childAngles: number[] = $derived(
    math.computeItemAngles(
      (item?.children ?? []).map((c: any) => (c && c.angle != null ? { angle: c.angle } : {})),
      parentAngle
    )
  );

  // Compute directions once for children so we can pass normalized dir vars and also
  // derive left/right/top/bottom classes consistently with Kando
  const childDirs = $derived(childAngles.map((ang: number) => math.getDirection(ang, 1.0))); 

  // Grandchildren angles and directions per child (for nubs)
  // Grandchildren angles for two contexts:
  // - Parent preview layer: orient around the selected child but flip 180° so nubs appear
  //   outside the parent center (matches Kando preview clusters)
  // - Active submenu layer: orient with the child's angle directly
  const grandAnglesPreviewByChild: number[][] = $derived(
    (item?.children ?? []).map((c: any, i: number): number[] => {
      const kids = c?.children ?? [];
      if (!kids.length) return [] as number[];
      const fixed = kids.map((n: any) => (n && n.angle != null ? { angle: n.angle } : {}));
      const pAng = (childAngles[i] + 180) % 360;
      return math.computeItemAngles(fixed as any, pAng);
    })
  );

  const grandDirsPreviewByChild = $derived(
    grandAnglesPreviewByChild.map((angles: number[]) => angles.map((ang: number) => math.getDirection(ang, 1.0)))
  );

  const grandAnglesActiveByChild: number[][] = $derived(
    (item?.children ?? []).map((c: any, i: number): number[] => {
      const kids = c?.children ?? [];
      if (!kids.length) return [] as number[];
      const fixed = kids.map((n: any) => (n && n.angle != null ? { angle: n.angle } : {}));
      const pAng = (childAngles[i] + 180) % 360; // reserve gap towards the parent (Kando)
      return math.computeItemAngles(fixed as any, pAng);
    })
  );

  const grandDirsActiveByChild = $derived(
    grandAnglesActiveByChild.map((angles: number[]) => angles.map((ang: number) => math.getDirection(ang, 1.0)))
  );

  // Positions not currently used in template; keep derived for parity
  const childPositions = $derived(childAngles.map((ang) => {
    const r = compact ? radiusPx * 0.65 : radiusPx;
    const d = math.getDirection(ang, r);
    return { x: center.x + d.x, y: center.y + d.y };
  }));

  const wedgeInfo = $derived(math.computeItemWedges(childAngles, parentAngle));
  const separatorAngles = $derived(
    wedgeInfo.parentWedge
      ? [...wedgeInfo.itemWedges.map((w: any) => w.start), wedgeInfo.parentWedge.start, wedgeInfo.parentWedge.end]
      : wedgeInfo.itemWedges.map((w: any) => w.start)
  );

  // When root is active and we are in click-up hover preview, move ONLY the hovered
  // child to the current pointer position instead of creating a second node.
  const movingPreviewIndex = 
    $derived(
      (pressedDragging && centerStateClasses === 'active' && pointer && hoveredIndex >= 0) 
        ? hoveredIndex 
        : -1
    );

  const childTransformStyles = 
    $derived(
      (item?.children ?? []).map((_c: any, i: number) => (i === movingPreviewIndex && pointer)
        ? `translate(${pointer.dx}px, ${pointer.dy}px)`
        : '')
    );

  // Do not force preview anchors with JS transforms; let theme CSS position via vars.
  const parentChildTransforms = 
    $derived((item?.children ?? []).map(() => ''));

  // Controlled hover: react to prop changes
  $effect(() => { hoveredIndex = hoverIndex; });

  // Recompute connector whenever relevant inputs change
  $effect(() => {
    // dependencies
    void hoveredIndex; void pointer; void center.x; void center.y; void radiusPx; void pressedDragging; void parentAngle; void childAngles; void pointerAngle; void centerStateClasses;
    updateConnector();
  });

</script>

{#snippet RenderGrandchildren({ index }: { index: number })}

  {#if (item?.children?.[index] as any)?.children?.length}

    {#if centerStateClasses === 'parent'}

      <!-- Show a single nub indicating this child has a submenu -->
      <PieItem 
        item={(item as any).children[index] as any}
        level={2}
        dirX={-childDirs[index].x}
        dirY={-childDirs[index].y}
        angle={(childAngles[index] + 180) % 360}
        siblingCount={1}
        parentAngle={(childAngles[index] + 180) % 360}
        stateClasses={'grandchild'}
        connectorStyle={''}
        angleDiff={null}
        dataPath={`/${index}`}
        dataLevel={2}
        layers={(layers as any) ?? [{ class: 'icon-layer' }]}
      />

    {:else}

      {#each grandAnglesPreviewByChild[index] as gAng, j}

        <PieItem 
          item={(item as any).children[index].children[j] as any}
          level={2}
          dirX={grandDirsPreviewByChild[index][j].x}
          dirY={grandDirsPreviewByChild[index][j].y}
          angle={gAng}
          siblingCount={(item as any).children[index].children.length}
          parentAngle={childAngles[index]}
          stateClasses={'grandchild'}
          connectorStyle={''}
          angleDiff={null}
          dataPath={`/${index}/${j}`}
          dataLevel={2}
          layers={(layers as any) ?? [{ class: 'icon-layer' }]}
        />

      {/each}

    {/if}

  {/if}

{/snippet}

{#snippet RenderChildren()}

  {#each item?.children ?? [] as c, i}

    {#if !(centerStateClasses === 'parent' && i === hoveredIndex)}

      <PieItem 
        item={c as any}
        level={1}
        dirX={childDirs[i].x}
        dirY={childDirs[i].y}
        angle={childAngles[i]}
        siblingCount={(item?.children ?? []).length}
        parentAngle={centerStateClasses === 'parent' ? childAngles[i] : undefined}
        stateClasses={(centerStateClasses === 'parent') ? `${childClassBase} ${i===hoveredIndex ? 'hovered' : ''}` : (childStates[i] ?? `${childClassBase} ${i===hoveredIndex ? 'hovered' : ''}`)}
        transformStyle={(centerStateClasses === 'active') ? childTransformStyles[i] : (centerStateClasses === 'parent' ? parentChildTransforms[i] : '')}
        connectorStyle={''}
        childDistancePx={centerStateClasses === 'parent' ? radiusPx : null}
        angleDiff={pointerAngle != null ? Math.min(Math.abs((childAngles[i] - pointerAngle) % 360), 360 - Math.abs((childAngles[i] - pointerAngle) % 360)) : null}
        dataPath={`/${i}`}
        dataLevel={1}
        layers={(centerStateClasses === 'parent') ? ([{ class: 'preview-anchor-layer', content: 'none' }] as any) : (layers as any) ?? [{ class: 'icon-layer' }]}
        below={(renderGrandchildren && centerStateClasses === 'parent' && (c as any)?.children?.length) ? RenderGrandchildren : null}
        belowIndex={i}
      />

    {/if}

  {/each}

{/snippet}

{#snippet RenderActiveCenter()}

  {#if hoveredIndex >= 0 && (item?.children?.[hoveredIndex] as any)?.children?.length}

    <PieItem 
      item={(item as any).children[hoveredIndex] as any}
      level={1}
      dirX={childDirs[hoveredIndex].x}
      dirY={childDirs[hoveredIndex].y}
      angle={childAngles[hoveredIndex]}
      siblingCount={(item?.children ?? []).length}
      parentAngle={undefined}
      stateClasses={'active'}
      connectorStyle={''}
      transformStyle={`translate(${childDirs[hoveredIndex].x * Math.max(radiusPx, 10 * ((item?.children ?? []).length))}px, ${childDirs[hoveredIndex].y * Math.max(radiusPx, 10 * ((item?.children ?? []).length))}px)`}
      childDistancePx={radiusPx}
      dataPath={`/${hoveredIndex}`}
      dataLevel={1}
      layers={(layers as any) ?? [{ class: 'icon-layer' }]}
      below={RenderActiveGrandchildren}
      belowIndex={hoveredIndex}
    />

  {/if}

{/snippet}

{#snippet RenderActiveGrandchildren({ index }: { index: number })}

  {#each (item as any).children[index].children ?? [] as gc, j}

    <PieItem 
      item={gc as any}
      level={2}
      dirX={grandDirsActiveByChild[index]?.[j]?.x ?? 0}
      dirY={grandDirsActiveByChild[index]?.[j]?.y ?? 0}
      angle={grandAnglesActiveByChild[index]?.[j] ?? 0}
      siblingCount={(item as any).children[index].children.length}
      parentAngle={childAngles[index]}
      stateClasses={'child'}
      connectorStyle={''}
      dataPath={`/${index}/${j}`}
      dataLevel={2}
      layers={(layers as any) ?? [{ class: 'icon-layer' }]}
    />

  {/each}

{/snippet}

{#snippet RenderParentBelow()}

  {@render RenderChildren()}
  {@render RenderActiveCenter()}

{/snippet}

{#snippet CenterContent()}

  {#if renderChildren && !drawChildrenBelow}
    {@render RenderChildren()}
  {/if}

  {#if centerStateClasses === 'parent' && !drawChildrenBelow}
    {@render RenderActiveCenter()}
  {/if}

  {#if drawCenterText && centerStateClasses === 'active'}

    <CenterText text={centerLabel} visible={!!centerLabel && hoverIndex !== -2} wrapWidth={centerTextWrapWidth ?? null} />

  {/if}

  <output aria-live="polite" aria-atomic="true" style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;">
    {centerLabel}
  </output>

{/snippet}

{#snippet ParentNubsContent()}{/snippet}

{#if centerReady}

<div class="pie-level" style={`--child-distance:${radiusPx}px;`}>

  {#if drawWedgeSeparators}
    <WedgeSeparators center={center} angles={separatorAngles} />
  {/if}

  <PieItem
    item={item as any}
    level={0}
    dirX={0}
    dirY={0}
    angle={0}
    siblingCount={(item?.children ?? []).length}
    stateClasses={centerStateClasses}
    pointerAngle={pointerAngle}
    hoverAngle={hoveredIndex >= 0 ? childAngles[hoveredIndex] : (parentAngle != null ? (parentAngle + 180) % 360 : null)}
    parentHovered={hoverIndex === -2}
    transformStyle={`translate(${center.x}px, ${center.y}px)`}
    childDistancePx={radiusPx}
    dataPath={'/'}
    dataLevel={0}
    layers={(layers as any) ?? [{ class: 'icon-layer' }]}
    connectorStyle={connectorStyle}
    below={drawChildrenBelow && renderChildren ? (centerStateClasses === 'parent' ? RenderParentBelow : RenderChildren) : null}
    content={CenterContent}
  />

  {#if drawSelectionWedges && hoveredIndex >= 0}
    <SelectionWedges center={center} wedge={wedgeInfo.itemWedges[hoveredIndex] ?? null} />
  {/if}

</div>

{:else}

<div class="pie-level" style="visibility:hidden;"></div>

{/if}

<style>

  .pie-level { position: relative; width: 100%; height: 100%; }
  
</style>

<script lang="ts">
  import type { MenuItem, Vec2 } from './types.js';
  // Uses Kando math for angles and directions
  // @ts-ignore
  import * as math from '@kando/common/math';
  import PieItem from './PieItem.svelte';
  import { createEventDispatcher } from 'svelte';
  import CenterText from './CenterText.svelte';

  // One-level PieMenu. Draws a ring at center with children around. Can render compact
  // (iconic) or regular (with labels). Transitions/animations to be added later.
  export let item: MenuItem;           // center item for this level
  export let center: Vec2 = { x: 0, y: 0 };
  export let radiusPx = 140;           // ring radius
  export let parentAngle: number | undefined = undefined; // gap direction
  export let compact = false;          // iconic vs regular
  // Controlled hover index from parent (PieTree)
  export let hoverIndex: number = -1;
  // Pointer state from parent (absolute and relative to this center)
  export let pointer: { clientX: number; clientY: number; dx: number; dy: number; angle: number; distance: number } | null = null;
  // Per-child state classes from PieTree (e.g., 'child hovered clicked dragged')
  export let childStates: string[] = [];
  $: pointerAngle = pointer ? pointer.angle : null;
  $: centerLabel = hoveredIndex >= 0 ? ((item?.children?.[hoveredIndex] as any)?.name ?? '') : '';
  // Allow parent/grandchild modes to mirror Kando selection chain across levels
  export let centerStateClasses: string = 'active';
  export let childClassBase: string = 'child';
  // Theme-driven layers (Kando MenuThemeDescription.layers)
  export let layers: { class: string; content?: 'icon'|'name'|'none' }[] | null = null;
  export let labelsEnabled: boolean = false;
  export let centerTextWrapWidth: number | null = null;
  export let drawChildrenBelow: boolean = false;
  export let renderGrandchildren: boolean = true; // allow parent preview to suppress nubs

  let childAngles: number[] = [];
  let childPositions: { x: number; y: number }[] = [];
  let separatorAngles: number[] = [];
  let hoveredIndex = -1;
  let connectorStyle = '';
  let wedgeInfo: { itemWedges: { start: number; end: number }[]; parentWedge?: { start: number; end: number } } = { itemWedges: [] };
  const dispatch = createEventDispatcher<{ hover: { index: number }, select: { index: number, item: any } }>();

  // Radii ---------------------------------------------------------------------------
  $: innerRadius = Math.max(30, radiusPx * 0.35);

  $: childAngles = math.computeItemAngles(
    (item?.children ?? []).map((c: any) => (c && c.angle != null ? { angle: c.angle } : {})),
    parentAngle
  );

  // Compute directions once for children so we can pass normalized dir vars and also
  // derive left/right/top/bottom classes consistently with Kando
  $: childDirs = childAngles.map((ang) => math.getDirection(ang, 1.0));

  // Grandchildren angles and directions per child (for nubs)
  $: grandAnglesByChild = (item?.children ?? []).map((c: any, i: number) => {
    const kids = c?.children ?? [];
    if (!kids.length) return [] as number[];
    const fixed = kids.map((n: any) => (n && n.angle != null ? { angle: n.angle } : {}));
    const pAng = (childAngles[i] + 180) % 360;
    return math.computeItemAngles(fixed as any, pAng);
  });
  $: grandDirsByChild = grandAnglesByChild.map((angles: number[]) => angles.map((ang) => math.getDirection(ang, 1.0)));

  $: childPositions = childAngles.map((ang) => {
    const r = compact ? radiusPx * 0.65 : radiusPx;
    const d = math.getDirection(ang, r);
    return { x: center.x + d.x, y: center.y + d.y };
  });

  $: separatorAngles = (() => {
    // Use Kando computeItemWedges to derive wedge starts and parent wedge bounds
    wedgeInfo = math.computeItemWedges(childAngles, parentAngle);
    const starts = wedgeInfo.itemWedges.map((w: any) => w.start);
    if (wedgeInfo.parentWedge) starts.push(wedgeInfo.parentWedge.start, wedgeInfo.parentWedge.end);
    return starts;
  })();

  // No explicit nub rendering: grandchildren appear as `.menu-node.grandchild` per theme

  // Controlled hover: react to prop changes
  $: hoveredIndex = hoverIndex;
  $: updateConnector();
  function updateConnector() {
    if (hoveredIndex < 0 || hoveredIndex >= childPositions.length) { connectorStyle = 'width:0px;'; return; }
    const p = childPositions[hoveredIndex];
    if (!p) { connectorStyle = 'width:0px;'; return; }
    const dx = p.x - center.x; const dy = p.y - center.y;
    const len = Math.sqrt(dx*dx + dy*dy);
    const ang = math.getAngle({ x: dx, y: dy }) - 90;
    // Root node is translated to center; connector rotates in local space
    connectorStyle = `width:${len}px; transform: rotate(${ang}deg);`;
  }
  
</script>

<!-- Snippets to render children and center content (Svelte 5) -->
{#snippet RenderGrandchildren({ index }: { index: number })}
  {#if (item?.children?.[index] as any)?.children?.length}
    {#each grandAnglesByChild[index] as gAng, j}
    <PieItem item={(item as any).children[index].children[j] as any}
               level={2}
               dirX={grandDirsByChild[index][j].x}
               dirY={grandDirsByChild[index][j].y}
               angle={gAng}
               siblingCount={(item as any).children[index].children.length}
               parentAngle={childAngles[index]}
               stateClasses={'grandchild'}
               connectorStyle={''}
               angleDiff={null}
               dataPath={`/${index}/${j}`}
               dataLevel={2}
               layers={(layers as any) ?? [{ class: 'icon-layer' }]}
               labelsEnabled={labelsEnabled} />
    {/each}
  {/if}
{/snippet}

{#snippet RenderChildren()}
  {#each item?.children ?? [] as c, i}
    <PieItem item={c as any}
             level={1}
             dirX={childDirs[i].x}
             dirY={childDirs[i].y}
             angle={childAngles[i]}
             siblingCount={(item?.children ?? []).length}
             parentAngle={parentAngle}
             stateClasses={childStates[i] ?? `${childClassBase} ${i===hoveredIndex ? 'hovered' : ''}`}
             connectorStyle={''}
             angleDiff={pointerAngle != null ? Math.min(Math.abs((childAngles[i] - pointerAngle) % 360), 360 - Math.abs((childAngles[i] - pointerAngle) % 360)) : null}
             dataPath={`/${i}`}
             dataLevel={1}
            layers={(layers as any) ?? [{ class: 'icon-layer' }]}
            labelsEnabled={labelsEnabled}
            below={renderGrandchildren ? RenderGrandchildren : null}
             belowIndex={i}
             />
  {/each}
{/snippet}

{#snippet CenterContent()}
  {#if !drawChildrenBelow}
    {@render RenderChildren()}
  {/if}
  <CenterText text={centerLabel} visible={!!centerLabel && hoverIndex !== -2} wrapWidth={centerTextWrapWidth ?? null} />
  <output aria-live="polite" aria-atomic="true" style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;">
    {centerLabel}
  </output>
{/snippet}

<div class="pie-level" style={`--child-distance:${radiusPx}px;`}>

  <PieItem item={item as any}
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
           labelsEnabled={labelsEnabled}
           connectorStyle={connectorStyle}
           below={drawChildrenBelow ? RenderChildren : null}
           content={CenterContent}
           >
    <!-- children injected via snippets defined above -->
  </PieItem>

</div>

<style>

  .pie-level { position: relative; width: 100%; height: 100%; }
  
</style>

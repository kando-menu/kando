<script lang="ts">
  import PieMenu from './PieMenu.svelte';
  import type { MenuItem, Vec2 } from './types.js';
  // @ts-ignore
  import * as math from '@kando/common/math';
  import { setContext } from 'svelte';
  import { PIE_TREE_CTX, type PieTreeContext } from './context.js';
  // Use our local shim that re-exports the Kando GestureDetector
  import { GestureDetector } from './gesture/gesture-detector.js';

  export let root: MenuItem;
  export let center: Vec2 = { x: 200, y: 200 };
  export let radiusPx = 140;
  export let settings: any = null; // pass Kando general settings (centerDeadZone, etc.)
  export let layers: ReadonlyArray<{ class: string; content?: 'icon' | 'name' | 'none' }>|null = null;
  export let centerTextWrapWidth: number | null = null;
  export let drawChildrenBelow: boolean = false;
  export let startPressed: boolean = false; // begin in pressed-static mode
  export let initialPointer: Vec2 | null = null; // client coordinates where press happened

  // selectionChain of indices from root (Kando-compatible concept)
  let chain: number[] = [];

  // Input state machine ---------------------------------------------------------------
  type Mode = 'idle' | 'pressed-static' | 'pressed-dragging' | 'hovering';
  let mode: Mode = 'idle';
  let pressPos: Vec2 | null = null;
  let hoverIndex: number = -1;
  const jitterThresholdPx = 2; // per user request
  let pointerAbs: Vec2 | null = null;
  let pointerRel = { dx: 0, dy: 0, angle: 0, distance: 0 };
  let childStates: string[] = [];
  let detector: GestureDetector | null = null;

  function distance(a: Vec2, b: Vec2): number {
    const dx = a.x - b.x, dy = a.y - b.y; return Math.hypot(dx, dy);
  }

  function levelItem(): any { return currentItem(); }

  function computeHoverIndex(client: Vec2, host: HTMLElement): number {
    const rect = host.getBoundingClientRect();
    const pos = { x: client.x - rect.left, y: client.y - rect.top };
    const rel = { x: pos.x - center.x, y: pos.y - center.y };
    const dead = Number(settings?.centerDeadZone ?? 50);
    if (Math.hypot(rel.x, rel.y) < dead) return -1;
    const angle = math.getAngle(rel);
    const children = levelItem()?.children ?? [];
    const angles = math.computeItemAngles(children.map((c: any) => (c && c.angle != null ? { angle: c.angle } : {})));
    const wedgeInfo = math.computeItemWedges(angles);
    for (let i = 0; i < wedgeInfo.itemWedges.length; i++) {
      const w = wedgeInfo.itemWedges[i];
      if (math.isAngleBetween(angle, w.start, w.end)) return i;
    }
    if (wedgeInfo.parentWedge && math.isAngleBetween(angle, wedgeInfo.parentWedge.start, wedgeInfo.parentWedge.end)) {
      return -2; // parent
    }
    return -1;
  }

  function onWindowPointerMove(e: PointerEvent) {
    if (mode === 'idle') return;
    const host = container as HTMLElement | null; if (!host) return;
    if (mode === 'pressed-static' && pressPos) {
      if (distance(pressPos, { x: e.clientX, y: e.clientY }) > jitterThresholdPx) {
        mode = 'pressed-dragging';
      }
    }
    const client = { x: e.clientX, y: e.clientY };
    const idx = computeHoverIndex(client, host);
    if (idx !== hoverIndex) hoverIndex = idx;
    // update child state classes like Kando
    const count = levelItem()?.children?.length ?? 0;
    childStates = Array.from({ length: count }, (_, i) => {
      const hovered = i === hoverIndex ? ' hovered' : '';
      const clicked = mode === 'pressed-static' && i === hoverIndex ? ' clicked' : '';
      const dragged = mode === 'pressed-dragging' && i === hoverIndex ? ' dragged' : '';
      return `child${hovered}${clicked}${dragged}`.trim();
    });
    pointerAbs = client;
    const rect = host.getBoundingClientRect();
    const pos = { x: client.x - rect.left, y: client.y - rect.top };
    const rel = { x: pos.x - center.x, y: pos.y - center.y };
    pointerRel = { dx: rel.x, dy: rel.y, angle: math.getAngle(rel), distance: Math.hypot(rel.x, rel.y) };

    // Feed gesture detector when dragging; use relative coords from center
    if (mode === 'pressed-dragging' && detector) {
      const coords = { x: rel.x, y: rel.y } as Vec2;
      console.log('[svelte-gesture] motion', coords);
      detector.onMotionEvent(coords);
    }
  }

  function onWindowPointerUp(e: PointerEvent) {
    if (detector) {
      console.log('[svelte-gesture] reset on pointerup');
      detector.reset();
    }
    if (mode === 'pressed-static') {
      // Decide click-up vs drag by jitter distance
      const releasePos = { x: e.clientX, y: e.clientY };
      const dist = pressPos ? distance(pressPos, releasePos) : 0;
      if (dist <= jitterThresholdPx) {
        // Click-up: enter hovering mode, keep current tracking
        mode = 'hovering';
      } else {
        // Treated as drag-selection on release
        if (hoverIndex >= 0) triggerSelect(hoverIndex);
        mode = 'idle';
      }
    } else if (mode === 'pressed-dragging') {
      // Release selects if over an item
      if (hoverIndex >= 0) triggerSelect(hoverIndex);
      mode = 'idle';
    } else if (mode === 'hovering') {
      // Second release triggers selection
      if (hoverIndex >= 0) triggerSelect(hoverIndex);
      mode = 'idle';
    }
    // clear clicked/dragged flags
    const count = levelItem()?.children?.length ?? 0;
    childStates = Array.from({ length: count }, (_, i) => `child ${i===hoverIndex ? 'hovered' : ''}`);
  }

  function triggerSelect(index: number) {
    const item = levelItem()?.children?.[index];
    if (!item) return;
    if (item.children?.length) {
      chain = [...chain, index];
    } else {
      const path = '/' + chain.concat(index).join('/');
      const name = item?.name;
      dispatchEvent(new CustomEvent('select', { detail: { path, item, name } }));
    }
  }

  let container: HTMLElement | null = null;
  let startedFromProp = false;
  function onPointerDown(e: PointerEvent) {
    pressPos = { x: e.clientX, y: e.clientY };
    mode = 'pressed-static';
    // start with nothing selected while inside dead zone
    hoverIndex = -1;
    const count = levelItem()?.children?.length ?? 0;
    childStates = Array.from({ length: count }, () => 'child');
    // Initialize or reconfigure gesture detector
    if (!detector) {
      detector = new GestureDetector();
      detector.on('selection', () => {
        console.log('[svelte-gesture] selection event');
        if (hoverIndex >= 0) triggerSelect(hoverIndex);
      });
    }
    if (settings) {
      detector.minStrokeLength = Number(settings.gestureMinStrokeLength ?? 150);
      detector.minStrokeAngle = Number(settings.gestureMinStrokeAngle ?? 20);
      detector.jitterThreshold = Number(settings.gestureJitterThreshold ?? 10);
      detector.pauseTimeout = Number(settings.gesturePauseTimeout ?? 100);
      detector.centerDeadZone = Number(settings.centerDeadZone ?? 50);
      detector.fixedStrokeLength = Number(settings.fixedStrokeLength ?? 0);
    }
  }

  // If the popup opens from an external pointerdown (on the canvas), start tracking
  // immediately in pressed-static mode using the provided initial pointer position.
  $: if (startPressed && !startedFromProp && container) {
    startedFromProp = true;
    if (initialPointer) {
      pressPos = { x: initialPointer.x, y: initialPointer.y };
      mode = 'pressed-static';
      // initialize with no selection
      hoverIndex = -1;
      const count = levelItem()?.children?.length ?? 0;
      childStates = Array.from({ length: count }, () => 'child');
      // Initialize pointerRel for connectors and center vars
      const rect = container.getBoundingClientRect();
      const pos = { x: initialPointer.x - rect.left, y: initialPointer.y - rect.top };
      const rel = { x: pos.x - center.x, y: pos.y - center.y };
      pointerRel = { dx: rel.x, dy: rel.y, angle: math.getAngle(rel), distance: Math.hypot(rel.x, rel.y) };
      pointerAbs = { ...initialPointer };
      if (!detector) {
        detector = new GestureDetector();
        detector.on('selection', () => {
          console.log('[svelte-gesture] selection event (startPressed)');
          if (hoverIndex >= 0) triggerSelect(hoverIndex);
        });
      }
      if (settings) {
        detector.minStrokeLength = Number(settings.gestureMinStrokeLength ?? 150);
        detector.minStrokeAngle = Number(settings.gestureMinStrokeAngle ?? 20);
        detector.jitterThreshold = Number(settings.gestureJitterThreshold ?? 10);
        detector.pauseTimeout = Number(settings.gesturePauseTimeout ?? 100);
        detector.centerDeadZone = Number(settings.centerDeadZone ?? 50);
        detector.fixedStrokeLength = Number(settings.fixedStrokeLength ?? 0);
      }
    }
  }

  // Provide PieTree context to descendants
  const ctx: PieTreeContext = {
    getChain: () => [...chain],
    getCenter: () => center,
    getRadius: () => radiusPx,
    getPointer: () => (pointerAbs ? { ...pointerRel } : null),
    hoverIndex: () => hoverIndex,
    select: (i: number) => triggerSelect(i),
    back: () => handleBack(),
    resolve: (path) => {
      let it: any = root;
      for (const idx of path) it = it?.children?.[idx];
      return it ?? null;
    }
  };
  setContext(PIE_TREE_CTX, ctx);
  function currentItem(): any {
    let it: any = root;
    for (const idx of chain) it = it?.children?.[idx];
    return it;
  }

  function handleSelectLevel(e: CustomEvent<{ index: number; item: any }>) {
    const { index, item } = e.detail;
    if (item?.children?.length) {
      chain = [...chain, index];
    } else {
      // Leaf selection - emit out for host app
      const path = '/' + chain.concat(index).join('/');
      const name = item?.name;
      dispatchEvent(new CustomEvent('select', { detail: { path, item, name } }));
    }
  }

  function handleBack() {
    if (chain.length) chain = chain.slice(0, -1);
  }
</script>

<div class="pie-tree" bind:this={container} on:pointerdown={onPointerDown}
     style={`--fade-in-duration:${settings?.fadeInDuration ?? 150}ms; --fade-out-duration:${settings?.fadeOutDuration ?? 200}ms;`}>
  <!-- Parent levels in iconic mode -->
  {#if chain.length}
    <PieMenu item={root} center={center} radiusPx={radiusPx} compact={true} hoverIndex={-1}
             centerStateClasses={'parent'} childClassBase={'grandchild'} layers={layers}
             centerTextWrapWidth={centerTextWrapWidth} />
  {/if}

  <!-- Tip level expanded; controlled by PieTree and fed pointer state -->
  {#key chain.join(',')}
  <PieMenu item={currentItem()} center={center} radiusPx={radiusPx}
           hoverIndex={hoverIndex}
           childStates={childStates}
           pointer={pointerAbs ? { clientX: pointerAbs.x, clientY: pointerAbs.y, ...pointerRel } : null}
           layers={layers}
           drawChildrenBelow={drawChildrenBelow}
           centerTextWrapWidth={centerTextWrapWidth}
           on:select={handleSelectLevel} />
  {/key}
</div>

<style>
  .pie-tree { position: relative; width: 100%; height: 100%; }
</style>

<svelte:window on:pointermove={onWindowPointerMove} on:pointerup={onWindowPointerUp} />



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
  // Control whether label layers (name text) are rendered at all. Defaults off to avoid any flash.
  export let labelsEnabled: boolean = false;
  export let startPressed: boolean = false; // begin in pressed-static mode
  export let initialPointer: Vec2 | null = null; // client coordinates where press happened
  // Optional: targeting for context-sensitive menus
  export let initialTarget: unknown = undefined;
  export let resolveTarget: ((currentTarget: unknown, item: any) => unknown) | null = null;

  // selectionChain of indices from root (Kando-compatible concept)
  let chain: number[] = [];

  // Input state machine ---------------------------------------------------------------
  type Mode = 'idle' | 'pressed-static' | 'pressed-dragging' | 'hovering';
  let mode: Mode = 'idle';
  let pressPos: Vec2 | null = null;
  let pressedButton: number | null = null; // 0=left, 1=middle, 2=right, 3=x1, 4=x2
  let hoverIndex: number = -1;
  const jitterThresholdPx = 2; // micro jitter filter only; click-vs-drag uses settings.dragThreshold
  let pointerAbs: Vec2 | null = null;
  let pointerRel = { dx: 0, dy: 0, angle: 0, distance: 0 };
  let childStates: string[] = [];
  let detector: GestureDetector | null = null;
  let tipMenu: any = null;
  // Track modifiers and target stack for context callbacks
  let lastMods = { ctrl: false, alt: false, shift: false, meta: false };
  const targetStack: unknown[] = [];
  
  // Function-based callbacks (no DOM events)
  export let onSelect: ((ev: { kind: 'select' }, pieTree: PieTreeContext, pieMenu: { getItem(): any; getIndexPath(): number[]; getCenter(): Vec2; getRadius(): number }, pieItem: { getItem(): any; getIndex(): number; getPath(): string; getData(): unknown } | null) => void) | null = null;
  export let onCancel: ((ev: { kind: 'cancel' }, pieTree: PieTreeContext) => void) | null = null;

  // Unified context-based callbacks (optional)
  type Mods = { ctrl: boolean; alt: boolean; shift: boolean; meta: boolean };
  type PointerCtx = { clientX: number; clientY: number; dx: number; dy: number; distance: number; angle: number; button: 0|1|2|3|4; mods: Mods; source: 'mouse'|'touch'|'keyboard'|'gamepad'; key?: string; code?: string; repeat?: boolean; location?: number };
  type PieCtx = { center: { x:number;y:number }; radius: number; chain: number[]; hoverIndex: number };
  type MenuCtx = { item: any; indexPath: number[] };
  type ItemCtx = { item: any; index: number; path: string; name?: string; data?: unknown; id?: string };
  type BaseCtx = { kind: 'open'|'close'|'cancel'|'hover'|'path-change'|'mark-start'|'mark-update'|'mark-select'|'turbo-start'|'turbo-end'|'select'; time: number; pointer: PointerCtx; pie: PieCtx; menu: MenuCtx; target: unknown; targetRoot?: unknown; targetStack?: unknown[] };
  type SelectCtx = BaseCtx & { kind: 'select'; item: ItemCtx };
  type HoverCtx = BaseCtx & { kind: 'hover'; item?: ItemCtx };
  type PathCtx = BaseCtx & { kind: 'path-change'; op: 'push'|'pop'; item?: ItemCtx };
  type MarkCtx = BaseCtx & { kind: 'mark-start'|'mark-update'|'mark-select' };
  type OpenCloseCtx = BaseCtx & { kind: 'open'|'close'|'cancel' };
  export let onOpenCtx: ((ctx: OpenCloseCtx) => void) | null = null;
  export let onCloseCtx: ((ctx: OpenCloseCtx) => void) | null = null;
  export let onCancelCtx: ((ctx: OpenCloseCtx) => void) | null = null;
  export let onHoverCtx: ((ctx: HoverCtx) => void) | null = null;
  export let onPathChangeCtx: ((ctx: PathCtx) => void) | null = null;
  export let onMarkCtx: ((ctx: MarkCtx) => void) | null = null;
  export let onSelectCtx: ((ctx: SelectCtx) => void) | null = null;

  function distance(a: Vec2, b: Vec2): number {
    const dx = a.x - b.x, dy = a.y - b.y; return Math.hypot(dx, dy);
  }

  function levelItem(): any { return currentItem(); }

  function getChainItemNames(path: number[] = chain): string[] {
    const names: string[] = [];
    let it: any = root;
    for (const idx of path) {
      const child = it?.children?.[idx];
      names.push(child?.name ?? `#${idx}`);
      it = child;
    }
    return names;
  }

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
      if (math.isAngleBetween(angle, w.start, w.end)) {
        console.log('[pie-tree:hover-hit]', { angle: Number(angle.toFixed(1)), index: i, wedge: { start: Number(w.start.toFixed(1)), end: Number(w.end.toFixed(1)) }, chain, chainNames: getChainItemNames() });
        return i;
      }
    }
    if (wedgeInfo.parentWedge && math.isAngleBetween(angle, wedgeInfo.parentWedge.start, wedgeInfo.parentWedge.end)) {
      return -2; // parent
    }
    return -1;
  }

  function onWindowPointerMove(e: PointerEvent) {
    if (mode === 'idle') return;
    const host = container as HTMLElement | null; if (!host) return;
    const dragThreshold = Number(settings?.dragThreshold ?? 15);
    if (mode === 'pressed-static' && pressPos && pressedButton === 0) {
      const dFromPress = distance(pressPos, { x: e.clientX, y: e.clientY });
      if (dFromPress > dragThreshold) {
        mode = 'pressed-dragging';
        console.log('[pie-tree:state] enter dragging (dist=%d > %d)', dFromPress, dragThreshold);
      }
    }
    const client = { x: e.clientX, y: e.clientY };
    lastMods = { ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey };
    const rect = host.getBoundingClientRect();
    const pos = { x: client.x - rect.left, y: client.y - rect.top };
    const rel = { x: pos.x - center.x, y: pos.y - center.y };
    const dead = Number(settings?.centerDeadZone ?? 50);
    const distCenter = Math.hypot(rel.x, rel.y);
    const idx = computeHoverIndex(client, host);
    if (idx !== hoverIndex) {
      hoverIndex = idx; console.log('[pie-tree:move] mode=%s idx=%d distCenter=%d dead=%d chain=%s', mode, idx, Math.round(distCenter), dead, getChainItemNames().join(' > '));
      const itemCtx = idx >= 0 ? buildItemCtx(idx) : undefined;
      onHoverCtx?.(buildBaseCtx('hover', itemCtx));
    }
    // update child state classes like Kando
    const count = levelItem()?.children?.length ?? 0;
    childStates = Array.from({ length: count }, (_, i) => {
      const hovered = i === hoverIndex ? ' hovered' : '';
      const clicked = mode === 'pressed-static' && i === hoverIndex ? ' clicked' : '';
      const dragged = mode === 'pressed-dragging' && i === hoverIndex ? ' dragged' : '';
      return `child${hovered}${clicked}${dragged}`.trim();
    });
    pointerAbs = client;
    pointerRel = { dx: rel.x, dy: rel.y, angle: math.getAngle(rel), distance: Math.hypot(rel.x, rel.y) };

    // Feed gesture detector when dragging; use relative coords from center
    if (mode === 'pressed-dragging' && detector && pressedButton === 0) {
      const coords = { x: rel.x, y: rel.y } as Vec2;
      console.log('[svelte-gesture] motion', coords);
      detector.onMotionEvent(coords);
      onMarkCtx?.(buildBaseCtx('mark-update'));
    }
  }

  function onWindowPointerUp(e: PointerEvent) {
    console.log('[pie-tree:up] mode=%s button=%s', mode, String(pressedButton));
    if (detector && pressedButton === 0) {
      console.log('[svelte-gesture] reset on pointerup');
      detector.reset();
    }
    if (pressedButton !== 0) {
      pressedButton = null; mode = 'idle'; return;
    }
    if (mode === 'pressed-static') {
      // Decide click-up vs drag by jitter distance
      const releasePos = { x: e.clientX, y: e.clientY };
      const dist = pressPos ? distance(pressPos, releasePos) : 0;
      const dragThreshold = Number(settings?.dragThreshold ?? 15);
      if (dist <= dragThreshold) {
        // Click-up: enter hovering mode, keep current tracking
        mode = 'hovering';
        console.log('[pie-tree:click] click-up -> hovering (dist=%d <= %d)', dist, dragThreshold);
      } else {
        // Treated as drag-selection on release
        console.log('[pie-tree:drag] release (dist=%d > %d)', dist, dragThreshold);
        if (hoverIndex >= 0) triggerSelect(hoverIndex);
        mode = 'idle';
      }
    } else if (mode === 'pressed-dragging') {
      // Release selects if over an item
      console.log('[pie-tree:drag] release in dragging');
      if (hoverIndex >= 0) triggerSelect(hoverIndex);
      mode = 'idle';
    } else if (mode === 'hovering') {
      // Second release triggers selection
      console.log('[pie-tree:hover] release selects');
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
      // Enter submenu: notify path-change and update target stack
      console.log('[pie-tree:select] submenu index=%d name=%s', index, item?.name);
      onPathChangeCtx?.(buildBaseCtx('path-change', buildItemCtx(index), 'push'));
      const currentTarget = targetStack.length ? targetStack[targetStack.length - 1] : initialTarget;
      const newTarget = resolveTarget ? resolveTarget(currentTarget, item) : undefined;
      targetStack.push(newTarget !== undefined ? newTarget : currentTarget);
      chain = [...chain, index];
      console.log('[pie-tree:chain-push]', { chain, chainNames: getChainItemNames(), current: currentItem()?.name, children: currentItem()?.children?.length ?? 0 });
      // Immediately recompute hover/child state for the new level so tracking continues
      if (container && pointerAbs) {
        const idxNew = computeHoverIndex({ x: pointerAbs.x, y: pointerAbs.y }, container);
        hoverIndex = idxNew;
        const count = levelItem()?.children?.length ?? 0;
        childStates = Array.from({ length: count }, (_, i) => {
          const hovered = i === hoverIndex ? ' hovered' : '';
          const clicked = mode === 'pressed-static' && i === hoverIndex ? ' clicked' : '';
          const dragged = mode === 'pressed-dragging' && i === hoverIndex ? ' dragged' : '';
          return `child${hovered}${clicked}${dragged}`.trim();
        });
        // Refresh pointerRel for connectors relative to same center
        const rect = container.getBoundingClientRect();
        const pos = { x: pointerAbs.x - rect.left, y: pointerAbs.y - rect.top };
        const rel = { x: pos.x - center.x, y: pos.y - center.y };
        pointerRel = { dx: rel.x, dy: rel.y, angle: math.getAngle(rel), distance: Math.hypot(rel.x, rel.y) };
        console.log('[pie-tree:submenu-ready]', { hoverIndex, count, pointerRel });
      }
    } else {
      // Leaf select: call both legacy and ctx-based callbacks
      console.log('[pie-tree:select] leaf index=%d name=%s', index, item?.name);
      onSelect?.({ kind: 'select' }, ({} as any), tipMenu, null);
      onSelectCtx?.(buildBaseCtx('select', buildItemCtx(index)) as any);
      mode = 'idle';
      pressedButton = null;
      if (detector) detector.reset();
      onCloseCtx?.(buildBaseCtx('close'));
    }
  }

  let container: HTMLElement | null = null;
  let startedFromProp = false;
  function onPointerDown(e: PointerEvent) {
    console.log('[pie-tree] pointerdown', { button: e.button });
    pressedButton = e.button;
    // RMB closes or selects parent like Kando
    if (pressedButton === 2) {
      if (settings?.rmbSelectsParent && chain.length) {
        console.log('[pie-tree] RMB -> back');
        handleBack();
      } else {
        console.log('[pie-tree] RMB -> cancel');
        onCancel?.({ kind: 'cancel' }, ctx);
        onCancelCtx?.(buildBaseCtx('cancel'));
        onCloseCtx?.(buildBaseCtx('close'));
      }
      return;
    }
    // Mouse back button selects parent
    if (pressedButton === 3) {
      console.log('[pie-tree] X1/back -> back');
      handleBack();
      return;
    }
    if (pressedButton !== 0) return; // only left button starts selection
    pressPos = { x: e.clientX, y: e.clientY };
    if (mode === 'idle') {
      mode = 'pressed-static';
      lastMods = { ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey };
      if (targetStack.length === 0) targetStack.push(initialTarget);
      // start with nothing selected while inside dead zone
      hoverIndex = -1;
      const count = levelItem()?.children?.length ?? 0;
      childStates = Array.from({ length: count }, () => 'child');
      onOpenCtx?.(buildBaseCtx('open'));
    } else {
      // keep current mode (hovering/dragging)
      lastMods = { ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey };
    }
    // Initialize or reconfigure gesture detector
    if (!detector) {
      detector = new GestureDetector();
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
      console.log('[pie-tree:start] startPressed with initialPointer', initialPointer);
      pressPos = { x: initialPointer.x, y: initialPointer.y };
      mode = 'pressed-static';
      pressedButton = 0;
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
      if (targetStack.length === 0) targetStack.push(initialTarget);
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
      onOpenCtx?.(buildBaseCtx('open'));
    }
  }

  // Log when chain changes for easier tracing of submenu push/pop
  $: (function(){
    const name = currentItem()?.name;
    console.log('[pie-tree:chain]', { chain, chainNames: getChainItemNames(), current: name, children: currentItem()?.children?.length ?? 0 });
  })();

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
  function parentItem(): any {
    if (!chain.length) return null;
    let it: any = root;
    for (let i = 0; i < chain.length - 1; i++) it = it?.children?.[chain[i]];
    return it;
  }

  // Angle (direction) from parent to the selected child in the previous level
  function selectedChildAngleFromParent(): number | null {
    if (!chain.length) return null;
    const parent = parentItem();
    const sel = chain[chain.length - 1];
    const kids = parent?.children ?? [];
    const fixed = kids.map((c: any) => (c && c.angle != null ? { angle: c.angle } : {}));
    const angs = math.computeItemAngles(fixed as any);
    const ang = angs?.[sel];
    return typeof ang === 'number' ? ang : null;
  }

  function handleBack() {
    if (chain.length) {
      const lastIndex = chain[chain.length - 1];
      console.log('[pie-tree:back] pop level from index', lastIndex);
      onPathChangeCtx?.(buildBaseCtx('path-change', buildItemCtx(lastIndex), 'pop'));
      chain = chain.slice(0, -1);
      targetStack.pop();
    }
  }

  function onWindowKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      console.log('[pie-tree:key] Escape -> cancel');
      onCancel?.({ kind: 'cancel' }, ctx);
      onCancelCtx?.(buildBaseCtx('cancel'));
      onCloseCtx?.(buildBaseCtx('close'));
      return;
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      console.log('[pie-tree:key] %s -> back', e.key);
      handleBack();
      return;
    }
  }

  // Context builders
  function now(): number { return Date.now(); }
  function buildPointerCtx(): any {
    return {
      clientX: pointerAbs?.x ?? 0,
      clientY: pointerAbs?.y ?? 0,
      dx: pointerRel.dx, dy: pointerRel.dy,
      distance: pointerRel.distance,
      angle: pointerRel.angle,
      button: (pressedButton ?? 0),
      mods: { ...lastMods },
      source: 'mouse'
    };
  }
  function buildPieCtx(): any { return { center, radius: radiusPx, chain: [...chain], hoverIndex }; }
  function buildMenuCtx(): any { return { item: currentItem(), indexPath: [...chain] }; }
  function buildItemCtx(index: number): any {
    const it = levelItem()?.children?.[index];
    const idxPath = chain.concat(index);
    return { item: it, index, path: '/' + idxPath.join('/'), name: it?.name, data: (it as any)?.data, id: (it as any)?.data?.id };
  }
  function buildBaseCtx(kind: any, item?: any, op?: 'push'|'pop'): any {
    const base: any = {
      kind, time: now(), pointer: buildPointerCtx(), pie: buildPieCtx(), menu: buildMenuCtx(),
      target: targetStack.length ? targetStack[targetStack.length - 1] : initialTarget,
      targetRoot: initialTarget,
      targetStack: [...targetStack]
    };
    if (kind === 'select' && item) return { ...base, item };
    if (kind === 'hover') return { ...base, item };
    if (kind === 'path-change') return { ...base, op, item };
    return base;
  }
</script>

<div class="pie-tree" bind:this={container} on:pointerdown|stopPropagation={onPointerDown} on:contextmenu|preventDefault role="application"
     style={`--fade-in-duration:${settings?.fadeInDuration ?? 150}ms; --fade-out-duration:${settings?.fadeOutDuration ?? 200}ms;`}>
  <!-- Parent levels in iconic mode -->
  {#if chain.length}
    <PieMenu item={parentItem()} center={center} radiusPx={radiusPx} compact={true}
             hoverIndex={chain[chain.length - 1]}
             centerStateClasses={'parent'} childClassBase={'grandchild'} layers={(layers as any)}
             centerTextWrapWidth={centerTextWrapWidth}
             labelsEnabled={labelsEnabled}
             renderGrandchildren={false}
             drawChildrenBelow={true} />
  {/if}

  <!-- Tip level expanded; controlled by PieTree and fed pointer state -->
  {#key chain.join(',')}
  <PieMenu bind:this={tipMenu} item={currentItem()} center={center} radiusPx={radiusPx}
           hoverIndex={hoverIndex}
           childStates={childStates}
           pointer={pointerAbs ? { clientX: pointerAbs.x, clientY: pointerAbs.y, ...pointerRel } : null}
           layers={(layers as any)}
           labelsEnabled={labelsEnabled}
           drawChildrenBelow={drawChildrenBelow}
           centerTextWrapWidth={centerTextWrapWidth} />
  {/key}
</div>

<style>
  .pie-tree { position: absolute; inset: 0; width: 100%; height: 100%; }
</style>

<svelte:window on:pointermove={onWindowPointerMove} on:pointerup={onWindowPointerUp} on:keydown={onWindowKeyDown} />



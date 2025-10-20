<script lang="ts">
  
  import PieMenu from './PieMenu.svelte';
  
  import type { MenuItem, Vec2 } from '../types.js';
  // @ts-ignore
  import * as math from '@kando/common/math';
  import { setContext } from 'svelte';
  import { PIE_TREE_CTX, type PieTreeContext } from '../context.js';
  import { GestureDetector } from '../gesture-detector.ts';

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
  // Input state machine
  type Mode = 'idle' | 'pressed-static' | 'pressed-dragging' | 'hovering';
  
  const {
    root,
    center: centerProp = { x: 200, y: 200 } as Vec2,
    radiusPx = 140,
    settings = null as any,
    layers = null as (ReadonlyArray<{ class: string; content?: 'icon' | 'name' | 'none' }>|null),
    centerTextWrapWidth = null as (number | null),
    drawChildrenBelow = false,
    drawCenterText = true,
    drawSelectionWedges = false,
    drawWedgeSeparators = false,
    // Control whether label layers (name text) are rendered at all. Defaults off to avoid any flash.
    // labelsEnabled removed; themes control label visibility via layers
    startPressed = false,
    initialPointer = null as (Vec2 | null),
    // Optional: targeting for context-sensitive menus
    initialTarget = undefined as unknown,
    resolveTarget = null as ((currentTarget: unknown, item: any) => unknown) | null,
    // No legacy onSelect/onCancel support
    onOpenCtx = null as ((ctx: OpenCloseCtx) => void) | null,
    onCloseCtx = null as ((ctx: OpenCloseCtx) => void) | null,
    onCancelCtx = null as ((ctx: OpenCloseCtx) => void) | null,
    onHoverCtx = null as ((ctx: HoverCtx) => void) | null,
    onPathChangeCtx = null as ((ctx: PathCtx) => void) | null,
    onMarkCtx = null as ((ctx: MarkCtx) => void) | null,
    onSelectCtx = null as ((ctx: SelectCtx) => void) | null,
  } = $props<{
    root: MenuItem;
    center?: Vec2;
    radiusPx?: number;
    settings?: any;
    layers?: ReadonlyArray<{ class: string; content?: 'icon' | 'name' | 'none' }>|null;
    centerTextWrapWidth?: number | null;
    drawChildrenBelow?: boolean;
    drawCenterText?: boolean;
    drawSelectionWedges?: boolean;
    drawWedgeSeparators?: boolean;
    startPressed?: boolean;
    initialPointer?: Vec2 | null;
    initialTarget?: unknown;
    resolveTarget?: ((currentTarget: unknown, item: any) => unknown) | null;
    onOpenCtx?: ((ctx: OpenCloseCtx) => void) | null;
    onCloseCtx?: ((ctx: OpenCloseCtx) => void) | null;
    onCancelCtx?: ((ctx: OpenCloseCtx) => void) | null;
    onHoverCtx?: ((ctx: HoverCtx) => void) | null;
    onPathChangeCtx?: ((ctx: PathCtx) => void) | null;
    onMarkCtx?: ((ctx: MarkCtx) => void) | null;
    onSelectCtx?: ((ctx: SelectCtx) => void) | null;
  }>();

  // Local mutable mirror of center for re-anchoring during submenu open
  let centerRef: Vec2 = $state({ ...centerProp });
  // selectionChain of indices from root (Kando-compatible concept)
  let chain: number[] = $state([]);
  let mode: Mode = $state('idle');
  let pressPos: Vec2 | null = $state(null);
  let pressedButton: number | null = $state(null); // 0=left, 1=middle, 2=right, 3=x1, 4=x2
  let hoverIndex: number = $state(-1);
  const jitterThresholdPx = 2; // micro jitter filter only; click-vs-drag uses settings.dragThreshold
  let pointerAbs: Vec2 | null = $state(null);
  let pointerRel = $state({ dx: 0, dy: 0, angle: 0, distance: 0 });
  let childStates: string[] = $state([]);
  let detector: GestureDetector | null = $state(null);
  let isPressedDragging = $state(false); // expose to PieMenu to control preview behavior
  let lastInDeadZone = $state(true);      // debug: track exits from dead zone
  // Track modifiers and target stack for context callbacks
  let lastMods = $state({ ctrl: false, alt: false, shift: false, meta: false });
  const targetStack: unknown[] = $state([]);
  let container: HTMLElement | null = $state(null);
  let startedFromProp = $state(false);
  // Debug logging
  const LOG = true;                 // master switch
  const VERBOSE_HOVER = false;      // set true to log every wedge hit-test

  // Provide PieTree context to descendants
  const ctx: PieTreeContext = {
    getChain: () => [...chain],
    getCenter: () => centerRef,
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

  function log(tag: string, data?: any) {
    if (!LOG) return;
    if (data !== undefined) console.log(`[pie-track:${tag}]`, data);
    else console.log(`[pie-track:${tag}]`);
  }

  function distance(a: Vec2, b: Vec2): number {
    const dx = a.x - b.x, dy = a.y - b.y; return Math.hypot(dx, dy);
  }

  function levelItem(): any { 
    return currentItem(); 
  }

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
    const rel = { x: pos.x - centerRef.x, y: pos.y - centerRef.y };
    const dead = Number(settings?.centerDeadZone ?? 50);

    if (Math.hypot(rel.x, rel.y) < dead) return -1;

    const angle = math.getAngle(rel);
    const children = levelItem()?.children ?? [];
    const angles = math.computeItemAngles(children.map((c: any) => (c && c.angle != null ? { angle: c.angle } : {})));
    const wedgeInfo = math.computeItemWedges(angles);

    for (let i = 0; i < wedgeInfo.itemWedges.length; i++) {
      const w = wedgeInfo.itemWedges[i];
      if (math.isAngleBetween(angle, w.start, w.end)) {
        if (VERBOSE_HOVER) console.log('[pie-tree:hover-hit]', { angle: Number(angle.toFixed(1)), index: i, wedge: { start: Number(w.start.toFixed(1)), end: Number(w.end.toFixed(1)) }, chain, chainNames: getChainItemNames() });
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
        log('state', { enter: 'pressed-dragging', dist: Math.round(dFromPress), threshold: dragThreshold });
        isPressedDragging = true;
      }
    }

    const client = { x: e.clientX, y: e.clientY };
    lastMods = { ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey };
    const rect = host.getBoundingClientRect();
    const pos = { x: client.x - rect.left, y: client.y - rect.top };
    const rel = { x: pos.x - centerRef.x, y: pos.y - centerRef.y };
    const dead = Number(settings?.centerDeadZone ?? 50);
    const distCenter = Math.hypot(rel.x, rel.y);
    const nowInDeadZone = distCenter < dead;

    if (lastInDeadZone && !nowInDeadZone) {
      console.log('[BREAK:exit-dead]', { mode, distCenter: Math.round(distCenter), dead });
    }

    lastInDeadZone = nowInDeadZone;
    const idx = computeHoverIndex(client, host);

    // Always-evaluated breakpoint hooks (every move):
    // trigger when inside a wedge and sufficiently far from the inactive center disk
    {
      const triggerAt = dead + 100;
      if (idx >= 0 && distCenter >= triggerAt) {
        console.log('[BREAK:active-depth]', {
          index: idx,
          angle: Number(math.getAngle(rel).toFixed(1)),
          distCenter: Math.round(distCenter),
          triggerAt: Math.round(triggerAt)
        });
      }
    }

    if (idx !== hoverIndex) {

      if (hoverIndex === -1 && idx >= 0) {
        // Fire only after we are outside the child ring (approx radiusPx) by a small margin
        const childCount = levelItem()?.children?.length ?? 0;
        const childRadius = Math.max(radiusPx, 10 * childCount);
        const triggerAt = childRadius + 20;
        if (distCenter >= triggerAt) {
          console.log('[BREAK:enter-active-wedge]', { index: idx, angle: Number(math.getAngle(rel).toFixed(1)), distCenter: Math.round(distCenter), triggerAt: Math.round(triggerAt) });
        }
      }

      if (hoverIndex === -1 && idx === -2) {
        const childCount = levelItem()?.children?.length ?? 0;
        const childRadius = Math.max(radiusPx, 10 * childCount);
        const triggerAt = childRadius + 20;
        if (distCenter >= triggerAt) {
          console.log('[BREAK:enter-parent-wedge]', { angle: Number(math.getAngle(rel).toFixed(1)), distCenter: Math.round(distCenter), triggerAt: Math.round(triggerAt) });
        }
      }

      hoverIndex = idx;
      log('hover-change', { mode, index: idx, pointerAngle: Number(math.getAngle({ x: rel.x, y: rel.y }).toFixed(1)), distCenter: Math.round(distCenter), dead, chain: getChainItemNames() });
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
      log('gesture-motion', coords);
      detector.onMotionEvent(coords);
      onMarkCtx?.(buildBaseCtx('mark-update'));
    }

  }

  function onWindowPointerUp(e: PointerEvent) {

    log('pointerup', { mode, button: String(pressedButton) });

    if (detector && pressedButton === 0) {
      log('gesture-reset');
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
        log('state', { enter: 'hovering', dist, threshold: dragThreshold });
      
      } else {
      
        // Treated as drag-selection on release
        log('drag-release', { dist, threshold: dragThreshold });
        if (hoverIndex >= 0) triggerSelect(hoverIndex);
        mode = 'idle';
      
      }

    } else if (mode === 'pressed-dragging') {

      // Release selects if over an item
      log('drag-release');

      if (hoverIndex >= 0) triggerSelect(hoverIndex);

      mode = 'idle';
      isPressedDragging = false;

    } else if (mode === 'hovering') {

      // Second release triggers selection
      log('hover-release-select');

      if (hoverIndex >= 0) triggerSelect(hoverIndex);

      mode = 'idle';
      isPressedDragging = false;

    }

    // clear clicked/dragged flags
    const count = 
      levelItem()?.children?.length ?? 0;
    childStates = 
      Array.from({ length: count }, (_, i) => `child ${i===hoverIndex ? 'hovered' : ''}`);

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
      
      // Do not re-anchor center; active submenu will translate relative to fixed center
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
        const rel = { x: pos.x - centerRef.x, y: pos.y - centerRef.y };
        pointerRel = { dx: rel.x, dy: rel.y, angle: math.getAngle(rel), distance: Math.hypot(rel.x, rel.y) };
        console.log('[pie-tree:submenu-ready]', { hoverIndex, count, pointerRel });
      }
      
    } else {

      // Leaf select: ctx-based only
      console.log('[pie-tree:select] leaf index=%d name=%s', index, item?.name);
      onSelectCtx?.(buildBaseCtx('select', buildItemCtx(index)) as any);
      mode = 'idle';
      pressedButton = null;

      if (detector) detector.reset();

      onCloseCtx?.(buildBaseCtx('close'));

    }
  }

  function onPointerDown(e: PointerEvent) {

    log('pointerdown', { button: e.button, at: { x: e.clientX, y: e.clientY }, chain: getChainItemNames() });

    pressedButton = e.button;
    
    // RMB closes or selects parent like Kando
    if (pressedButton === 2) {

      if (settings?.rmbSelectsParent && chain.length) {

        log('rmb-back');
        handleBack();
      
      } else {

        log('rmb-cancel');
        onCancelCtx?.(buildBaseCtx('cancel'));
        onCloseCtx?.(buildBaseCtx('close'));
      
      }
      
      return;
    }

    // Mouse back button selects parent
    if (pressedButton === 3) {

      log('mouse-back-button');
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
      log('open');
      isPressedDragging = false;
    
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

  function angleFromActiveToParent(): number | null {
    const childFromParent = selectedChildAngleFromParent();
    if (childFromParent == null) return null;
    return (childFromParent + 180) % 360;
  }

  function handleBack() {
    if (chain.length) {
      const lastIndex = chain[chain.length - 1];
      log('back', { fromIndex: lastIndex });
      onPathChangeCtx?.(buildBaseCtx('path-change', buildItemCtx(lastIndex), 'pop'));
      chain = chain.slice(0, -1);
      targetStack.pop();
      // keep center fixed; no re-anchor
    }
  }

  function onWindowKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      log('key', { key: 'Escape', action: 'cancel' });
      onCancelCtx?.(buildBaseCtx('cancel'));
      onCloseCtx?.(buildBaseCtx('close'));
      return;
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      log('key', { key: e.key, action: 'back' });
      handleBack();
      return;
    }
  }

  // Context builders

  function now(): number { 
    return Date.now();
  }

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
  
  function buildPieCtx(): any {
    return { center: centerRef, radius: radiusPx, chain: [...chain], hoverIndex }; 
  }
  
  function buildMenuCtx(): any {
    return { item: currentItem(), indexPath: [...chain] };
  }
  
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

  // If the popup opens from an external pointerdown (on the canvas), start tracking
  // immediately in pressed-static mode using the provided initial pointer position.
  $effect(() => { 

    if (startPressed && !startedFromProp && container) {
      startedFromProp = true;

      if (initialPointer) {
        
        log('startPressed', initialPointer);
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
        const rel = { x: pos.x - centerRef.x, y: pos.y - centerRef.y };
        pointerRel = { dx: rel.x, dy: rel.y, angle: math.getAngle(rel), distance: Math.hypot(rel.x, rel.y) };
        pointerAbs = { ...initialPointer };

        if (targetStack.length === 0) targetStack.push(initialTarget);

        if (!detector) {

          detector = new GestureDetector();
          detector.on('selection', () => {
            log('gesture-select(startPressed)');
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
        log('open');

      }

    }

  });

  // Log when chain changes for easier tracing of submenu push/pop
  $effect(() => {

    const name = currentItem()?.name;
    log('chain', { chain, chainNames: getChainItemNames(), current: name, children: currentItem()?.children?.length ?? 0 });
    
  });

  setContext(PIE_TREE_CTX, ctx);

</script>

<div 
  class="pie-tree" bind:this={container} onpointerdown={(e)=>{ e.stopPropagation(); onPointerDown(e); }} oncontextmenu={(e)=>{ e.preventDefault(); }} role="application"
  style={`--fade-in-duration:${settings?.fadeInDuration ?? 150}ms; --fade-out-duration:${settings?.fadeOutDuration ?? 200}ms;`}>

  {#key chain.join(',')}

    <!-- Single nested tree model: always render one PieMenu rooted at the parent level.
         When chain is empty, parent==root and no active child is nested. When chain is non-empty,
         parent is the previous item and active child is nested under it by PieMenu itself. -->
    <PieMenu
      item={chain.length === 0 ? root : parentItem()}
      center={centerRef}
      radiusPx={radiusPx}
      hoverIndex={chain.length === 0 ? hoverIndex : chain[chain.length - 1]}
      activeHoverIndex={chain.length === 0 ? -1 : hoverIndex}
      pressedDragging={isPressedDragging}
      childStates={childStates}
      pointer={pointerAbs ? { clientX: pointerAbs.x, clientY: pointerAbs.y, ...pointerRel } : null}
      layers={(layers as any)}
      drawChildrenBelow={drawChildrenBelow}
      drawCenterText={drawCenterText}
      drawSelectionWedges={drawSelectionWedges}
      drawWedgeSeparators={drawWedgeSeparators}
      centerTextWrapWidth={centerTextWrapWidth}
      centerStateClasses={chain.length === 0 ? 'active' : 'parent'}
      childClassBase={chain.length === 0 ? 'child' : 'grandchild'}
      renderChildren={true}
      parentPreviewItem={chain.length === 0 ? null : parentItem()}
      showParentLink={false}
    />

  {/key}

</div>

<svelte:window
  onpointermove={onWindowPointerMove} 
  onpointerup={onWindowPointerUp} 
  onkeydown={onWindowKeyDown}
/>

<style>

  .pie-tree { position: fixed; inset: 0; width: 100vw; height: 100vh; pointer-events: none; }

</style>

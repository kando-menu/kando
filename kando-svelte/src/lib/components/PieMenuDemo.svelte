<script lang="ts">
  import type { MenuItem, MenuThemeDescription, ShowMenuOptions, Vec2 } from '../types.js';
  import { createEventDispatcher, onMount } from 'svelte';
  import KandoWrapper from './KandoWrapper.svelte';
  import { fetchThemeJson, injectThemeCss, applyThemeColors } from '../theme-loader.js';
  // Import from monorepo alias during dev; fallback relative if alias not resolved at type time
  // @ts-ignore
  import * as math from '@kando/common/math';

  const {
    root,
    theme = null as (MenuThemeDescription | null),
    settings = null as any, // Kando general settings (centerDeadZone, minParentDistance, etc.)
    options = {} as Partial<ShowMenuOptions>,
    themeDirUrl = null as (string | null),
    themeId = null as (string | null),
  } = $props<{
    root: MenuItem;
    theme?: MenuThemeDescription | null;
    settings?: any;
    options?: Partial<ShowMenuOptions>;
    themeDirUrl?: string | null;
    themeId?: string | null;
  }>();

  let themeLocal: MenuThemeDescription | null = $state(null);
  const themeEffective = $derived(theme ?? themeLocal);

  const dispatch = createEventDispatcher<{
    select: { path: string; item: MenuItem };
    cancel: void;
    hover: { path: string };
    unhover: { path: string };
  }>();

  let linkEl: HTMLLinkElement | null = null;
  let container: HTMLElement | null = null;
  let center: Vec2 = $state({ x: 0, y: 0 });
  let radiusPx = $state(0);
  let hoveredIndex: number = $state(-1);
  let childAngles: number[] = $state([]);
  let childWedges: { start: number; end: number }[] = $state([]);
  let parentWedgeAngles: { start: number; end: number } | null = $state(null);
  let childPositions: { x: number; y: number }[] = $state([]);
  let nodeEls: HTMLDivElement[] = [];
  let separatorAngles: number[] = $state([]);
  let parentCenterAngle: number | null = $state(null);
  let currentItem: MenuItem | null = $state(null);
  let chain: Array<{ item: MenuItem; angle?: number; index?: number }> = $state([]);
  const centerLabel = $derived(hoveredIndex >= 0
    ? ((currentItem as any)?.children?.[hoveredIndex] as any)?.name
    : (hoveredIndex === -2 ? 'parent' : 'center'));
  const nodeStyles = $derived(childPositions.map((p, i) => {
    const style = `left:${p.x}px; top:${p.y}px; transform: translate(-50%, -50%);`;
    try {
      const ang = childAngles[i] ?? NaN;
      const rt = math.getAngle({ x: p.x - center.x, y: p.y - center.y });
      console.log(`[pie] draw-node #${i} ${(currentItem?.children?.[i] as any)?.name} angle=${ang?.toFixed?.(1)}° rt=${rt.toFixed(1)}° px=${p.x.toFixed(1)} py=${p.y.toFixed(1)}`);
    } catch {}
    return style;
  }));
  let lastHoveredPath: string | null = null;
  const debug = true;
  const deadZonePx = $derived(Number(settings?.centerDeadZone ?? (options as any)?.centerDeadZone ?? 50));

  // Wrapper demo state
  let wrapperBox: HTMLDivElement | null = null;
  const defaultGeneralSettings: any = {
    fadeInDuration: 120,
    fadeOutDuration: 120,
    enableMarkingMode: true,
    enableTurboMode: true,
    hoverModeNeedsConfirmation: false,
    gestureMinStrokeLength: 150,
    gestureMinStrokeAngle: 20,
    gestureJitterThreshold: 10,
    gesturePauseTimeout: 100,
    fixedStrokeLength: 0,
    centerDeadZone: 50,
    enableGamepad: false,
    minParentDistance: 150,
    gamepadBackButton: 1,
    gamepadCloseButton: 2,
    warpMouse: false,
    keepInputFocus: false,
    hideSettingsButton: true,
    settingsButtonPosition: 'bottom-right',
    soundTheme: 'none',
    soundVolume: 0.5
  };
  const menuSettings = $derived(settings ?? defaultGeneralSettings);
  let wrapperOptions: ShowMenuOptions = $state({
    mousePosition: { x: 0, y: 0 },
    windowSize: { x: 0, y: 0 },
    zoomFactor: 1,
    centeredMode: false,
    anchoredMode: false,
    hoverMode: false,
    systemIconsChanged: false
  } as any);

  onMount(() => {
    (async () => {
      if (!themeEffective && themeDirUrl && themeId) {
        try {
          themeLocal = await fetchThemeJson(themeDirUrl, themeId);
        } catch (e) {
          console.error(e);
        }
      }

      if (themeEffective) {
        linkEl = injectThemeCss(themeEffective);
        if (themeEffective.colors) applyThemeColors(themeEffective.colors);
      }

      // Compute initial center and child layout for the root menu
      computeCenter();
      computeRadius();
      setCenterItem(root);
    })();

    const ro = new ResizeObserver(() => {
      computeCenter();
      computeRadius();
      // Recompute layout for current item
      computeLayout(currentItem ?? root, getParentAngleFor(currentItem));
    });
    if (container) ro.observe(container);

    const roWrap = new ResizeObserver(() => {
      if (!wrapperBox) return;
      const r = wrapperBox.getBoundingClientRect();
      wrapperOptions = {
        ...(wrapperOptions as any),
        windowSize: { x: Math.round(r.width), y: Math.round(r.height) },
        mousePosition: { x: Math.round(r.width / 2), y: Math.round(r.height / 2) }
      } as any;
    });
    if (wrapperBox) roWrap.observe(wrapperBox);

    return () => {
      if (linkEl) linkEl.remove();
      ro.disconnect();
      roWrap.disconnect();
    };
  });

  function handleSelect(path: string, item: MenuItem) {
    dispatch('select', { path, item });
  }

  function computeCenter() {
    if (!container) return;
    const r = container.getBoundingClientRect();
    center = { x: r.width / 2, y: r.height / 2 };
  }

  function computeRadius() {
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    const containerLimit = Math.min(w, h) / 2 - 20;
      const desired = Number(settings?.minParentDistance ?? (themeEffective as any)?.maxMenuRadius ?? 150);
    radiusPx = Math.min(containerLimit, desired);
  }

  function computeLayout(item: MenuItem | null, parentAngle?: number) {
    if (!item?.children?.length) {
      childAngles = [];
      childWedges = [];
      return;
    }
    // Align with Kando: sanitize fixed angles first, then compute angles with parent gap
    const temp = (item.children as any[]).map((c) =>
      c && c.angle != null ? { angle: c.angle as number } : ({})
    );
    try {
      const rawFixed = (item.children as any[]).map((c) => ('angle' in (c||{}) && (c as any).angle != null) ? (c as any).angle : null);
      console.log('[pie] angles:raw', { parentAngle, rawFixed });
    } catch {}
    math.fixFixedAngles(temp);
    try {
      const fixedAfter = temp.map((t) => ('angle' in t ? (t as any).angle ?? null : null));
      console.log('[pie] angles:fixed', { parentAngle, fixedAfter });
    } catch {}
    childAngles = math.computeItemAngles(temp as any, parentAngle);
    try {
      console.log('[pie] angles:children', { parentAngle, childAngles: [...childAngles] });
    } catch {}
    // Precompute absolute positions from angles; used directly for drawing
    childPositions = childAngles.map((ang) => {
      const d = math.getDirection(ang, radiusPx);
      return { x: Math.round(center.x + d.x), y: Math.round(center.y + d.y) };
    });

    const wedgeInfo = math.computeItemWedges(childAngles, parentAngle);
    childWedges = wedgeInfo.itemWedges;
    parentWedgeAngles = wedgeInfo.parentWedge ?? null;
    parentCenterAngle = parentWedgeAngles ? (parentWedgeAngles.start + parentWedgeAngles.end) / 2 : null;
    // Build separator angles: one at the start of each child wedge plus parent wedge bounds
    separatorAngles = childWedges.map((w) => w.start);

    if (parentWedgeAngles) {
      separatorAngles.push(parentWedgeAngles.start, parentWedgeAngles.end);
    }

    try {
      const wedges = childWedges.map((w) => `${w.start.toFixed(1)}–${w.end.toFixed(1)}`);
      const parentWedge = parentWedgeAngles ? `${parentWedgeAngles.start.toFixed(1)}–${parentWedgeAngles.end.toFixed(1)}` : null;
      console.log('[pie] angles:wedges', { parentAngle, wedges, parentWedge });
    } catch {}

    try {
      const names = (item.children as any[]).map((c) => (c ? c.name : ''));
      const vectors = childAngles.map((ang) => math.getDirection(ang, radiusPx));
      const roundTripAngles = vectors.map((d) => math.getAngle(d));
      const posStr = childPositions
        .map((p, i) => `#${i}:${names[i]} a=${childAngles[i].toFixed(1)}° rt=${roundTripAngles[i].toFixed(1)}° px=${p.x.toFixed(1)} py=${p.y.toFixed(1)}`)
        .join(' | ');
      const fixedStr = temp.map((t) => ('angle' in t ? (t as any).angle : null)).join(',');
      console.log(
        `[pie] layout item=${(item as any).name} parent=${parentAngle?.toFixed?.(1)} center=(${center.x.toFixed(1)},${center.y.toFixed(1)}) radius=${radiusPx.toFixed(1)} fixed=[${fixedStr}] angles=[${childAngles
          .map((a) => a.toFixed(1))
          .join(', ')}] -> ${posStr}`
      );
      if (parentWedgeAngles) {
        console.log(
          `[pie] parentWedge start=${parentWedgeAngles.start.toFixed(1)} end=${parentWedgeAngles.end.toFixed(1)}`
        );
      }
    } catch {}

    // After DOM updates, measure actual node positions and compare angles.
    try {
      requestAnimationFrame(() => requestAnimationFrame(() => logDomPositions('after-layout')));
    } catch {}
  }

  function setCenterItem(item: MenuItem, via?: { angle?: number; index?: number }) {
    currentItem = item;
    computeLayout(currentItem, getParentAngleFor(currentItem));

    try {
      console.log('[pie] setCenterItem', {
        name: (item as any).name,
        chain: chain.map((c) => ({ name: (c.item as any).name, angle: c.angle, index: c.index })),
      });
    } catch {}
  }

  function getParentAngleFor(item: MenuItem | null): number | undefined {
    if (!item) return undefined;
    if (chain.length === 0) return undefined; // root

    const top = chain[chain.length - 1];
    if (top.item === item) {
      return top.angle != null ? (top.angle + 180) % 360 : undefined;
    }

    // If item is below top, use its stored angle in the chain
    const entry = chain.find((c) => c.item === item);
    const val = entry?.angle != null ? (entry.angle + 180) % 360 : undefined;
    console.log('[pie] parentAngleFor', { item: (item as any).name, val, chain: chain.map((c)=>({name:(c.item as any).name, angle:c.angle}))});
    return val;
  }

  function onPointerMove(e: PointerEvent | MouseEvent) {
    if (!container) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pos: Vec2 = { x: e.clientX - r.left, y: e.clientY - r.top };
    const rel: Vec2 = { x: pos.x - center.x, y: pos.y - center.y };

    const distance = math.getDistance({ x: 0, y: 0 }, rel);
    const angle = math.getAngle(rel);

    // Dead zone around center uses config default (50px) unless overridden
    const dead = (options as any)?.centerDeadZone ?? 50;
    if (distance < dead) {
      updateHover(-1);
      return;
    }

    // Hit test wedges
    let idx = -1;
    for (let i = 0; i < childWedges.length; i++) {
      const w = childWedges[i];
      if (math.isAngleBetween(angle, w.start, w.end)) {
        idx = i; break;
      }
    }

    // If no child wedge matched, check the parent wedge (back area)
    let zone: 'child' | 'parent' | 'center' = 'child';
    if (idx === -1) {
      if (parentWedgeAngles && math.isAngleBetween(angle, parentWedgeAngles.start, parentWedgeAngles.end)) {
        idx = -2; // special value for parent/back wedge
        zone = 'parent';
      } else {
        zone = 'center';
      }
    }

    {
      const w = idx >= 0 ? childWedges[idx] : (idx === -2 ? parentWedgeAngles : null);
      console.log('[pie] pointer', { pos, rel, angle: Math.round(angle), match: idx, zone, wedge: w });
    }
    updateHover(idx);
  }

  function updateHover(idx: number) {
    if (idx === hoveredIndex) return;
    const path = idx >= 0 ? `/${idx}` : (idx === -2 ? '/parent' : '/');
    if (lastHoveredPath && lastHoveredPath !== path) dispatch('unhover', { path: lastHoveredPath });
    hoveredIndex = idx;
    lastHoveredPath = path;
    dispatch('hover', { path });

    try {
      const angle = idx >= 0 ? childAngles[idx] : (idx === -2 ? (getParentAngleFor(currentItem) ?? null) : null);
      const name = idx >= 0 ? (currentItem?.children?.[idx] as any)?.name : (idx === -2 ? 'parent' : 'center');
      console.log('[pie] hover→', { idx, angle, name });
    } catch {}
  }

  function onClick() {
    if (hoveredIndex < 0) {
      // Click center: go to parent if possible
      if (chain.length > 0) {
        chain.pop();
        const newCenter = chain.length > 0 ? chain[chain.length - 1].item : root;
        setCenterItem(newCenter);
      }
      return;
    }
    const item = currentItem?.children?.[hoveredIndex];
    if (!item) return;

    const angle = childAngles[hoveredIndex];
    // If leaf → dispatch select; if submenu → push and open
    if ((item as any).children?.length) {
      chain.push({ item: item as MenuItem, angle, index: hoveredIndex });
      setCenterItem(item as MenuItem);
      updateHover(-1);
    } else {
      try { console.log('[pie] select', { path: `${pathOfCurrent()}/${hoveredIndex}`, name: (item as any).name, angle }); } catch {}
      handleSelect(`${pathOfCurrent()}/${hoveredIndex}`, item as MenuItem);
    }
  }

  function pathOfCurrent(): string {
    if (chain.length === 0) return '';
    return '/' + chain.map((c) => String(c.index ?? 0)).join('/');
  }

  // Reactive: rebuild inline styles whenever positions/center change
  

  function parentMarkerStyle() {
    if (parentCenterAngle == null) return '';
    const d = math.getDirection(parentCenterAngle, radiusPx);
    const xi = center.x + d.x;
    const yi = center.y + d.y;
    return `left:${xi}px; top:${yi}px; transform: translate(-50%, -50%);`;
  }

  function parentNodeStyle() {
    return parentMarkerStyle();
  }

  function logDomPositions(tag: string) {
    if (!container || !currentItem?.children?.length) return;
    const rect = container.getBoundingClientRect();
    const rows: string[] = [];
    nodeEls.slice(0, currentItem.children.length).forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2 - rect.left;
      const cy = r.top + r.height / 2 - rect.top;
      const ang = math.getAngle({ x: cx - center.x, y: cy - center.y });
      const expected = childAngles[i] ?? NaN;
      const name = (currentItem?.children?.[i] as any)?.name;
      rows.push(`#${i}:${name} exp=${expected?.toFixed?.(1)}° dom=${ang.toFixed(1)}° cx=${cx.toFixed(1)} cy=${cy.toFixed(1)}`);
    });
    console.log(`[pie] dom-positions ${tag} -> ${rows.join(' | ')}`);
  }

  // Best-effort icon URL guesser for non-font themes (e.g., file or system); in Electron
  // Kando resolves via icon themes. For the demo, try a few common locations by convention.
  function guessIconUrl(theme: string | undefined, icon: string | undefined): string {
    if (!theme || !icon) return '';
    // Simple heuristic: look in static assets shipped with the demo
    // e.g., /kando/icon-themes/<theme>/<icon>.svg
    const base = '/kando/icon-themes';
    const file = icon.endsWith('.svg') ? icon : `${icon}.svg`;
    return `${base}/${theme}/${file}`;
  }

  // Labels: upright, no rotation

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); return; }
    if (e.key === 'Escape') { e.preventDefault(); hoveredIndex = -1; if (chain.length>0) { chain.pop(); setCenterItem(chain.length? chain[chain.length-1].item : root); } }
  }

</script>

<!-- Kando Wrapper (Native Kando inside Svelte) -------------------------------------- -->
<section class="demo-block">
  <h3>KandoWrapper (native Kando renderer)</h3>
  <div class="wrapper-host" bind:this={wrapperBox}>
    {#if themeEffective}
      <KandoWrapper
        root={root}
        settings={menuSettings}
        theme={themeEffective}
        colors={themeEffective.colors ?? {}}
        options={wrapperOptions}
        visible={true}
        onSelect={(path) => dispatch('select', { path, item: root })}
        onHover={(path) => dispatch('hover', { path })}
        onUnhover={(path) => dispatch('unhover', { path })}
        onCancel={() => dispatch('cancel')}
      />
    {:else}
      <div class="placeholder">Load a theme to run the native Kando renderer.</div>
    {/if}
  </div>
</section>

<button class="kando-pie-menu" bind:this={container} type="button" onpointermove={onPointerMove} onclick={onClick} onkeydown={onKeydown} aria-label="Pie menu preview">
  {#if currentItem?.children?.length}
    <div class="center-label" style={`left:${center.x}px; top:${center.y}px;`}>
      {centerLabel}
    </div>
  {/if}

  {#if currentItem?.children?.length}

    <div class="ring" style={`left:${center.x}px; top:${center.y}px; width:${radiusPx*2}px; height:${radiusPx*2}px; margin-left:-${radiusPx}px; margin-top:-${radiusPx}px;`}></div>
  
    <div class="center-disk" style={`left:${center.x}px; top:${center.y}px; width:${deadZonePx*2}px; height:${deadZonePx*2}px; margin-left:-${deadZonePx}px; margin-top:-${deadZonePx}px;`}></div>
  
    {#if separatorAngles.length}
      {#each separatorAngles as a}
        <div class="wedge-edge" style={`left:${center.x}px; top:${center.y}px; height:${radiusPx}px; transform: rotate(${a - 180}deg);`}></div>
      {/each}
    {/if}
  
    {#if parentCenterAngle != null}
      <div class={`node ${hoveredIndex===-2 ? 'hovered' : ''}`} style={parentNodeStyle()}>
        <div class="label">parent</div>
        <div class="dot"></div>
        <div class="deg">{Math.round(parentCenterAngle)}°</div>
      </div>
    {/if}
  
    {#each currentItem.children as c, i (c.name)}

      <div class={`node ${i===hoveredIndex ? 'hovered' : ''}`} bind:this={nodeEls[i]} style={nodeStyles[i]}>
        <div class="label">{c.name}</div>
        <div class="dot"></div>
        <div class="deg">{Math.round(childAngles[i])}°</div>
      </div>

    {/each}

  {/if}

</button>

<style>

  .demo-block { margin-bottom: 24px; }
  .demo-block h3 { margin: 0 0 8px 0; font-size: 14px; font-weight: 600; }
  .wrapper-host { position: relative; width: 100%; height: 300px; border: 1px dashed rgba(0,0,0,0.2); border-radius: 6px; overflow: hidden; }
  .kando-pie-menu { position: relative; width: 100%; height: 100%; background: none; border: 0; padding: 0; cursor: default; }
  .placeholder { opacity: 0.6; font-size: 14px; padding: 8px; }
  .ring { position: absolute; width: 280px; height: 280px; margin-left:-140px; margin-top:-140px; border-radius: 50%; border: 2px dashed #aaa; pointer-events: none; z-index: 3; }
  .center-disk { position: absolute; border-radius: 50%; background: rgba(0,0,0,0.05); pointer-events: none; z-index: 1; }
  .node { position: absolute; left: 0; top: 0; display: grid; place-items: center; text-align: center; z-index: 4; }
  .node .dot { width: 20px; height: 20px; border-radius: 50%; background: #bfbfbf; border: 2px solid #d9d9d9; z-index: 1; display: grid; place-items: center; }
  .node .label { margin-bottom: 6px; font-size: 12px; color: #000; white-space: nowrap; z-index: 2; }
  .node.hovered .dot { background: var(--accent-strong, #ff6); }
  .wedge-edge { position: absolute; width: 0; border-left: 2px dashed rgba(127,127,127,0.6); transform-origin: 0 0; pointer-events: none; z-index: 0; }
  .center-label { position: absolute; transform: translate(-50%, -50%); font-size: 22px; font-weight: 700; color: #000; pointer-events: none; }

</style>

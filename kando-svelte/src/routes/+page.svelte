<script lang="ts">

  import { onMount, tick } from 'svelte';
  import JSON5 from 'json5';
  import { applyThemeColors, injectThemeCss } from '../lib/theme-loader.ts';
  import * as math from '../../../src/common/math/index.ts';
  import type { MenuThemeDescription } from '../lib/types.ts';
  import type { MenuSettingsV1, MenuV1 } from '../../../src/common/settings-schemata/menu-settings-v1.ts';
  import { GENERAL_SETTINGS_SCHEMA_V1 } from '../../../src/common/settings-schemata/general-settings-v1.js';
  import { MENU_SETTINGS_SCHEMA_V1 } from '../../../src/common/settings-schemata/menu-settings-v1.js';
  import MenuOutline from '../lib/components/MenuOutline.svelte';
  import PieMenuDemo from '../lib/components/PieMenuDemo.svelte';
  import PieMenu from '../lib/components/PieMenu.svelte';
  import PieTree from '../lib/components/PieTree.svelte';

  let config: Record<string, unknown> | null = null;
  let menuSettings: MenuSettingsV1 | null = null;
  let theme: MenuThemeDescription | null = null;
  let availableThemes: Array<{ id: string; name?: string }> = [];
  let selectedThemeId: string = 'default';
  let availableMenus: Array<{ index: number; name: string; shortcutID: string }> = [];
  let selectedMenuIndex = 0;
  let error: string | null = null;
  let firstRoot: any = null;
  let mathPreview: { angles?: number[]; wedges?: { start: number; end: number }[] } = {};
  let popupOpen = false;
  let popupCenter = { x: 0, y: 0 };
  let popupRadius = 140;
  let popupStartPressed = false;
  let popupInitialPointer: { x: number; y: number } | null = null;
  let popupTarget: unknown = null;
  let targetArea: HTMLElement | null = null;
  let logLines: string[] = [];
  let logRef: HTMLPreElement | null = null;
  let autoScroll = true;
  let currentItem: any = null; // browsing cursor
  let chain: Array<{ item: any; index?: number; angle?: number }> = [];

  onMount(async () => {
    console.log('[demo] onMount start');
    try {
      const rawConfig = await getJSON('/kando/config.json');
      const parsedConfig = GENERAL_SETTINGS_SCHEMA_V1.safeParse(rawConfig);
      if (parsedConfig.success) { config = parsedConfig.data as any; }
      else { console.warn('[demo] config invalid', parsedConfig.error.issues); }

      const rawMenus = await getJSON<MenuSettingsV1>('/kando/menus.json');
      const parsedMenus = MENU_SETTINGS_SCHEMA_V1.safeParse(rawMenus);
      if (parsedMenus.success) { 
        menuSettings = parsedMenus.data; 
      } else {
        console.warn('[demo] menus invalid', (parsedMenus as any).error?.issues);
        menuSettings = rawMenus as any; // fall back to raw for demo flexibility
      }
      availableMenus = (menuSettings?.menus ?? []).map((m: any, i: number): { index: number; name: string; shortcutID: string } => ({ index: i, name: (m as any).root?.name ?? `Menu ${i+1}`, shortcutID: (m as any).shortcutID ?? '' }));
      selectedMenuIndex = 0;
      firstRoot = menuSettings?.menus?.[selectedMenuIndex]?.root ?? null;
      currentItem = firstRoot;
      // load theme list (demo only)
      try {
        const list = await getJSON<{ themes: { menu: Array<{ id: string; name?: string }>, sound: any, icon: any } }>('/api/themes');
        availableThemes = list.themes.menu;
      } catch {}

      const themeId = selectedThemeId || 'default';
      const themeJson = await getJSON5<any>(`/kando/menu-themes/${themeId}/theme.json5`);
      // Relax typing: theme.layers accepts 'none' as content
      theme = { ...(themeJson as any), id: themeId, directory: '/kando/menu-themes' } as any;
      console.log('[demo] theme loaded', theme?.id, theme?.name, 'layers', theme?.layers.length);
      // inject theme for demo page
      if (theme) {
        injectThemeCss(theme);
        applyThemeColors(theme.colors);
        // Only mark icons ready after icon fonts are actually loaded (or a conservative timeout).
        try {
          const htmlEl = document.documentElement;
          htmlEl.classList.remove('kando-icons-ready');
          const fontPromises: Promise<any>[] = [];
          if ('fonts' in document) {
            // Try common families used by themes; ignore rejections.
            fontPromises.push((document as any).fonts.load('1em "Material Symbols Rounded"'));
            fontPromises.push((document as any).fonts.load('1em "simple-icons"'));
            // Also wait for the full FontFaceSet to settle.
            fontPromises.push((document as any).fonts.ready);
          }
          // Fall back to a timeout if the FontFaceSet API is not available or takes too long.
          await Promise.race([
            Promise.allSettled(fontPromises),
            new Promise((resolve) => setTimeout(resolve, 1500))
          ]);
          htmlEl.classList.add('kando-icons-ready');
        } catch {}
      }

      // math quick-test: compute angles/wedges for the first menu with children
      const firstMenu = (menuSettings?.menus as any[])?.find((m: any) => (m as any).root?.children?.length);
      const children = firstMenu?.root?.children ?? [];
      const angles = math.computeItemAngles(children as any);
      const wedges = math.computeItemWedges(angles).itemWedges;
      mathPreview = { angles, wedges };
    } catch (e) {
      error = (e as Error).message;
      console.error('[demo] load error', e);
    } finally {
      console.log('[demo] onMount end');
    }
  });

  function onLogScroll() {
    if (!logRef) return;
    autoScroll = (logRef.scrollTop + logRef.clientHeight) >= (logRef.scrollHeight - 8);
  }

  async function addLog(line: string) {
    logLines = [...logLines, line];
    await tick();
    if (autoScroll && logRef) {
      logRef.scrollTop = logRef.scrollHeight;
    }
  }

  async function getJSON<T>(path: string): Promise<T> {
    console.log('[demo] fetch JSON', path);
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    const data = await res.json();
    console.log('[demo] loaded JSON', path);
    return data as T;
  }

  async function getJSON5<T>(path: string): Promise<T> {
    console.log('[demo] fetch JSON5', path);
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    const text = await res.text();
    console.log('[demo] loaded JSON5 text', path, `${text.length} chars`);
    return JSON5.parse(text);
  }

  function openPopupAt(clientX: number, clientY: number) {
    // Use viewport coordinates and clamp away from edges similar to Kando's maxMenuRadius
    let x = clientX, y = clientY;
    const vw = window.innerWidth, vh = window.innerHeight;
    const pad = Math.max(0, Math.min(popupRadius, (theme?.maxMenuRadius as any) ?? popupRadius));
    x = Math.min(vw - pad, Math.max(pad, x));
    y = Math.min(vh - pad, Math.max(pad, y));
    popupCenter = { x: Math.round(x) + 0.5, y: Math.round(y) + 0.5 };
    popupOpen = true;
    popupStartPressed = true;
    popupInitialPointer = { x: clientX, y: clientY };
    currentItem = chain.length ? chain[chain.length-1].item : firstRoot;
  }

  function onCanvasDown(e: PointerEvent) {
    // Suppress native context menu for RMB so we can use it as a trigger in browser
    if (popupOpen) {
      // If a pie is already open, ignore background clicks to avoid re-centering/sliding
      return;
    }
    if (e.button === 2) {
      e.preventDefault();
    }
    popupTarget = e.target as unknown;
    openPopupAt(e.clientX, e.clientY);
    // Mark open immediately for notifier
    addLog('[open] popup');
  }

  function logBase(tag: string, ctx: any) {
    const line = `[${tag}] t=${new Date(ctx.time).toLocaleTimeString()} chain=${ctx.pie.chain.join('/') || '/'} hover=${ctx.pie.hoverIndex} btn=${ctx.pointer.button} mods=${ctx.pointer.mods.ctrl?'C':''}${ctx.pointer.mods.alt?'A':''}${ctx.pointer.mods.shift?'S':''}${ctx.pointer.mods.meta?'M':''}${ctx.item?` path=${ctx.item.path}`:''}`;
    console.log(`[demo:${tag}]`, ctx);
    addLog(line);
  }
  function onOpenCtx(ctx: any) {
    logBase('open', ctx);
  }

  function onCloseCtx(ctx: any) {
    logBase('close', ctx);
    popupOpen = false;
    chain = [];
  }

  function onCancelCtx(ctx: any) {
    logBase('cancel', ctx);
    popupOpen = false;
    chain = [];
  }

  function onHoverCtx(ctx: any) {
    logBase('hover', ctx);
  }

  function onPathChangeCtx(ctx: any) {
    logBase(`path-${ctx.op}`, ctx);
  }

  function onMarkCtx(ctx: any) {
    logBase(ctx.kind, ctx);
  }

  function onSelectCtx(ctx: any) {
    const line = `[select] path=${ctx.item?.path} name=${ctx.item?.name ?? ''} id=${ctx.item?.id ?? ''}`;
    console.log('[demo:select]', ctx);
    addLog(line);
  }

  // Optional target resolver (symbolic)
  function resolveTarget(current: unknown, item: any): unknown {
    const data = (item as any)?.data;
    if (data && typeof data === 'object') {
      if ((data as any).target !== undefined) return (data as any).target;
      if ((data as any).targetId) return { id: (data as any).targetId };
    }
    return current;
  }

</script>

{#if error}
  <p style="color: red">{error}</p>
{/if}

{#if firstRoot}

  <h2>Kando Svelte Pie Menu Demo</h2>

  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div bind:this={targetArea} style="position:relative; width: 100%; max-width: 100%; height: 500px; background: #f3f3f3;" oncontextmenu={(e)=>{ e.preventDefault(); }} role="application" onpointerdown={onCanvasDown} tabindex="0" aria-label="Pie menu target">

    {#if popupOpen}
      <PieTree root={firstRoot} center={popupCenter} radiusPx={popupRadius} settings={config}
                layers={theme?.layers ?? null} centerTextWrapWidth={theme?.centerTextWrapWidth ?? null}
                drawCenterText={theme?.drawCenterText ?? true}
                drawChildrenBelow={!!theme?.drawChildrenBelow}
                startPressed={popupStartPressed} initialPointer={popupInitialPointer}
                initialTarget={popupTarget} resolveTarget={resolveTarget}
                drawSelectionWedges={!!theme?.drawSelectionWedges}
                drawWedgeSeparators={!!theme?.drawWedgeSeparators}
                onOpenCtx={onOpenCtx}
                onCloseCtx={onCloseCtx}
                onCancelCtx={onCancelCtx}
                onHoverCtx={onHoverCtx}
                onPathChangeCtx={onPathChangeCtx}
                onMarkCtx={onMarkCtx}
                onSelectCtx={onSelectCtx} />
      
    {/if}

  </div>

{/if}

{#if theme && firstRoot}

  <h2>Menus and Themes</h2>

  <div style="display:flex; gap: 12px; align-items: center; margin: 8px 0;">
    <label>Menu:
      <select bind:value={selectedMenuIndex} onchange={() => { firstRoot = menuSettings?.menus?.[+selectedMenuIndex]?.root ?? null; currentItem = firstRoot; }}>
        {#each availableMenus as m}
          <option value={m.index}>{m.name} {m.shortcutID ? `(${m.shortcutID})` : ''}</option>
        {/each}
      </select>
    </label>
    <label>Theme:
      <select bind:value={selectedThemeId} onchange={() => location.reload()}>
        <option value="default">default (vendor)</option>
        {#each availableThemes as t}
          <option value={t.id}>{t.name ?? t.id}</option>
        {/each}
      </select>
    </label>
  </div>

  <h2>Notifier log</h2>

  <pre bind:this={logRef} onscroll={onLogScroll} style="height: 200px; overflow: auto; border: 1px solid #000; padding: 8px; background: #fff; color: #000; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">
{#each logLines as line}
{line}
{/each}
</pre>

  <h2>Interactive PieMenu preview</h2>

  <div style="width: 420px; height: 420px; border: 1px dashed var(--hr, #999); display: grid; place-items: center;">

    <div style="width: 400px; height: 400px;">
      <PieMenuDemo root={firstRoot} {theme} settings={config}
        on:hover={(e) => console.log('[pie] hover', e.detail.path)}
        on:select={(e) => console.log('[pie] select', e.detail)} />
    </div>

  </div>

{/if}

{#if menuSettings}

  <h2>Menus (version {menuSettings.version})</h2>

  <ul>

    {#each menuSettings.menus as m: MenuV1, i}
      <li>

        <strong>{m.root?.name ?? `Menu ${i+1}`}</strong>

        <ul>

          {#if m.shortcut}<li>shortcut: {m.shortcut}</li>{/if}
          {#if m.shortcutID}<li>shortcutID: {m.shortcutID}</li>{/if}
          <li>centered: {String(m.centered ?? false)}</li>
          <li>anchored: {String(m.anchored ?? false)}</li>
          <li>hoverMode: {String(m.hoverMode ?? false)}</li>
          {#if m.tags?.length}
            <li>tags: {m.tags.join(', ')}</li>
          {/if}

          <li>outline:

            {#if m.root}
              <ul>
                <MenuOutline item={m.root} />
              </ul>
            {:else}
              <em>no root</em>
            {/if}

          </li>

        </ul>

      </li>

    {/each}

  </ul>

{/if}

{#if config}

  <h2>Config</h2>

  <pre>{JSON.stringify(config, null, 2)}</pre>

{/if}

{#if theme}

  <h2>Theme</h2>

  <ul>
    <li>id: {theme.id}</li>
    <li>name: {theme.name}</li>
    <li>engineVersion: {theme.engineVersion}</li>
    <li>layers: {theme.layers.length}</li>
  </ul>

  {#if mathPreview.angles}

    <h3>Math quick test</h3>

    <p>First menu child angles: {mathPreview.angles?.map((a) => a.toFixed(1)).join(', ')}</p>

    <p>Wedges: {mathPreview.wedges?.map((w) => `${w.start.toFixed(1)}–${w.end.toFixed(1)}`).join(' | ')}</p>

  {/if}

{/if}

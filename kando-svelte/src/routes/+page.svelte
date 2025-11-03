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
  import KandoWrapper from '../lib/components/KandoWrapper.svelte';

  let config: Record<string, unknown> | null = null;
  let menuSettings: MenuSettingsV1 | null = null;
  let theme: MenuThemeDescription | null = null;
  let availableThemes: Array<{ id: string; name?: string }> = [];
  let availableSoundThemes: Array<{ id: string; name?: string }> = [];
  let selectedThemeId: string = 'default';
  let selectedSoundId: string = 'none';
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

  // Wrapper demo state
  let wrapperArea: HTMLDivElement | null = null;
  let wrapperOptions: any = {
    mousePosition: { x: 0, y: 0 },
    windowSize: { x: 0, y: 0 },
    zoomFactor: 1,
    centeredMode: false,
    anchoredMode: false,
    hoverMode: false,
    systemIconsChanged: false
  };

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
        console.log('[page] fetching /api/themes…');
        const list = await getJSON<{ themes: { menu: Array<{ id: string; name?: string }>, sound: Array<{ id: string; name?: string }>, icon: Array<{ id: string; name?: string }> } }>('/api/themes');
        console.log('[page] /api/themes ok', list?.themes?.menu?.length, list?.themes?.sound?.length, list?.themes?.icon?.length);
        availableThemes = list.themes.menu;
        availableSoundThemes = list.themes.sound;
        selectedSoundId = availableSoundThemes[0]?.id ?? 'none';
      } catch (err) {
        console.error('[page] /api/themes failed', err);
      }

      await loadThemeById(selectedThemeId || 'default');

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

  async function loadThemeById(themeId: string) {
    try {
      console.log('[controls] load theme', themeId);
      const themeJson = await getJSON5<any>(`/kando/menu-themes/${themeId}/theme.json5`);
      theme = { ...(themeJson as any), id: themeId, directory: '/kando/menu-themes' } as any;
      console.log('[demo] theme loaded', theme?.id, theme?.name, 'layers', theme?.layers.length);
      if (theme) {
        injectThemeCss(theme);
        applyThemeColors(theme.colors);
        try {
          const htmlEl = document.documentElement;
          htmlEl.classList.remove('kando-icons-ready');
          const fontPromises: Promise<any>[] = [];
          if ('fonts' in document) {
            fontPromises.push((document as any).fonts.load('1em "Material Symbols Rounded"'));
            fontPromises.push((document as any).fonts.load('1em "simple-icons"'));
            fontPromises.push((document as any).fonts.ready);
          }
          await Promise.race([
            Promise.allSettled(fontPromises),
            new Promise((resolve) => setTimeout(resolve, 1500))
          ]);
          htmlEl.classList.add('kando-icons-ready');
        } catch {}
      }
    } catch (err) {
      console.error('[controls] load theme failed', themeId, err);
    }
  }

  // Observe wrapper area size
  onMount(() => {
    const updateWrapperOpts = () => {
      const w = Math.round(window.innerWidth);
      const h = Math.round(window.innerHeight);
      wrapperOptions = {
        ...wrapperOptions,
        windowSize: { x: w, y: h },
        mousePosition: { x: Math.floor(w / 2), y: Math.floor(h / 2) }
      };
    };
    updateWrapperOpts();
    const ro = new ResizeObserver(() => updateWrapperOpts());
    ro.observe(document.documentElement);
    window.addEventListener('resize', updateWrapperOpts);
    return () => { ro.disconnect(); window.removeEventListener('resize', updateWrapperOpts); };
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

  // Wrapper logs
  function itemAtPath(root: any, path: string): any {
    if (!root) return null;
    if (!path || path === '/') return root;
    const parts = path.split('/').filter(Boolean).map((p) => Number(p)).filter((n) => Number.isFinite(n));
    let node: any = root;
    for (const idx of parts) {
      if (!node?.children || !Array.isArray(node.children) || node.children[idx] == null) return null;
      node = node.children[idx];
    }
    return node;
  }

  function onWrapSelect(path: string) {
    const root = menuSettings?.menus?.[+selectedMenuIndex]?.root ?? firstRoot;
    const item = itemAtPath(root, path);
    console.log('[wrap-select]', { path, item });
    addLog(`[wrap-select] path=${path}`);
    if (item) {
      try { console.log('[wrap-select:item json]', JSON.stringify(item, null, 2)); } catch {}
      addLog(JSON.stringify(item, null, 2));
    } else {
      addLog('[wrap-select] item not found for path');
    }
  }
  function onWrapHover(path: string) { addLog(`[wrap-hover] ${path}`); }
  function onWrapUnhover(path: string) { addLog(`[wrap-unhover] ${path}`); }
  function onWrapCancel() { addLog('[wrap-cancel]'); }

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

{#if menuSettings}
  <div style="display:flex; gap: 12px; align-items: center; margin: 8px 0;">
    <label>Menu:
      <select bind:value={selectedMenuIndex} onchange={() => { console.log('[controls] menu change', selectedMenuIndex); firstRoot = menuSettings?.menus?.[+selectedMenuIndex]?.root ?? null; currentItem = firstRoot; }}>
        {#each availableMenus as m}
          <option value={m.index}>{m.name} {m.shortcutID ? `(${m.shortcutID})` : ''}</option>
        {/each}
      </select>
    </label>
    <label>Theme:
      <select bind:value={selectedThemeId} onchange={() => { console.log('[controls] theme change', selectedThemeId); loadThemeById(selectedThemeId); }}>
        <option value="default">default (vendor)</option>
        {#each availableThemes as t}
          <option value={t.id}>{t.name ?? t.id}</option>
        {/each}
      </select>
    </label>
    <label>Sound:
      <select bind:value={selectedSoundId} onchange={() => { console.log('[controls] sound theme change', selectedSoundId); addLog(`[controls] sound=${selectedSoundId}`); }}>
        {#each availableSoundThemes as t}
          <option value={t.id}>{t.name ?? t.id}</option>
        {/each}
      </select>
    </label>
  </div>
{/if}

{#if firstRoot}

  <h2>Svelte KandoWrapper Pie Menu Demo</h2>
  {#if theme}
    <KandoWrapper
      root={firstRoot}
      settings={config as any}
      theme={theme}
      colors={theme.colors}
      options={wrapperOptions}
      visible={true}
      globalTarget={true}
      simulateWarp={false}
      onSelect={onWrapSelect}
      onHover={onWrapHover}
      onUnhover={onWrapUnhover}
      onCancel={onWrapCancel}
    />
  {:else}
    <div style="padding:8px;">Load a theme to run the native Kando renderer.</div>
  {/if}

{/if}

{#if theme && firstRoot}

  <h2>Callback Log</h2>

  <pre bind:this={logRef} onscroll={onLogScroll} style="height: 600px; overflow: auto; border: 1px solid #000; padding: 8px; background: #fff; color: #000; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">
{#each logLines as line}
{line}
{/each}
</pre>

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

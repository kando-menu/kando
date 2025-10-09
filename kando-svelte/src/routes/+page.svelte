<script lang="ts">
  import { onMount } from 'svelte';
  import JSON5 from 'json5';
  import { applyThemeColors, injectThemeCss } from '$lib/theme-loader';
  import * as math from '../../../src/common/math';
  import type { MenuThemeDescription } from '$lib/types';
  import type { MenuSettingsV1, MenuV1 } from '@kando/schemata/menu-settings-v1';
  import { GENERAL_SETTINGS_SCHEMA_V1 } from '../../../src/common/settings-schemata/general-settings-v1';
  import { MENU_SETTINGS_SCHEMA_V1 } from '../../../src/common/settings-schemata/menu-settings-v1';
  import { z } from 'zod';
  import MenuOutline from '$lib/MenuOutline.svelte';
  import PieMenuDemo from '$lib/PieMenuDemo.svelte';
  import PieMenu from '$lib/PieMenu.svelte';
  import PieTree from '$lib/PieTree.svelte';

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
  let currentItem: any = null; // browsing cursor
  let chain: Array<{ item: any; index?: number; angle?: number }> = [];
  let mouseeCanvas: HTMLCanvasElement | null = null;
  let mouseeCtx: CanvasRenderingContext2D | null = null;

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
      availableMenus = (menuSettings?.menus ?? []).map((m: any, i: number) => ({ index: i, name: m.root?.name ?? `Menu ${i+1}`, shortcutID: m.shortcutID ?? '' }));
      selectedMenuIndex = 0;
      firstRoot = menuSettings?.menus?.[selectedMenuIndex]?.root ?? null;
      currentItem = firstRoot;
      // load theme list (demo only)
      try {
        const list = await getJSON<{ themes: Array<{ id: string; name?: string }> }>('api/themes');
        availableThemes = list.themes;
      } catch {}

      const themeId = selectedThemeId || 'default';
      const themeJson = await getJSON5<any>(`/kando/menu-themes/${themeId}/theme.json5`);
      theme = { ...themeJson, id: themeId, directory: '/kando/menu-themes' };
      console.log('[demo] theme loaded', theme?.id, theme?.name, 'layers', theme?.layers.length);
      // inject theme for demo page
      if (theme) {
        injectThemeCss(theme);
        applyThemeColors(theme.colors);
      }

      // math quick-test: compute angles/wedges for the first menu with children
      const firstMenu = menuSettings?.menus?.find((m) => m.root?.children?.length);
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

  function initCanvas() {
    if (!mouseeCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    const widthCss = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const heightCss = 1000;
    mouseeCanvas.style.width = `${widthCss}px`;
    mouseeCanvas.style.height = `${heightCss}px`;
    mouseeCanvas.width = Math.floor(widthCss * dpr);
    mouseeCanvas.height = Math.floor(heightCss * dpr);
    mouseeCtx = mouseeCanvas.getContext('2d');
    if (mouseeCtx) {
      mouseeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mouseeCtx.fillStyle = '#f3f3f3';
      mouseeCtx.fillRect(0, 0, widthCss, heightCss);
    }
  }

  function toCanvasPos(e: PointerEvent) {
    const rect = mouseeCanvas!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function openPopupAt(x: number, y: number) {
    popupCenter = { x: Math.round(x) + 0.5, y: Math.round(y) + 0.5 };
    popupOpen = true;
    popupStartPressed = true;
    popupInitialPointer = { x, y };
    currentItem = chain.length ? chain[chain.length-1].item : firstRoot;
  }

  function onCanvasDown(e: PointerEvent) {
    if (!mouseeCanvas) return;
    const p = toCanvasPos(e);
    openPopupAt(p.x, p.y);
  }

  $: mouseeCanvas && initCanvas();

  function onKey(e: KeyboardEvent) {
    if (!popupOpen) return;
    if (e.key === 'Escape') { popupOpen = false; chain = []; }
  }

  function onChildHover(path: string) {
    // path is like '/i' from PieMenuDemo; for single-level use, we only need the index
  }

  function onChildSelect({ detail }: CustomEvent<{ path: string; item: any }>) {
    const parts = detail.path.split('/').filter(Boolean);
    const idx = Number(parts[parts.length-1]);
    const item = currentItem?.children?.[idx];
    if (!item) return;
    if (item.children?.length) {
      chain.push({ item, index: idx });
      currentItem = item;
    } else {
      console.log('[demo-popup] select leaf', item?.name);
      popupOpen = false;
      chain = [];
    }
  }
</script>

{#if error}
  <p style="color: red">{error}</p>
{/if}

{#if theme && firstRoot}
  <div style="display:flex; gap: 12px; align-items: center; margin: 8px 0;">
    <label>Menu:
      <select bind:value={selectedMenuIndex} on:change={() => { firstRoot = menuSettings?.menus?.[+selectedMenuIndex]?.root ?? null; currentItem = firstRoot; }}>
        {#each availableMenus as m}
          <option value={m.index}>{m.name} {m.shortcutID ? `(${m.shortcutID})` : ''}</option>
        {/each}
      </select>
    </label>
    <label>Theme:
      <select bind:value={selectedThemeId} on:change={() => location.reload()}>
        <option value="default">default (vendor)</option>
        {#each availableThemes as t}
          <option value={t.id}>{t.name ?? t.id}</option>
        {/each}
      </select>
    </label>
  </div>
  <h3>Popup target</h3>
  <div style="position:relative; width: 100%; max-width: 100%; background: #f3f3f3;">
    <canvas bind:this={mouseeCanvas} class="mousee" on:pointerdown={onCanvasDown} style="display:block; width:100%; height:1000px;"></canvas>
    {#if popupOpen && firstRoot}
      <div style="position:absolute; inset:0;">
        <PieTree root={firstRoot} center={popupCenter} radiusPx={popupRadius} settings={config}
                 layers={theme?.layers ?? null} centerTextWrapWidth={theme?.centerTextWrapWidth ?? null}
                 startPressed={popupStartPressed} initialPointer={popupInitialPointer} />
      </div>
    {/if}
  </div>
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

{:else}
  <p>Loading menus…</p>
{/if}

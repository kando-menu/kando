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
  import PieMenu from '$lib/PieMenu.svelte';

  let config: Record<string, unknown> | null = null;
  let menuSettings: MenuSettingsV1 | null = null;
  let theme: MenuThemeDescription | null = null;
  let error: string | null = null;
  let firstRoot: any = null;
  let mathPreview: { angles?: number[]; wedges?: { start: number; end: number }[] } = {};

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
        firstRoot = menuSettings.menus?.[0]?.root ?? null;
      }
      else { console.warn('[demo] menus invalid', parsedMenus.error.issues); }
      const themeJson = await getJSON5<any>('/kando/menu-themes/default/theme.json5');
      theme = {
        ...themeJson,
        id: 'default',
        directory: '/kando/menu-themes'
      };
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
</script>

{#if error}
  <p style="color: red">{error}</p>
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

{#if theme && firstRoot}
  <h2>Interactive PieMenu preview</h2>
  <div style="width: 420px; height: 420px; border: 1px dashed var(--hr, #999); display: grid; place-items: center;">
    <div style="width: 400px; height: 400px;">
      <PieMenu root={firstRoot} {theme}
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
{:else}
  <p>Loading menus…</p>
{/if}

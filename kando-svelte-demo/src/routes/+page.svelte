<script lang="ts">
  import { onMount } from 'svelte';
  import JSON5 from 'json5';
  import type { MenuThemeDescription } from 'kando-svelte';
  import type { MenuSettingsV1, MenuV1 } from '@kando/schemata/menu-settings-v1';
  import MenuOutline from '$lib/MenuOutline.svelte';

  let config: Record<string, unknown> | null = null;
  let menuSettings: MenuSettingsV1 | null = null;
  let theme: MenuThemeDescription | null = null;
  let error: string | null = null;

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
      config = await getJSON('/kando/config.json');
      console.log('[demo] config keys', config && Object.keys(config));
      menuSettings = await getJSON<MenuSettingsV1>('/kando/menus.json');
      console.log('[demo] menus version', menuSettings?.version, 'count', menuSettings?.menus.length);
      const themeJson = await getJSON5<any>('/kando/menu-themes/default/theme.json5');
      theme = {
        ...themeJson,
        id: 'default',
        directory: '/kando/menu-themes'
      };
      console.log('[demo] theme loaded', theme?.id, theme?.name, 'layers', theme?.layers.length);
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

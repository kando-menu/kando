<script lang="ts">
  import type { MenuItem, MenuThemeDescription, ShowMenuOptions } from './types';
  import { createEventDispatcher, onMount } from 'svelte';
  import { fetchThemeJson, injectThemeCss, applyThemeColors } from './theme-loader';

  export let root: MenuItem;
  export let theme: MenuThemeDescription | null = null;
  export let options: Partial<ShowMenuOptions> = {};
  export let themeDirUrl: string | null = null;
  export let themeId: string | null = null;

  const dispatch = createEventDispatcher<{
    select: { path: string; item: MenuItem };
    cancel: void;
    hover: { path: string };
    unhover: { path: string };
  }>();

  let linkEl: HTMLLinkElement | null = null;

  onMount(async () => {
    if (!theme && themeDirUrl && themeId) {
      try {
        theme = await fetchThemeJson(themeDirUrl, themeId);
      } catch (e) {
        console.error(e);
      }
    }

    if (theme) {
      linkEl = injectThemeCss(theme);
      if (theme.colors) applyThemeColors(theme.colors);
    }

    return () => {
      if (linkEl) linkEl.remove();
    };
  });

  function handleSelect(path: string, item: MenuItem) {
    dispatch('select', { path, item });
  }
</script>

<div class="kando-pie-menu">
  <!-- TODO: render items using PieItem and helpers -->
  <div class="placeholder">PieMenu placeholder</div>
</div>

<style>
  .kando-pie-menu { position: relative; width: 100%; height: 100%; }
  .placeholder { opacity: 0.6; font-size: 14px; padding: 8px; }
</style>

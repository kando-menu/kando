<script lang="ts">
  import type { MenuItem, MenuThemeDescription, ShowMenuOptions, Vec2 } from './types';
  import { createEventDispatcher, onMount } from 'svelte';
  import { fetchThemeJson, injectThemeCss, applyThemeColors } from './theme-loader';
  import * as math from '@kando/common/math';

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
  let container: HTMLDivElement | null = null;

  // Basic state for the first interactive milestone --------------------------------------
  let center: Vec2 = { x: 0, y: 0 };
  let hoveredIndex: number = -1;
  let childAngles: number[] = [];
  let childWedges: { start: number; end: number }[] = [];
  let lastHoveredPath: string | null = null;

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

    // Compute initial center and child layout for the root menu
    computeCenter();
    computeRootLayout();

    const ro = new ResizeObserver(() => {
      computeCenter();
      computeRootLayout();
    });
    if (container) ro.observe(container);

    return () => {
      if (linkEl) linkEl.remove();
      ro.disconnect();
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

  function computeRootLayout() {
    if (!root?.children?.length) {
      childAngles = [];
      childWedges = [];
      return;
    }
    // Root has no parent; compute angles and wedges for its children
    childAngles = math.computeItemAngles(root.children as any);
    childWedges = math.computeItemWedges(childAngles).itemWedges;
  }

  function onPointerMove(e: PointerEvent | MouseEvent) {
    if (!container) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pos: Vec2 = { x: e.clientX - r.left, y: e.clientY - r.top };
    const rel: Vec2 = { x: pos.x - center.x, y: pos.y - center.y };

    const distance = math.getDistance({ x: 0, y: 0 }, rel);
    const angle = math.getAngle(rel);

    // Dead zone around center uses config default (50px) unless overridden
    const dead = options?.centeredMode ? 0 : (options as any)?.centerDeadZone ?? 50;
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
    updateHover(idx);
  }

  function updateHover(idx: number) {
    if (idx === hoveredIndex) return;
    const path = idx >= 0 ? `/${idx}` : '/';
    if (lastHoveredPath && lastHoveredPath !== path) dispatch('unhover', { path: lastHoveredPath });
    hoveredIndex = idx;
    lastHoveredPath = path;
    dispatch('hover', { path });
  }

  function onClick() {
    if (hoveredIndex < 0) return;
    const item = root.children?.[hoveredIndex];
    if (item) handleSelect(`/${hoveredIndex}`, item as MenuItem);
  }
</script>

<div class="kando-pie-menu" bind:this={container} on:pointermove={onPointerMove} on:click={onClick}>
  <!-- Milestone: minimal interactive overlay (no visuals yet) -->
  <div class="placeholder">
    {#if root?.children?.length}
      Hovered: {hoveredIndex >= 0 ? root.children[hoveredIndex]?.name : 'center'}
    {:else}
      PieMenu placeholder
    {/if}
  </div>
</div>

<style>
  .kando-pie-menu { position: relative; width: 100%; height: 100%; }
  .placeholder { opacity: 0.6; font-size: 14px; padding: 8px; }
</style>

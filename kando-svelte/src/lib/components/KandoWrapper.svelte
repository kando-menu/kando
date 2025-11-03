<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type {
    MenuItem,
    MenuThemeDescription,
    SoundThemeDescription,
    GeneralSettings,
    ShowMenuOptions,
    Vec2
  } from '@kando/common';
  import { Menu } from '@kando/menu';
  import { MenuTheme } from '@kando/menu-theme';
  import { injectThemeCssLink } from '../kando-web.js';
  // Import Kando's base CSS exactly as upstream defines it
  import '@kando/base-css';
  // Icon registry (private map will be populated for web)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  import { IconThemeRegistry } from '@kando/common/icon-themes/icon-theme-registry';

  // Runes props
  const {
    root,
    settings,
    theme,
    colors,
    soundTheme, // optional; if omitted, sounds are disabled
    visible = false,
    options,
    globalTarget = false,
    simulateWarp = false,
    onSelect,
    onHover,
    onUnhover,
    onCancel
  } = $props<{
    root: MenuItem | null;
    settings: GeneralSettings;
    theme: MenuThemeDescription;
    colors: Record<string, string>;
    soundTheme?: SoundThemeDescription | null;
    visible?: boolean;
    options: ShowMenuOptions;
    globalTarget?: boolean;
    simulateWarp?: boolean;
    onSelect?: (path: string) => void;
    onHover?: (path: string) => void;
    onUnhover?: (path: string) => void;
    onCancel?: () => void;
  }>();

  let container: HTMLDivElement; // portal container mounted under document.body
  let triggerEl: HTMLDivElement | null = null; // in-page clickable area

  // Minimal no-op sound theme to avoid howler/browser deps
  const NoopSound = {
    loadDescription: (_d: any) => {},
    setVolume: (_v: number) => {},
    playSound: (_t: any) => {}
  } as any;

  let menu: InstanceType<typeof Menu> | null = null;
  let menuTheme: InstanceType<typeof MenuTheme> | null = null;
  let lastThemeKey: string | null = null;
  let lastShowKey: string | null = null;
  const log = (...args: any[]) => console.log('[KandoWrapper]', ...args);
  const warn = (...args: any[]) => console.warn('[KandoWrapper:warn]', ...args);
  let autoShown = false;
  let menuOpen = false;
  let isLocked = false;
  let simPos: { x: number; y: number } | null = null;
  let simCursor: HTMLDivElement | null = null;
  let simLine: HTMLDivElement | null = null;
  let simAnimId: number | null = null;
  let didInitialWarpAnim = false;
  let applyingWarp = false;
  let scrollOverrideStyle: HTMLStyleElement | null = null;
  let simDest: { x: number; y: number } | null = null;
  // We now deliver pointerDown immediately at destination; no pending queue
  let cursorLast: { x: number; y: number } | null = null;
  let frameScheduled = false;
  // Track initial click that opened the menu so we can start gestures immediately
  // without triggering a click-selection on the very first up event.
  let openClickPos: { x: number; y: number } | null = null;
  // Swallow both pointerup and mouseup of the first click-to-open unless the user drags
  let swallowReleaseCount = 0; // number of upcoming release events to swallow (max 2)
  let hasInjectedDown = false; // whether we've injected the initial mousedown into Kando for this press

  function isMenuOpen(): boolean { return !!menuOpen; }

  function normalizeTheme(desc: MenuThemeDescription): MenuThemeDescription {
    // Apply upstream defaults Electron would provide
    return {
      ...desc,
      centerTextWrapWidth: (desc as any).centerTextWrapWidth ?? 90,
      drawCenterText: (desc as any).drawCenterText ?? true
    } as MenuThemeDescription;
  }

  function ensureWebIconThemesRegistered() {
    try {
      const registry: any = IconThemeRegistry?.getInstance?.();
      if (!registry) return;
      const map: Map<string, any> = registry.iconThemes ?? registry['iconThemes'];
      if (!map) return;
      // material-symbols-rounded
      if (!map.has('material-symbols-rounded')) {
        map.set('material-symbols-rounded', {
          name: 'Material Symbols Rounded',
          createIcon(icon: string) {
            const container = document.createElement('div');
            container.classList.add('icon-container');
            const i = document.createElement('i');
            i.classList.add('material-symbols-rounded');
            i.innerText = icon;
            container.appendChild(i);
            return container;
          },
          iconPickerInfo: { type: 'none' },
        });
      }
      // simple-icons
      if (!map.has('simple-icons')) {
        map.set('simple-icons', {
          name: 'Simple Icons',
          createIcon(icon: string) {
            const container = document.createElement('div');
            container.classList.add('icon-container');
            // Ensure the font CSS can be loaded in the browser environment
            try {
              if (!document.getElementById('simple-icons-css')) {
                const link = document.createElement('link');
                link.id = 'simple-icons-css';
                link.rel = 'stylesheet';
                link.href = '/~simple-icons/simple-icons.css';
                document.head.appendChild(link);
              }
            } catch {}
            const i = document.createElement('i');
            i.classList.add('si');
            i.classList.add('si-' + icon);
            container.appendChild(i);
            return container;
          },
          iconPickerInfo: { type: 'none' },
        });
      }
      // kando (file icons packaged in the app)
      if (!map.has('kando')) {
        map.set('kando', {
          name: 'Kando Built-in',
          createIcon(icon: string) {
            const container = document.createElement('div');
            container.classList.add('icon-container');
            const img = document.createElement('img');
            const filename = icon.endsWith('.svg') ? icon : `${icon}.svg`;
            img.src = `/kando/icon-themes/kando/${filename}`;
            img.alt = '';
            container.appendChild(img);
            return container;
          },
          iconPickerInfo: { type: 'none' },
        });
      }
    } catch (e) {
      warn('ensureWebIconThemesRegistered failed', e);
    }
  }

  function ensureMenu(): void {
    log('ensureMenu:start');
    if (!menuTheme) {
      log('creating MenuTheme', { themeId: (theme as any)?.id, dir: (theme as any)?.directory });
      menuTheme = new MenuTheme();
      // Bypass file:// and inject web-safe CSS link
      (menuTheme as any).description = normalizeTheme(theme);
      log('injectThemeCssLink');
      injectThemeCssLink(theme);
      menuTheme.setColors(colors);
      log('MenuTheme ready');
      // Ensure icon themes exist for the web
      ensureWebIconThemesRegistered();
    }

    if (!menu) {
      // Use a no-op sound provider for web
      const sound = soundTheme ? NoopSound : NoopSound;
      const r = container?.getBoundingClientRect?.();
      log('creating Menu', { hasContainer: !!container, size: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null });
      menu = new Menu(container, menuTheme as any, sound, settings);

      // Wire events outwards via callbacks (Svelte 5-friendly without createEventDispatcher)
      log('binding menu events: select, hover, unhover, cancel, move-pointer');
      menu.on('select', (path: string) => { 
        log('event:select', path); 
        onSelect?.(path);
        try { (menu as any)?.hide?.(); } catch {}
        try { exitPointerLock(); } catch {}
        autoShown = false;
        menuOpen = false;
        try { if (container) container.style.display = 'none'; } catch {}
      });
      menu.on('hover', (path: string) => { log('event:hover', path); onHover?.(path); });
      menu.on('unhover', (path: string) => { log('event:unhover', path); onUnhover?.(path); });
      menu.on('cancel', () => { 
        log('event:cancel'); 
        onCancel?.(); 
        try { exitPointerLock(); } catch {}
        autoShown = false; 
        menuOpen = false;
        try { if (container) container.style.display = 'none'; } catch {}
      });
      (menu as any).on?.('move-pointer', (offset: any) => {
        log('event:move-pointer', offset);
        if (!simulateWarp) return;
        applyingWarp = true;
        try {
          // Establish base for seamless warp accumulation
          if (!simDest) simDest = simPos ?? { x: Math.round(window.innerWidth/2), y: Math.round(window.innerHeight/2) };
          simDest = clampToViewport({ x: simDest.x + (offset?.x ?? 0), y: simDest.y + (offset?.y ?? 0) });
          // First time after show, snapshot last real cursor and schedule DOWN at destination
          if (!cursorLast) cursorLast = { x: Math.round((offset?.x ?? 0) + (simDest?.x ?? 0)), y: Math.round((offset?.y ?? 0) + (simDest?.y ?? 0)) };
          // Emit one move at destination; visual cursor will animate separately
          const move = new MouseEvent('mousemove', { clientX: simDest.x, clientY: simDest.y, bubbles: true, cancelable: true });
          (menu as any)?.pointerInput?.onMotionEvent?.(move);
          // Animate visual cursor toward destination
          if (!simPos) simPos = { x: simDest.x, y: simDest.y };
          animateSimCursorTo(simDest, 120);
        } catch {}
        applyingWarp = false;
      });

      // Report missing callbacks once
      if (!onSelect || !onHover || !onUnhover || !onCancel) {
        warn('callbacks', { onSelect: !!onSelect, onHover: !!onHover, thenUnhover: !!onUnhover, onCancel: !!onCancel });
      }
    }
    log('ensureMenu:end');
  }

  function showIfPossible() {
    if (!menu || !root || !visible) return;
    // Derive window size if missing
    const wsOpt = (options as any)?.windowSize as Vec2 | undefined;
    const mpOpt = (options as any)?.mousePosition as Vec2 | undefined;
    const winSize: Vec2 = (!wsOpt || wsOpt.x <= 0 || wsOpt.y <= 0)
      ? { x: window.innerWidth, y: window.innerHeight }
      : wsOpt;
    const mouse: Vec2 = (!mpOpt || mpOpt.x < 0 || mpOpt.y < 0)
      ? { x: Math.floor(window.innerWidth / 2), y: Math.floor(window.innerHeight / 2) }
      : mpOpt;
    const opts: ShowMenuOptions = {
      ...options,
      windowSize: winSize,
      mousePosition: mouse,
      zoomFactor: options?.zoomFactor ?? 1,
      centeredMode: options?.centeredMode ?? false,
      anchoredMode: options?.anchoredMode ?? false,
      hoverMode: options?.hoverMode ?? false,
      systemIconsChanged: options?.systemIconsChanged ?? false
    };
    const key = `${root ? (root as any).name : 'null'}|${winSize.x}x${winSize.y}|${opts.centeredMode?'c':'-'}|${opts.anchoredMode?'a':'-'}|${opts.hoverMode?'h':'-'}`;
    if (lastShowKey === key) return;
    lastShowKey = key;
    const tlink = document.getElementById('kando-menu-theme') as HTMLLinkElement | null;
    log('showIfPossible: showing menu', { key, mouse, winSize, visible, themeHref: tlink?.href ?? null });
    (menu as any).show(root as any, opts);
    // Mark as ready after first frame so theme CSS has a chance to apply and connectors can be revealed.
    try {
      if (!container.classList.contains('ready')) {
        requestAnimationFrame(() => {
          container.classList.remove('preinit');
          container.classList.add('ready');
          log('container ready');
        });
      }
    } catch {}
  }

  // Treat only background clicks as valid open triggers (ignore UI controls)
  function isUiElement(el: EventTarget | null): boolean {
    if (!el || !(el as Element)?.closest) return false;
    const elem = el as Element;
    return !!elem.closest(
      '.kando-ui, select, input, textarea, button, a, [contenteditable], [role], summary, details'
    );
  }

  // Pointer-lock based simulated warping -------------------------------------------------
  function clampToViewport(p: { x: number; y: number }) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      x: Math.max(0, Math.min(w - 1, p.x)),
      y: Math.max(0, Math.min(h - 1, p.y))
    };
  }

  function ensureSimCursor() {
    if (!simulateWarp) return;
    if (!simCursor) {
      simCursor = document.createElement('div');
      simCursor.className = 'sim-cursor';
      simCursor.style.position = 'fixed';
      simCursor.style.pointerEvents = 'none';
      simCursor.style.zIndex = '2147483647';
      simCursor.style.transform = 'translate(-50%, -50%)';
      document.body.appendChild(simCursor);
    }
  }

  function updateSimCursor() {
    if (!simulateWarp || !simCursor || !simPos) return;
    simCursor.style.left = `${Math.round(simPos.x)}px`;
    simCursor.style.top = `${Math.round(simPos.y)}px`;
    try {
      const x = Math.round(simPos.x); const y = Math.round(simPos.y);
      const dx = simDest ? Math.round(simDest.x) : x;
      const dy = simDest ? Math.round(simDest.y) : y;
      container?.style.setProperty('--kando-sim-x', x + 'px');
      container?.style.setProperty('--kando-sim-y', y + 'px');
      container?.style.setProperty('--kando-dest-x', dx + 'px');
      container?.style.setProperty('--kando-dest-y', dy + 'px');
    } catch {}
  }

  function updateActualVars(x: number, y: number) {
    try {
      container?.style.setProperty('--kando-actual-x', Math.round(x) + 'px');
      container?.style.setProperty('--kando-actual-y', Math.round(y) + 'px');
    } catch {}
    cursorLast = { x: Math.round(x), y: Math.round(y) };
  }

  // Removed pending-down machinery; we inject initial mousedown immediately on open.

  function enterPointerLock(initAt?: { x: number; y: number }) {
    if (!simulateWarp) return;
    try {
      container?.requestPointerLock?.();
      const onChange = () => {
        isLocked = (document.pointerLockElement === container);
        if (isLocked) {
          document.body.classList.add('kando-pointer-locked');
          ensureSimCursor();
          didInitialWarpAnim = false;
          if (initAt) { simPos = clampToViewport(initAt); updateSimCursor(); }
        } else {
          // Defer removing class/cursor until exitPointerLock() finishes animation.
        }
        document.removeEventListener('pointerlockchange', onChange as any);
      };
      const onError = () => {
        warn('pointerlockerror');
        document.removeEventListener('pointerlockerror', onError as any);
      };
      document.addEventListener('pointerlockchange', onChange);
      document.addEventListener('pointerlockerror', onError);
    } catch (e) { warn('enterPointerLock failed', e); }
  }

  function exitPointerLock() {
    if (!simulateWarp) return;
    // Animate to actual cursor position (first mousemove), then unhide system cursor and remove sim
    const finish = (pt: { x: number; y: number }) => {
      if (!simCursor) return;
      animateSimCursorTo({ x: pt.x, y: pt.y }, 250)
        .finally(() => {
          try { document.body.style.cursor = ''; } catch {}
          document.body.classList.remove('kando-pointer-locked');
          try { simCursor?.remove(); simCursor = null; } catch {}
          try { if (document.pointerLockElement) document.exitPointerLock(); } catch {}
        });
    };
    const onMove = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', onMove as any);
      finish({ x: ev.clientX, y: ev.clientY });
    };
    // If we don't get a mousemove quickly, fall back to last simPos
    const to = window.setTimeout(() => {
      try { window.removeEventListener('mousemove', onMove as any); } catch {}
      finish(simPos ?? { x: Math.round(window.innerWidth/2), y: Math.round(window.innerHeight/2) });
    }, 100);
    window.addEventListener('mousemove', onMove, { once: true } as any);
  }

  function animateSimCursorTo(target: { x: number; y: number }, durationMs = 250): Promise<void> {
    if (!simulateWarp) return Promise.resolve();
    if (!simPos) { simPos = { x: target.x, y: target.y }; updateSimCursor(); return Promise.resolve(); }
    if (simAnimId) cancelAnimationFrame(simAnimId);
    const start = { x: simPos.x, y: simPos.y };
    const dx = target.x - start.x; const dy = target.y - start.y;
    const t0 = performance.now();
    return new Promise((resolve) => {
      const step = () => {
        const t = Math.min(1, (performance.now() - t0) / durationMs);
        const ease = t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t; // easeInOutQuad
        simPos = { x: start.x + dx * ease, y: start.y + dy * ease };
        updateSimCursor();
        if (t < 1) {
          simAnimId = requestAnimationFrame(step);
        } else {
          simAnimId = null;
          resolve();
        }
      };
      simAnimId = requestAnimationFrame(step);
    });
  }

  function scheduleFrame() {
    if (frameScheduled) return;
    frameScheduled = true;
    requestAnimationFrame(() => {
      frameScheduled = false;
      if (!menu || !simDest) return;
      try {
        const move = new MouseEvent('mousemove', { clientX: simDest.x, clientY: simDest.y, bubbles: true, cancelable: true });
        (menu as any)?.pointerInput?.onMotionEvent?.(move);
      } catch {}
      if (!simPos) simPos = { x: simDest.x, y: simDest.y };
      const dx = simDest.x - simPos.x;
      const dy = simDest.y - simPos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) {
        simPos = { x: simDest.x, y: simDest.y };
        updateSimCursor();
      } else {
        simPos = { x: simPos.x + dx * 0.75, y: simPos.y + dy * 0.75 };
        updateSimCursor();
        scheduleFrame();
      }
    });
  }

  $effect(() => {
    log('$effect:init', { hasContainer: !!container });
    // No menu creation here; wait for user action
  });

  $effect(() => {
    log('$effect:theme', { themeId: (theme as any)?.id });
    if (!menuTheme) return;
    (menuTheme as any).description = normalizeTheme(theme);
    const themeKey = `${theme?.directory}|${theme?.id}`;
    if (themeKey !== lastThemeKey) {
      log('theme changed -> injectThemeCssLink');
      injectThemeCssLink(theme);
      lastThemeKey = themeKey;
    }
    menuTheme.setColors(colors);
    // No auto re-show
  });

  $effect(() => {
    log('$effect:settings');
    if (menu) {
      (menu as any).updateSettings(settings);
    }
  });

  $effect(() => {
    // Track root/options changes without spamming
    const rname = (root as any)?.name ?? '(null)';
    const os = options ? { ws: options.windowSize, mp: options.mousePosition, c: options.centeredMode, a: options.anchoredMode, h: options.hoverMode } : null;
    log('$effect:root/options', { root: rname, options: os });
  });

  $effect(() => {
    log('$effect:visible', { visible });
    if (!menu) return;
    if (visible) {
      log('visible=true (standby; waiting for user trigger)');
    } else {
      log('visible=false -> hide');
      try { (menu as any)?.hide?.(); } catch {}
      try { if (container) container.style.display = 'none'; } catch {}
      autoShown = false;
    }
  });

  onMount(() => {
    log('onMount');
    try {
      // Create portal container at document.body
      container = document.createElement('div');
      container.id = 'kando-menu';
      container.className = 'hidden preinit';
      container.style.display = 'none';
      document.body.appendChild(container);
      log('portal-mounted', { appendedTo: 'body' });
      // Restore page scrolling: base-css sets body{overflow:hidden}; override for web demo
      try {
        scrollOverrideStyle = document.createElement('style');
        scrollOverrideStyle.id = 'kando-web-scroll-override';
        scrollOverrideStyle.textContent = 'html,body{overflow:auto !important;}';
        document.head.appendChild(scrollOverrideStyle);
      } catch {}
    } catch (e) { warn('portal mount failed', e); }
    // Log pointer/keyboard event wiring attempts by Kando by monkey-patching addEventListener
    try {
      if (container) {
        const origAdd = container.addEventListener.bind(container);
        (container as any).addEventListener = ((type: string, listener: any, options?: any) => {
          log('container.addEventListener', type, options);
          return origAdd(type as any, listener as any, options as any);
        }) as any;
        // We'll restore this in the onMount cleanup
        var restoreContainerAdd = () => { try { (container as any).addEventListener = origAdd; } catch {} };
      }
      const origWinAdd = window.addEventListener.bind(window);
      window.addEventListener = ((type: string, listener: any, options?: any) => {
        if (['pointerdown','pointermove','pointerup','pointercancel','contextmenu','wheel','keydown','keyup'].includes(type)) {
          log('window.addEventListener', type, options);
        }
        return origWinAdd(type as any, listener as any, options as any);
      }) as any;
      var restoreWindowAdd = () => { try { (window as any).addEventListener = origWinAdd; } catch {} };
    } catch (e) {
      log('monkey-patch addEventListener failed', e);
    }

    // Attach our own high-level logs for input events in capture phase
    const listeners: Array<{ el: Element; type: string; handler: (e: Event) => void; opts: AddEventListenerOptions }> = [];
    const attachOn = (el: any, type: string, handler: (e: Event) => void, opts: AddEventListenerOptions = { capture: true }) => {
      if (!el) return;
      el.addEventListener(type, handler as any, opts);
      listeners.push({ el, type, handler, opts });
    };
    let lastMove = 0;
    const maybeLogMove = (tag: 'pointermove' | 'mousemove', e: PointerEvent | MouseEvent) => {
      const now = Date.now();
      if (!isMenuOpen()) return; // no logging before open
      if (now - lastMove > 120) { lastMove = now; log(tag, { buttons: (e as any).buttons, x: e.clientX, y: e.clientY }); }
    };
    const inputTarget: any = globalTarget ? window : (triggerEl as any);
    // Attach passive background listeners; do not hijack default distribution
    attachOn(inputTarget, 'pointerdown', (e: Event) => {
      const p = e as PointerEvent; log('pointerdown', { button: p.button, buttons: p.buttons, x: p.clientX, y: p.clientY });
      // If not visible yet, open under cursor relative to container
      if (!autoShown || !menuOpen) {
        if (!menu) ensureMenu();
        if (container) container.style.display = '';
        const mp = { x: Math.round(p.clientX), y: Math.round(p.clientY) } as Vec2;
        updateActualVars(mp.x, mp.y);
        const ws = { x: window.innerWidth, y: window.innerHeight } as Vec2;
        const showOpts = { ...(options as any), mousePosition: mp, windowSize: ws } as ShowMenuOptions;
        log('open-on-pointerdown', { mp, ws });
        // Show at the click location
        (menu as any)?.show?.(root as any, showOpts);
        menuOpen = true;
        // Remember open click and default to swallowing the first release (pointerup + mouseup)
        // unless the pointer moves beyond the drag threshold.
        openClickPos = { x: mp.x, y: mp.y };
        swallowReleaseCount = 2;
        hasInjectedDown = false;
        if (simulateWarp) {
          // Immediately show virtual cursor at the real pointer and hide system cursor
          ensureSimCursor();
          try { document.body.style.cursor = 'none'; } catch {}
          simPos = clampToViewport({ x: mp.x, y: mp.y });
          simDest = { x: mp.x, y: mp.y };
          updateSimCursor();
          didInitialWarpAnim = true; // visual animation is only for future warps
          enterPointerLock(mp);
        }
        // Do NOT inject mousedown here. We will inject lazily on first move while pressed.
        // Mark as ready after first frame
        try {
          requestAnimationFrame(() => {
            container.classList.remove('preinit');
            container.classList.add('ready');
            log('container ready');
          });
        } catch {}
        autoShown = true;
      }
    });
    attachOn(inputTarget, 'pointermove', (e: Event) => {
      const p = e as PointerEvent; maybeLogMove('pointermove', p);
      if (!isMenuOpen()) { updateActualVars(p.clientX, p.clientY); return; }
      // If this is the first interaction after open, track distance to decide whether
      // to swallow the first pointerup (click-to-open) or allow selection (drag gesture).
      if (openClickPos) {
        const tx = (simulateWarp && isLocked && simDest) ? simDest.x : p.clientX;
        const ty = (simulateWarp && isLocked && simDest) ? simDest.y : p.clientY;
        const dx = tx - openClickPos.x;
        const dy = ty - openClickPos.y;
        const dist = Math.hypot(dx, dy);
        const thresh = (settings as any)?.dragThreshold ?? 15;
        if (dist > thresh) {
          log('drag-threshold-exceeded; allow release to select', { dist, thresh });
          swallowReleaseCount = 0;
        }
        // If the user is holding the primary button and we haven't injected the down yet,
        // inject it now so gesture detection activates on this first drag.
        if (!hasInjectedDown && (p.buttons & 1) === 1) {
          try {
            const start = { x: openClickPos.x, y: openClickPos.y };
            const down = new MouseEvent('mousedown', { clientX: start.x, clientY: start.y, button: 0, bubbles: true, cancelable: true });
            (menu as any)?.pointerInput?.onPointerDownEvent?.(down);
            hasInjectedDown = true;
            log('injected-late-mousedown', { x: start.x, y: start.y });
          } catch (err) { warn('inject late press failed', err); }
        }
      }
      if (simulateWarp && isLocked) {
        if (!simPos) simPos = { x: Math.round(window.innerWidth / 2), y: Math.round(window.innerHeight / 2) };
        if (!simDest) simDest = { x: simPos.x, y: simPos.y };
        // Adjust destination by raw movement; visual anim will chase it
        // Use movementX/Y only; do NOT also apply Kando offset here to avoid double-counting.
        simDest = clampToViewport({ x: simDest.x + (p.movementX || 0), y: simDest.y + (p.movementY || 0) });
        try {
          const move = new MouseEvent('mousemove', { clientX: simDest.x, clientY: simDest.y, bubbles: true, cancelable: true });
          (menu as any)?.pointerInput?.onMotionEvent?.(move);
        } catch {}
        animateSimCursorTo(simDest, 48);
        return;
      }
      // Not in pointer lock: update actual cursor CSS vars live
      updateActualVars(p.clientX, p.clientY);
      try {
        // Forward to Kando only while open
        const move = new MouseEvent('mousemove', { clientX: p.clientX, clientY: p.clientY, bubbles: true, cancelable: true });
        (menu as any)?.pointerInput?.onMotionEvent?.(move);
      } catch {}
    });
    attachOn(inputTarget, 'pointerup', (e: Event) => {
      const p = e as PointerEvent; log('pointerup', { button: p.button, buttons: p.buttons, x: p.clientX, y: p.clientY });
      if (!isMenuOpen()) return;
      // Swallow release in capture phase to avoid Kando's internal mouseup closing the menu
      if (swallowReleaseCount > 0) {
        try { (e as any).stopImmediatePropagation(); (e as any).stopPropagation(); (e as any).preventDefault(); } catch {}
        swallowReleaseCount = Math.max(0, swallowReleaseCount - 1);
        log('swallowed-pointerup-after-open', { remaining: swallowReleaseCount });
        openClickPos = null;
        return;
      }
      try {
        const cx = (simulateWarp && isLocked && simPos) ? simPos.x : p.clientX;
        const cy = (simulateWarp && isLocked && simPos) ? simPos.y : p.clientY;
        const up = new MouseEvent('mouseup', { clientX: cx, clientY: cy, button: p.button, bubbles: true, cancelable: true });
        (menu as any)?.pointerInput?.onPointerUpEvent?.(up);
      } catch {}
      openClickPos = null;
    });
    attachOn(inputTarget, 'mousedown', (e: Event) => {
      const m = e as MouseEvent; log('mousedown', { button: m.button, buttons: m.buttons, x: m.clientX, y: m.clientY });
    });
    attachOn(inputTarget, 'mousemove', (e: Event) => {
      const m = e as MouseEvent; maybeLogMove('mousemove', m);
    });
    attachOn(inputTarget, 'mouseup', (e: Event) => {
      const m = e as MouseEvent; log('mouseup', { button: m.button, buttons: m.buttons, x: m.clientX, y: m.clientY });
      // Swallow container's internal mouseup that would cancel the menu on click-to-open
      if (swallowReleaseCount > 0) {
        try { (e as any).stopImmediatePropagation(); (e as any).stopPropagation(); (e as any).preventDefault(); } catch {}
        swallowReleaseCount = Math.max(0, swallowReleaseCount - 1);
        log('swallowed-mouseup-after-open', { remaining: swallowReleaseCount });
        openClickPos = null;
      }
    });
    attachOn(inputTarget, 'pointercancel', (e: Event) => { log('pointercancel', e); });
    attachOn(inputTarget, 'wheel', (e: Event) => { const w = e as WheelEvent; log('wheel', { deltaX: w.deltaX, deltaY: w.deltaY, deltaMode: w.deltaMode }); }, { capture: true, passive: true } as any);
    attachOn(document.body as any, 'contextmenu', (e: Event) => {
      if ((e as any).target !== document.body) return;
      e.preventDefault();
      const m = e as MouseEvent; log('contextmenu', { x: m.clientX, y: m.clientY });
      if (!menu) ensureMenu();
      if (container) container.style.display = '';
      const mp = { x: Math.round(m.clientX), y: Math.round(m.clientY) } as Vec2;
      updateActualVars(mp.x, mp.y);
      const ws = { x: window.innerWidth, y: window.innerHeight } as Vec2;
      const showOpts = { ...(options as any), mousePosition: mp, windowSize: ws } as ShowMenuOptions;
      (menu as any)?.show?.(root as any, showOpts);
      if (simulateWarp) enterPointerLock(mp);
      try { requestAnimationFrame(() => { container.classList.remove('preinit'); container.classList.add('ready'); }); } catch {}
      autoShown = true;
    });
    attachOn(inputTarget, 'keydown', (e: Event) => { 
      const k = e as KeyboardEvent; 
      log('keydown', { key: k.key, code: k.code, ctrl: k.ctrlKey, alt: k.altKey, shift: k.shiftKey, meta: k.metaKey }); 
      if (k.key === 'Escape') {
        try { (menu as any)?.cancel?.(); } catch {}
        autoShown = false;
        try { if (container) container.style.display = 'none'; } catch {}
      }
    });
    attachOn(inputTarget, 'keyup', (e: Event) => { const k = e as KeyboardEvent; log('keyup', { key: k.key, code: k.code }); });

    ensureMenu();

    return () => {
      log('onDestroy:cleanup listeners');
      try { listeners.forEach(({ el, type, handler, opts }) => el?.removeEventListener(type, handler as any, opts)); } catch {}
      try { restoreContainerAdd?.(); } catch {}
      try { restoreWindowAdd?.(); } catch {}
      try { container?.remove(); } catch {}
      try { scrollOverrideStyle?.remove(); scrollOverrideStyle = null; } catch {}
    };
  });

  onDestroy(() => {
    log('onDestroy');
    try {
      (menu as any)?.hide();
    } catch {}
    menu = null;
  });
</script>

<div class="trigger" bind:this={triggerEl} tabindex="0" role="application" aria-label="Kando trigger area"></div>

<style>
  /* Keep only the minimal guard; all base styles come from upstream index.scss */
  :global(#kando-menu.preinit .connector) { display: none !important; width: 0 !important; height: 0 !important; }
  /* Ensure the overlay is pinned to the viewport even when the page scrolls */
  :global(#kando-menu) { position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; }
  .trigger { position: relative; width: 100%; height: 100%; outline: none; }
  .trigger:focus { outline: 1px dashed transparent; }

  /* Default simulated cursor visuals; themes can override these CSS vars/classes */
  :root {
    --kando-sim-cursor-size: 12px;
    --kando-sim-cursor-fill: rgba(0,0,0,0.95);
    --kando-sim-cursor-stroke: rgba(255,255,255,0.9);
    --kando-sim-cursor-stroke-width: 1.5px;
    --kando-sim-cursor-shadow: 0 0 6px rgba(0,0,0,0.35);
    --kando-sim-cursor-z: 2147483647;
  }

  :global(.sim-cursor) {
    width: var(--kando-sim-cursor-size);
    height: var(--kando-sim-cursor-size);
    border-radius: 50%;
    background: var(--kando-sim-cursor-fill);
    box-shadow: var(--kando-sim-cursor-shadow);
    outline: var(--kando-sim-cursor-stroke-width) solid var(--kando-sim-cursor-stroke);
    z-index: var(--kando-sim-cursor-z);
  }
</style>


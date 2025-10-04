## Svelte 5 pie menu implementation aligned with Kando (data, theme, and code compatible)

Goal: Build a Svelte 5/SvelteKit implementation of Kando’s pie menu that reuses (and where practical, copies verbatim) Kando’s code, APIs, schemas, algorithms, and contracts, while preserving attribution and licenses. Keep naming and structure aligned so both projects stay in sync; use Svelte 5 only as the packaging/rendering layer. No editor in Svelte initially—design menus/themes in Kando and import them into Svelte apps (e.g., Micropolis) seamlessly. Eventually add a SvelteKit editor.

### High-level requirements

- Load and render Kando menu JSONs and Kando menu themes (theme.json5 + theme.css) as-is.
- Reproduce Kando’s geometry and interaction (angles, wedges, connectors, selection chain, hover/drag/click semantics) so the same data yields the same UX.
- Keep engine concerns (geometry, input, state) separate from skinning (theme layers + CSS custom properties) and from app wiring (SvelteKit-specific loading and routes).
- Svelte 5 features: use runes ($state/$derived/$effect) for local state/derivations, pass snippets for theme layer templating, and provide small, composable components.

---

## Compatibility surface (what must match Kando)

### Menu JSON shape (reader contract)

Kando example (`src/main/example-menus/*.json`) shows top-level fields and item tree. Svelte must accept:

- Top-level menu object properties (as produced by Kando editor):
  - `shortcut`: string (unused by Svelte at runtime, but preserved)
  - `shortcutID`: string (unused in Svelte)
  - `centered`: boolean
  - `anchored?`: boolean
  - `hoverMode?`: boolean
  - `conditions?`: { appName?, windowName?, screenArea? } (ignored unless consumer app wants ambient conditions)
  - `root`: `MenuItem`

- `MenuItem` (union by `type`):
  - Common:
    - `type`: 'submenu' | 'command' | 'file' | 'hotkey' | 'macro' | 'text' | 'uri' | 'redirect' | 'settings'
    - `name`: string
    - `icon?`: string
    - `iconTheme?`: string (e.g., 'material-symbols-rounded', 'simple-icons', 'system', etc.)
    - `angle?`: number (fixed angle in degrees; obey Kando’s fixed angles policy)
    - `children?`: `MenuItem[]` (for 'submenu')
  - Type-specific `data` payloads (pass-through):
    - 'command': `{ command: string }`
    - 'file': `{ path: string }`
    - 'hotkey': `{ hotkey: string; delayed?: boolean }`
    - 'macro': `{ keys: KeySequence }`
    - 'text': `{ text: string }`
    - 'uri': `{ uri: string }`
    - 'redirect': `{ path: string }`
    - 'settings': `{ dialog?: string }`

Svelte renderer should treat items as opaque actions and emit `select(path, item)`; host app decides execution.

### Theme JSON5 + CSS shape (reader contract)

Theme JSON5 fields (see `assets/menu-themes/*/theme.json5`):

- Identity: `name`, `author`, `license`, `themeVersion`, `engineVersion` (Svelte should accept engineVersion >= 1)
- Layout flags:
  - `maxMenuRadius`: pixels used to clamp away from edges
  - `centerTextWrapWidth`: px width for text wrap in center
  - `drawChildrenBelow`: boolean (z-order)
  - `drawCenterText`: boolean
  - `drawSelectionWedges`: boolean
  - `drawWedgeSeparators`: boolean
- `colors`: Record<string, CSSColor> (becomes CSS custom properties `--<name>`)
- `layers`: array of `{ class: string; content: 'none' | 'name' | 'icon' }`

Theme CSS assumptions:

- CSS operates on DOM structure created by the engine:
  - Container `div.menu-node` per item, plus a `.connector` under nodes with children.
  - Theme engine creates one div per `layer.class` inside each `.menu-node` and may inject an `.icon-container` or name text depending on `content`.
- Engine sets CSS custom props every frame:
  - For children: `--angle-diff`
  - For center layers: `--pointer-angle`, `--hover-angle`, `--hovered-child-angle`
- Engine sets static per-item CSS variables on `.menu-node` elements:
  - `--dir-x`, `--dir-y`, `--angle`, `--parent-angle?`, `--sibling-count`

Svelte must adhere to the same DOM/CSS contract to make Kando themes work without changes.

### Icons and icon themes

- Kando uses an `IconThemeRegistry` to materialize icons from different sources:
  - Material Symbols font (rounded), Simple Icons font, Emoji, system icon data URLs, file icon themes.
- In Svelte, provide an injectable icon resolver that mirrors Kando semantics:
  - 'material-symbols-rounded': render `<i class="material-symbols-rounded">glyph</i>`; include package/font CSS.
  - 'simple-icons'/'simple-icons-colored': render `<i class="si si-<name>"></i>` or SVG fallback.
  - 'file-icon-theme': map to URL space; allow mounting a theme directory.
  - 'system': host app provides name→data URL mapping (optional).

---

## Geometry, interaction, and rendering rules (compat)

Re-implement Kando math in Svelte (1:1 behavior):

- Angles and wedges:
  - Compute child angles with `computeItemAngles(children, parentAngle?)`, honoring fixed angles (monotonic increasing, clamp to [0, 360) for first, remove duplicates and overflow beyond first+360).
  - Compute wedges with `computeItemWedges(angles, parentAngle?)` and scale wedges inward by 50% toward center (see Kando’s `scaleWedge`). Optionally produce `parentWedge`.
  - Angle conventions: 0° = top, 90° = right, 180° = bottom; `getAngle(vec)` uses atan2(y, x) transformed accordingly.

- Selection chain:
  - Maintain a stack `[root, ..., current]`. Selecting a parent pops; selecting a child pushes.
  - Center position is root position plus relative offsets of chain items; children positions are derived from angle and current distance.
  - Clamp center for submenus to keep `maxMenuRadius` fully visible; optionally emit “move-pointer” if you implement pointer warp (desktop).

- Input methods (initial scope):
  - Pointer/touch: hover detection based on current angle vs wedge arcs, `centerDeadZone` for parent hover logic, clicked and dragged states.
  - Gestures (optional in v1): marking/turbo modes; reproduce Kando’s `GestureDetector` thresholds and behaviors (min stroke length, jitter, pause, fixedStrokeLength).
  - Keyboard (optional): numeric/alpha selections; Backspace selects parent; Escape cancels.
  - Gamepad (later): normalized axes and button mapping; keep semantics if needed.

- DOM + classes:
  - Use exactly the class names Kando expects: `.menu-node`, `.connector`, and state classes (`active`, `parent`, `child`, `grandchild`, `hovered`, `clicked`, `dragged`, `level-N`, `type-<type>`).
  - For direction-based styling, set `.left/.right/.top/.bottom` heuristic classes as Kando does.

---

## Svelte 5 architecture

### Packages and layers

- `@kando-svelte/core` (Svelte library folder inside your app):
  - Pure TS math (angles, wedges, clamp)
  - Types (mirroring Kando’s `common/index.ts` subset)
  - Renderer store/state (selection chain, input state)
  - Icon resolver interface + default resolvers
- `@kando-svelte/svelte-components`:
  - `PieMenu.svelte`: orchestrates rendering; accepts `root`, `theme`, `options` and emits `select`, `cancel`, `hover`, `unhover`, `movePointer?` events
  - `PieItem.svelte`: renders a single `.menu-node` (recursive)
  - `SelectionWedges.svelte` and `WedgeSeparators.svelte`
  - `CenterText.svelte` (optional)
  - Theme layer rendering helpers/snippets
- `@kando-svelte/sveltekit`:
  - SvelteKit loaders/adapters for reading theme.json5 and injecting theme.css links
  - Vite plugin config for fonts/icons (Material Symbols, Simple Icons)

### Types (compat subset)

```ts
export type Vec2 = { x: number; y: number };

export type ShowMenuOptions = {
  mousePosition: Vec2;
  windowSize: Vec2;
  zoomFactor: number;
  centeredMode: boolean;
  anchoredMode: boolean;
  hoverMode: boolean;
  systemIconsChanged?: boolean;
};

export type MenuItem = {
  type: 'submenu' | 'command' | 'file' | 'hotkey' | 'macro' | 'text' | 'uri' | 'redirect' | 'settings';
  name: string;
  icon?: string;
  iconTheme?: string;
  angle?: number;
  children?: MenuItem[];
  data?: unknown; // preserved opaque payload
};

export type MenuThemeDescription = {
  id: string;          // filled by loader based on directory name
  directory: string;   // absolute dir path; used to resolve CSS
  name: string;
  author: string;
  themeVersion: string;
  engineVersion: number; // expect >= 1
  license: string;
  maxMenuRadius: number;
  centerTextWrapWidth: number;
  drawChildrenBelow: boolean;
  drawCenterText: boolean;
  drawSelectionWedges: boolean;
  drawWedgeSeparators: boolean;
  colors: Record<string, string>;
  layers: { class: string; content: 'none' | 'name' | 'icon' }[];
};
```

### State and reactivity with Svelte 5 runes

- `$state` to hold local mutable state:
  - `selectionChain`, `hoveredItem`, `clickedItem`, `draggedItem`
  - `latestInput` (angle, distance, absolute/relative position, button state)
  - `rootPosition`, `showMenuOptions`, `hideTimeout?`
- `$derived` for computed geometry:
  - `currentCenterPosition`, `childDirections`, `clampedCenter`, `separatorAngles`
  - CSS-friendly properties per item (dir vectors, angle diff)
- `$effect` to:
  - Inject and update theme link element and color CSS props when theme changes
  - Register/unregister event listeners (pointer/move/up, keydown/up)

### Component design

- `PieMenu.svelte`
  - Props: `{ root: MenuItem; theme: MenuThemeDescription; options?: Partial<ShowMenuOptions>; iconResolver?: IconResolver }`
  - Emits: `select(path: string, item: MenuItem)`, `cancel()`, `hover(path)`, `unhover(path)`
  - Responsibilities:
    - Initialize theme (inject theme.css via `<link>`; set CSS registerProperty if available)
    - Build `RenderedMenuItem` tree: assign paths `/`, `/0`, …; compute angles & wedges recursively
    - Manage selection chain and transforms; set CSS variables and classes on nodes
    - Mount optional `SelectionWedges` and `WedgeSeparators` if theme flags are true
    - Handle input modes (hover/marking/turbo as configured); expose hooks to plug gesture detector when needed

- `PieItem.svelte`
  - Renders one `.menu-node` with per-theme layers
  - Sets static CSS variables (`--dir-x`, `--dir-y`, `--angle`, `--sibling-count`, `--parent-angle?`)
  - Updates layer angle props on center (`--pointer-angle`, `--hover-angle`, `--hovered-child-angle`)
  - Emits hover/click/drag events up to `PieMenu`

- `SelectionWedges.svelte`
  - Full-screen container setting `--center-x/--center-y`, `--start-angle/--end-angle` on hover

- `WedgeSeparators.svelte`
  - Renders absolute `div.separator` lines rotated to `--angle`, positioned from the center

### Theme compatibility layer

At mount or theme change:

1. Inject `<link id="svelte-kando-menu-theme" rel="stylesheet" href="file://<directory>/<id>/theme.css">` (or serve via SvelteKit static assets). Remove previous link if present.
2. Register CSS properties if supported:
   - `--angle-diff` as `<number>`
   - `--pointer-angle`, `--hover-angle`, `--hovered-child-angle` as `<angle>`
3. Apply `theme.colors` to `document.documentElement.style.setProperty('--'+name, color)`; on color change, update directly.
4. Build per-item layers according to `theme.layers`:
   - If `content === 'icon'`, create an `.icon-container` and append icon element from the icon resolver.
   - If `content === 'name'`, set innerText to item name.

### SvelteKit integration

- Theme and menu loading strategies:
  - Static bundle: copy Kando-exported themes under `static/menu-themes/<id>/` and import theme JSON5 via a small loader that resolves `directory` and `id` based on file path.
  - User-provided themes at runtime: expose an origin or file-system adapter; compute `file://` or `base`-relative URLs to CSS.
- Fonts and icon CSS: include Material Symbols and Simple Icons CSS in `app.html` or via layout to ensure theme CSS selectors resolve.
- SSR beware: DOM APIs (registerProperty, document.head) only in browser; gate via `onMount` or `$effect` with `browser` guard.

---

## Settings compatibility (Kando → Svelte)

Adopt Kando’s schemas for plug‑and‑play, but only enforce the subset that affects web rendering/input; keep the rest for round‑trip with Kando’s editor.

- Must support (renderer behavior)
  - Per menu (MENU_SCHEMA_V1): `root`, `centered`, `anchored`, `hoverMode`, `tags`, `conditions` (optional to use), `shortcut`, `shortcutID` (store, usually ignore in web).
  - Per item (MENU_ITEM_SCHEMA_V1): `type`, `name`, `icon`, `iconTheme`, `children`, `angle`, `data` (opaque to renderer; host app executes).
  - General (GENERAL_SETTINGS_SCHEMA_V1):
    - Visuals/timing: `zoomFactor`, `fadeInDuration`, `fadeOutDuration`.
    - Input/interaction: `centerDeadZone`, `minParentDistance`, `dragThreshold`, `enableMarkingMode`, `enableTurboMode`, `hoverModeNeedsConfirmation`, `gestureMinStrokeLength`, `gestureMinStrokeAngle`, `gestureJitterThreshold`, `gesturePauseTimeout`, `fixedStrokeLength`, `rmbSelectsParent`, `enableGamepad`, `gamepadBackButton`, `gamepadCloseButton`, `sameShortcutBehavior`.
    - Theming/sounds: `menuTheme`, `darkMenuTheme`, `enableDarkModeForMenuThemes`, `menuThemeColors`, `darkMenuThemeColors`, `soundTheme` (optional in web), `soundVolume`.

- Optional (web nice‑to‑have)
  - Sound themes with Howler honoring `soundTheme` and `soundVolume`.
  - Dark‑mode switch honoring `enableDarkModeForMenuThemes` + system theme.

- Store but ignore in Svelte (Electron/OS chrome)
  - `locale`, `showIntroductionDialog`, `settingsWindowColorScheme`, `settingsWindowFlavor`, `trayIconFlavor`, `hardwareAcceleration`, `lazyInitialization`, `hideSettingsButton`, `settingsButtonPosition`, `keepInputFocus`, `warpMouse`, `enableVersionCheck`, `useDefaultOsShowSettingsHotkey`.
  - `conditions` may be evaluated only if the host app provides a mapping (e.g., Micropolis in‑game context) – otherwise ignore in the browser.

- Svelte/web extensions
  - Namespaced under `svelte`, e.g.:
    - `svelte: { actionDispatcher?: (item) => void; mountSelector?: string; pointerLock?: boolean }`
  - Keep extensions additive; never mutate Kando’s fields.

- Loader responsibilities
  - Accept Kando settings and menus unmodified.
  - Pick a menu by name/tag; optionally match `conditions` via host‑provided predicates.
  - Resolve theme JSON5 → `{ id, directory }` and inject theme CSS; apply `menuThemeColors` with dark‑mode variant when enabled.

- Decision
  - Import entire Kando schemas; use the renderer/input/theming subset; ignore OS/Electron chrome; add namespaced Svelte extensions. This keeps you interoperable with Kando’s editor and future schema updates.

---

## Code re‑use inventory (what to import vs rewrite)

Maximize reuse by importing Kando source where it’s renderer/platform‑agnostic; rewrite only DOM/Svelte bits.

- Directly reusable (portable TS)
  - `src/common/math/index.ts`: vectors, angles, wedges, clamping.
  - `src/common/index.ts` (renderer‑safe types): `Vec2`, `ShowMenuOptions`, `MenuThemeDescription`, `SoundType`, `SoundThemeDescription`, `KeyStroke/KeySequence`.
  - `src/common/settings-schemata/*.ts`: zod schemas for menus and general settings.
  - `src/menu-renderer/input-methods/input-method.ts`: base input contracts (callbacks only).
  - `src/menu-renderer/input-methods/gesture-detector.ts`: geometry + timers; replace Node `EventEmitter` with a tiny dispatcher.
  - `src/menu-renderer/input-methods/gamepad.ts`: Web Gamepad API; same emitter note.
  - `src/menu-renderer/sound-theme.ts`: Howler wrapper (guard in client‑only lifecycle).

- Reuse with small shims
  - `src/menu-renderer/menu-theme.ts`:
    - Keep: CSS property registration, `loadDescription`, `setColors`, child/center angle property setters.
    - Adapt: layer DOM creation (`createItem`) to Svelte components/refs; set CSS vars via bindings, not `querySelector`.
  - `src/menu-renderer/selection-wedges.ts`, `wedge-separators.ts`: re‑express as Svelte components emitting the same DOM/CSS variables.

- Rewrite in Svelte
  - `src/menu-renderer/menu.ts`: imperative DOM, transforms, classes, connectors. Rebuild as component state + derived props:
    - Keep algorithms (selection chain, connectors smoothing) but compute in `$derived` and bind to style/class.
  - Icon registry (`src/common/icon-themes/*`): implement a web resolver (Material Symbols, Simple Icons, user URLs/data URIs). System/file themes via backends are not available in browser.
  - IPC (`menu-window-api.ts`, `common-window-api.ts`): replace with Svelte events/props.

- Not applicable (skip)
  - `src/main/**` (Electron host, backends, actions, tray, notifications, settings window).

- Portability highlights
  - Gesture recognizer: portable with an emitter shim; thresholds map 1:1 from settings.
  - Layout algorithms: fully portable (in `common/math`).
  - Connectors: reuse `getClosestEquivalentAngle` and accumulate last angles; bind width/rotation via style.
  - Theme engine: reuse angle/child property logic and color application; wire to Svelte refs.
  - Sounds: Howler works in browser/Electron; init only on client.

- Optional refactor upstream (improves reuse)
  - Extract a `kando-core` workspace package exporting: `common/math`, renderer‑safe `common` types, zod schemas, theme helpers (angle smoothing).
  - Split `menu-theme.ts` into DOM‑free helpers and DOM‑bound layer builders.
  - Replace `EventEmitter` in renderer utilities with a minimal event interface usable in browsers.
---

## Input model (pointer first)

Define an `InputState` compatible with Kando:

```ts
export enum ButtonState { Released, Clicked, Dragged }
export type InputState = {
  button: ButtonState;
  absolutePosition: Vec2;
  relativePosition: Vec2;
  distance: number;
  angle: number;
};
```

Pointer/touch handlers should:

- Maintain `clickPosition`, `keydownPosition` (for turbo/hover modes later) and `centerPosition` (current submenu center) to compute `relativePosition` and `angle`.
- Switch to `Dragged` when `dragThreshold` exceeded (Marking mode), or when modifiers pressed (Turbo) beyond threshold.
- Emit selection on pointer up (Click) or when gesture detector fires (Marking/Turbo), with `SelectionType` hint: ActiveItem/SubmenuOnly/Parent.

Gesture detector (optional v1) mirrors Kando’s: min stroke length, jitter threshold, pause timeout, and distance-based selection via `fixedStrokeLength`.

---

## Events and host API

`<PieMenu>` emits:

- `select(path: string, item: MenuItem)` – host executes action (open URI, run command, etc.)
- `cancel()`
- `hover(path: string)` / `unhover(path: string)` (optional)
- `movePointer(dist: Vec2)` (desktop only; no-op in browsers)

Props/control:

- `root: MenuItem`
- `theme: MenuThemeDescription`
- `options?: Partial<ShowMenuOptions>` (centered/anchored/hoverMode)
- `settings?: Partial<GeneralSettingsV1> & { svelte?: Record<string, unknown> }` (dragThreshold, fade durations, gesture thresholds, etc.)

---

## Example usage (SvelteKit)

```svelte
<!-- +page.svelte -->
<script lang="ts">
  import PieMenu from '$lib/kando-svelte/PieMenu.svelte';
  import { onMount } from 'svelte';

  let menu: MenuItem;         // loaded from a Kando-exported JSON
  let theme: MenuThemeDescription; // loaded from theme.json5 and enhanced with id+directory

  function onSelect(path: string, item: MenuItem) {
    // App decides how to act on item.type and item.data
  }

  onMount(async () => {
    menu = await fetch('/menus/macos.json').then(r => r.json());
    theme = await loadKandoTheme('/menu-themes/default/theme.json5');
  });
</script>

{#if menu && theme}
  <PieMenu {menu} root={menu.root} {theme}
           on:select={(e) => onSelect(e.detail.path, e.detail.item)} />
{/if}
```

Theme loader should parse JSON5, set `id` from parent dir, and `directory` to that dir path for resolving `theme.css` as `file://<directory>/<id>/theme.css` or app-relative URL.

---

## Micropolis integration notes

- Micropolis can author menus with Kando’s editor and export:
  - Menus: place JSON under `static/menus/` or fetch from a CMS
  - Themes: place under `static/menu-themes/<id>/` with unmodified `theme.json5` + `theme.css`
- Use Micropolis-specific action dispatchers for 'command'/'uri'/'hotkey' etc., or translate to game engine events.
- Consider turning on `centered` and `anchored` for console/controller UX.

---

## Edge cases and risks

- Fixed angles must be monotonically increasing after normalization; if not, ignore later duplicates—match Kando’s `fixFixedAngles`.
- Theme engineVersion mismatch: warn and attempt best-effort (engine v1 expected).
- SSR pitfalls: only inject theme CSS in browser; guard API usage.
- Icons: Material/Simple Icons versions and CSS class names must match the theme’s expectations; include appropriate CSS.
- System icons: not available in the browser; provide stub icon theme or map names to app-provided assets.

---

## Roadmap (post-v1)

- Full gesture support (Marking/Turbo) with configurable thresholds
- Gamepad input with stick hover and button mapping
- Sound themes (Howler) with `SoundThemeDescription`
- Theme editor preview inside Svelte (read-only)
- Menu editor (longer-term; keep Kando as the primary authoring tool for now)

---

## License and provenance

This project intentionally reuses—and where practical, copies—Kando’s source code, APIs, schemas, algorithms, and contracts to maximize compatibility and ease of synchronization. Preserve original copyright headers and SPDX identifiers, retain license notices, and attribute the Kando project and its author. Kando is licensed under MIT; theme assets and fonts carry their own licenses (e.g., CC0-1.0 for the default theme, Material Symbols, Simple Icons). Ensure all copied files keep their original licenses and attributions.

---
### Addendum: direct import strategy (preferred)

Where possible, import Kando source directly instead of reimplementing:

- Import as‑is
  - `@kando/common/math/*` → `../src/common/math/*`
  - `@kando/common/*` (renderer‑safe types only) → `../src/common/*`
  - `@kando/schemata/*` → `../src/common/settings-schemata/*`
  - `@kando/gesture` → `../src/menu-renderer/input-methods/gesture-detector`
  - `@kando/gamepad` → `../src/menu-renderer/input-methods/gamepad`
  - `@kando/sound-theme` → `../src/menu-renderer/sound-theme`

- Minimal shims
  - `events` (Node EventEmitter) used by gesture/gamepad: alias to a tiny emitter or bundle a small emitter polyfill so imports work unchanged.
  - `menu-theme.ts`: import and use `loadDescription`, `setColors`, `setChildProperties`, `setCenterProperties`; avoid `createItem` (Svelte builds layers in markup).

- Path aliases (dev in monorepo)
  - kando-svelte/tsconfig.json:
    ```json
    {
      "compilerOptions": {
        "baseUrl": ".",
        "paths": {
          "@kando/common/*": ["../src/common/*"],
          "@kando/schemata/*": ["../src/common/settings-schemata/*"],
          "@kando/gesture": ["../src/menu-renderer/input-methods/gesture-detector.ts"],
          "@kando/gamepad": ["../src/menu-renderer/input-methods/gamepad.ts"],
          "@kando/sound-theme": ["../src/menu-renderer/sound-theme.ts"]
        }
      }
    }
    ```
  - kando-svelte/vite.config.ts:
    ```ts
    import { defineConfig } from 'vite';
    import { fileURLToPath } from 'node:url';

    const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

    export default defineConfig({
      resolve: {
        alias: {
          '@kando/common': r('../src/common'),
          '@kando/schemata': r('../src/common/settings-schemata'),
          '@kando/gesture': r('../src/menu-renderer/input-methods/gesture-detector.ts'),
          '@kando/gamepad': r('../src/menu-renderer/input-methods/gamepad.ts'),
          '@kando/sound-theme': r('../src/menu-renderer/sound-theme.ts'),
          // optional: alias 'events' to a tiny emitter polyfill if needed
        }
      }
    });
    ```

- Publishing strategy
  - For npm publishing, either extract a shared `kando-core` workspace package that re‑exports these files and depend on it, or bundle the imported sources into the kando‑svelte build so consumers don’t need the monorepo.

- Math: import directly (preferred)
  - Use `import * as math from '@kando/common/math';` rather than reimplementing. The earlier “Porting Kando math” sketch is only a fallback if decoupling is required.
---

---
## Configuration parity with Kando (config.json, menus.json)

Kando stores settings in two JSON files: `config.json` (general) and `menus.json` (menus/collections). The Svelte integration should accept the same shapes and semantics, with web‑appropriate loading and validation.

- Where to load from
  - Web/SvelteKit: serve these files from `static/` (public) or fetch from your own backend. Keep the exact file names so exports from Kando can be dropped in.
  - Electron (optional): you can also point at the OS config directory, but for Micropolis/SvelteKit, prefer app‑local assets.

- Hot reload and validation
  - Use the existing zod schemas from Kando (`GENERAL_SETTINGS_SCHEMA_V1`, `MENU_SETTINGS_SCHEMA_V1`) to validate on load.
  - On save/HMR, re‑validate; if invalid, log and ignore the change (don’t update state), mirroring Kando’s behavior.
  - Optional: show a non‑blocking banner if the last change failed validation.

- General settings (config.json)
  - Import and honor all renderer/input/theming fields (see Settings compatibility above). Defaults match Kando’s docs (e.g., `zoomFactor: 1`, `centerDeadZone: 50`, `dragThreshold: 15`, fade timings, gesture thresholds, etc.).
  - Ignored in web (but preserved): Electron window chrome settings, tray icon flavor, OS hotkey handling.
  - Dark mode: if `enableDarkModeForMenuThemes` is true, switch theme and color overrides when `window.matchMedia('(prefers-color-scheme: dark)')` changes.

- Menus (menus.json)
  - Accept the full structure: `{ version, menus: Menu[], collections: MenuCollection[] }`.
  - Per‑menu properties: `root`, `shortcut`, `shortcutID`, `centered`, `anchored`, `hoverMode`, `conditions`, `tags`.
    - `shortcut/shortcutID`: store for round‑trip, usually ignore in the web demo.
    - `conditions`: allow app‑provided predicates (Micropolis can map in‑game state to “appName/windowName/screenArea” analogs). Otherwise ignore.
  - Collections: accept and surface as tags/filters in the demo UI if desired.

- Menu items (types and data)
  - Supported types map as follows in Svelte:
    - `submenu`: structure only.
    - `uri`: open via `window.open` (respect `rel=noopener` and user gesture policies).
    - `text`: copy/paste or in‑app paste actions (browser clipboard API).
    - `redirect`: navigate to a different menu path.
    - `command`/`file`/`hotkey`/`macro`/`settings`: require host integration (Electron/Kando backends) or Micropolis‑specific adapters. In the Svelte demo, stub with no‑ops or console messages; document how Micropolis implements these.
  - `angle` field follows Kando’s monotonic fixed‑angle rules; reuse `fixFixedAngles` and `computeItemAngles`.
  - `delayed` semantics (execute after fade‑out) remain; in the browser demo, simulate by deferring handlers until the close animation ends.

---
## Themes, sounds, and icons (concrete handling)

- Menu themes
  - Directory layout: `<theme-id>/{ theme.json[5], theme.css, preview.jpg? }`.
  - Load `theme.json` (JSON/JSON5), set `id` from folder name and `directory` to parent path; inject `theme.css` via `<link>`.
  - Color overrides: apply `menuThemeColors[theme.id]` from `config.json` as CSS custom properties; support dark‑mode variant when enabled.
  - Theme selection UI in demo: list subfolders in `static/menu-themes/` (or from an index file) and allow switching at runtime.

- Sound themes (Howler)
  - Directory layout: `<sound-id>/theme.json[5] + audio files`.
  - Use Howler to play `SoundType` → file mappings; support per‑sound `volume`, `minPitch`, `maxPitch`, and global `soundVolume`.
  - Safari/iOS unlock: call a muted play() on first user gesture to resume the audio context.
  - Optional preloading: warm up key sounds on app load.

- Icon themes
  - Built‑ins: Material Symbols Rounded, Simple Icons (plain/colored), Emoji, Base64/URL. Load needed CSS/fonts in `app.html`.
  - System/file icon themes require platform backends; in web demo, provide a “user theme” bucket (URLs or project assets). Keep the same `iconTheme` names for drop‑in compatibility.
  - Adaptive colors: use `currentColor` in SVGs to let theme CSS recolor icons, as per Kando docs.

---
## Practical defaults for the demo

- Place Kando exports in:
  - `static/menus/` (menus.json or multiple named menus)
  - `static/menu-themes/<id>/` (theme.json5 + theme.css)
  - `static/sound-themes/<id>/` (theme.json5 + wav/ogg)
- Demo page shows:
  - Active theme selector (reads folders and switches `<link>`)
  - Active menu selector (reads menus list)
  - Sound theme toggle + volume slider
  - Live JSON validator result (valid/invalid)
- Execution adapters:
  - Implement `uri`, `text`, `redirect` in browser.
  - Expose an interface for Micropolis to provide adapters for `command`, `file`, `hotkey`, `macro`, `settings`.

---
## Recommendations extracted from Kando docs (TL;DR)

- Keep zod validation in the load path and block state updates on invalid JSON.
- Mirror defaults exactly; users expect the same feel (dead zone 50px, thresholds, fades).
- Treat dark‑mode as a theme switch, not a stylesheet filter; support separate color overrides.
- Preload sounds and use small pitch randomization for UI polish (as in Kando).
- Prefer SVG icons with `currentColor` for theme‑driven recoloring; fall back to PNG for external packs.
- For conditions and OS integrations, make them host‑provided so the same menus can run in Micropolis or Electron without Svelte changes.
---

## Implementation plan: kando-svelte library and static kando-svelte-demo

1) Monorepo and workspaces
- Root package.json: add workspaces for "kando-svelte" and "kando-svelte-demo".
- Use npm workspaces; keep library and demo independent (lib has no adapter, demo uses adapter-auto).

2) kando-svelte (library)
- Goal: publishable Svelte lib exposing PieMenu and helpers, reusing Kando code directly.
- Imports (direct): add TS/Vite aliases to reference Kando’s sources:
  - @kando/common/* -> ../src/common/* (types + math)
  - @kando/schemata/* -> ../src/common/settings-schemata/* (zod)
  - @kando/gesture -> ../src/menu-renderer/input-methods/gesture-detector.ts
  - @kando/gamepad -> ../src/menu-renderer/input-methods/gamepad.ts
  - @kando/sound-theme -> ../src/menu-renderer/sound-theme.ts
- Minimal emitter shim: if needed, alias Node EventEmitter to a tiny emitter so gesture/gamepad can import unchanged.
- Components:
  - src/lib/PieMenu.svelte: orchestrates theme inject, selection chain, input, events; emits select/cancel/hover.
  - src/lib/PieItem.svelte: renders a single node; binds CSS vars (--dir-x/--dir-y/--angle/--sibling-count/--parent-angle).
  - src/lib/SelectionWedges.svelte & src/lib/WedgeSeparators.svelte: global visuals driven by CSS vars.
- Theme engine:
  - Reuse menu-theme.ts functions: loadDescription, setColors, setChildProperties, setCenterProperties; set vars via bind:this refs.
  - Inject theme.css <link> and apply color overrides.
- Math & geometry:
  - Use @kando/common/math directly: computeItemAngles, computeItemWedges, clampToMonitor, etc.
- Sounds:
  - Wrap Howler usage from @kando/sound-theme; guard in onMount.
- Types & settings:
  - Export renderer-safe types mirroring Kando (Vec2, MenuItem, MenuThemeDescription, ShowMenuOptions).
  - Accept settings subset via props; provide defaults matching Kando.
- Packaging:
  - Configure svelte-package output (dist), proper exports map; exclude dev-only aliases from published build or bundle imported TS.

3) kando-svelte-demo (SvelteKit app)
- Static snapshot layout under static/:
  - static/kando-snapshot/
    - config.json (Kando general settings)
    - menus.json (Kando menus/collections)
    - menu-themes/<id>/{ theme.json5, theme.css, preview.jpg? }
    - sound-themes/<id>/{ theme.json5, *.wav/ogg }
- Loaders/utilities:
  - Fetch and validate config.json / menus.json using zod schemas (@kando/schemata/*).
  - Discover themes (list subfolders) and inject selected theme.css; apply color overrides + dark-mode variants.
  - Load sound theme (Howler) and set master volume.
- Demo UI:
  - Theme selector (dropdown), sound theme + volume, menu selector (from menus.json), validity indicator.
  - Render <PieMenu root={menu.root} theme={theme} settings={configSubset} on:select={...} />
- Execution adapters:
  - Implement browser-safe handlers for uri/text/redirect.
  - Surface optional hooks for Micropolis to provide command/file/hotkey/macro/settings behaviors.
- SPA behavior:
  - SSR guards for DOM/Howler; prerender true is fine if data is static.

4) Direct-import configuration
- kando-svelte/tsconfig.json: add paths for @kando/common, @kando/schemata, @kando/gesture, @kando/gamepad, @kando/sound-theme.
- kando-svelte/vite.config.ts: add matching resolve.alias; optionally alias 'events' to a tiny emitter.
- For publishing: either bundle imported Kando sources into the lib build or extract a shared workspace package (kando-core) exporting common/math/schemata.

5) Selection & input details (parity)
- Build selection chain; compute child angles/wedges; clamp center; accumulate last connector angles (closest-equivalent) to avoid 360° flips.
- Pointer/touch: hover hit-testing vs wedges; Dragged threshold; Hover/Marking/Turbo modes and gesture detector thresholds.
- Keyboard shortcuts (optional): numeric/alpha to select children; Backspace selects parent; Escape cancels.
- Gamepad: stick → relative position; back/close buttons; center anchored placement.

6) Validation & hot reload in demo
- On each snapshot file change (dev), refetch and validate; if valid, update state; if invalid, show error and keep prior state.
- Include a compact error viewer to mirror Kando’s console output.

7) Testing
- Reuse Kando’s math tests (test/math.spec.ts) to verify ported/aliased math; adapt harness to Vitest in the demo if desired.
- Add a few component tests (rendering classes/vars) later.

8) Build & run
- Lib: npm run -w kando-svelte package (svelte-package)
- Demo: npm run -w kando-svelte-demo dev -- --open
- Workspaces: root npm install to link workspace deps; demo depends on "kando-svelte": "workspace:*".

9) Future steps
- Icon resolver for user-provided icon packs; optional system icon bridge in Electron.
- Theme editor preview (read-only) and ultimately a Svelte menu editor.
- Micropolis adapter package implementing command/file/hotkey/macro.
---

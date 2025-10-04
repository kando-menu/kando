## Svelte 5 pie menu implementation aligned with Kando (code-compatible)

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

## Porting Kando math to TS (sketch)

Implement the following in `@kando-svelte/core/math` mirroring Kando’s behavior:

```ts
export function toDegrees(rad: number): number; export function toRadians(deg: number): number;
export function getLength(v: Vec2): number; export function add(a: Vec2, b: Vec2): Vec2;
export function subtract(a: Vec2, b: Vec2): Vec2; export function getAngle(v: Vec2): number; // 0° top
export function getDirection(angle: number, len: number): Vec2; // 0° top
export function getAngularDifference(a: number, b: number): number; // [0,180]
export function getClosestEquivalentAngle(angle: number, to?: number): number;
export function getEquivalentAngleSmallerThan(angle: number, than?: number): number;
export function getEquivalentAngleLargerThan(angle: number, than?: number): number;
export function normalizeConsequtiveAngles(a: number, b: number, c: number): [number, number, number];
export function isAngleBetween(angle: number, start: number, end: number): boolean;
export function clampToMonitor(center: Vec2, radius: number, size: Vec2): Vec2;

export function fixFixedAngles(items: { angle?: number }[]): void;
export function computeItemAngles(items: { angle?: number }[], parentAngle?: number): number[];
export function computeItemWedges(itemAngles: number[], parentAngle?: number): {
  itemWedges: { start: number; end: number }[];
  parentWedge?: { start: number; end: number };
};
```

These must be behaviorally identical to Kando’s to preserve layout, hover, and connector visuals across themes.

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

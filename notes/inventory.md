## Kando repository inventory and deep dive (pie menu + macOS)

This document is a guided tour of the Kando codebase, with a strong focus on the JavaScript/HTML/CSS pie menu engine, its APIs, extension points, and theming; an enumeration of platform drivers; and an in-depth look at the macOS backend and native bridge. Use it as a map for navigating and extending the project.

### Top-level layout (what lives where)

- **src/**: Application code.
  - **main/**: Electron host (main) process
    - Creates windows, binds shortcuts, chooses and drives the platform backend, houses item actions, exposes IPC to renderers.
    - Key files:
      - `index.ts`: process bootstrap, CLI/deeplink parsing, backend selection, settings/theme directories, i18n init, app lifecycle.
      - `app.ts` (exported as `KandoApp`): application core; owns `MenuWindow`, `SettingsWindow`, tray UI, settings and menu settings objects, update checker, and IPC wiring to both renderers.
      - `menu-window.ts`: full-screen transparent window hosting the pie menu renderer; moves/zooms window, passes `ShowMenuOptions` to the renderer, manages inhibit/restore of shortcuts, macOS/Linux/Windows visibility/focus quirks.
      - `settings-window.ts`: window for the React settings UI; flavor-dependent transparency (Acrylic on Windows, vibrancy on macOS).
      - `backends/`: platform drivers (see “Platform backends” below).
      - `item-actions/`: executable behaviors for menu items (`command`, `file`, `hotkey`, `macro`, `text`, `uri`, `redirect`, `settings`), registered via `ItemActionRegistry`.
      - `settings/`: general + menu settings shape and persistence.
      - `utils/`: notifications, shell helpers, version checking.
      - `example-menus/`: OS-specific starter menus in JSON.
  - **menu-renderer/**: Pie menu UI (DOM + CSS + behaviors) running in a sandboxed/isolated renderer process.
    - Entry `index.ts` wires theme, sound, icon registry, settings button, and menu event handlers.
    - `menu.ts`: the core pie menu state machine and renderer (selection chain, wedges, connectors, input integration, geometry).
    - `menu-theme.ts`: theming engine for layered DOM + CSS custom properties.
    - `sound-theme.ts`: sound theming via Howler.
    - `rendered-menu-item.ts`: runtime item properties appended to `MenuItem` (angles, wedges, DOM nodes, etc.).
    - `input-methods/`: `pointer-input` (mouse/touch with gestures; Marking/Turbo/Hover), `gamepad-input` (+ polling helper `gamepad`), plus base `input-method` types.
    - `selection-wedges.ts` and `wedge-separators.ts`: optional background visuals driven by theme flags.
    - `menu-window-api.ts`: renderer-side IPC surface (paired with `menu-window.ts`).
    - `index.html` + `index.scss`: host page and default renderer styles (also pulls font icon CSS).
  - **settings-renderer/**: React settings app (component library, dialogs, preview, pickers, state via Zustand, preload + IPC API). Useful when editing themes/menus and testing backends, but not required to understand menu runtime.
  - **common/**: Shared types and utilities.
    - `index.ts`: Type exports and core shared types: `Vec2`, `MenuThemeDescription`, `SoundThemeDescription`, `ShowMenuOptions`, `SoundType`, `BackendInfo`, `VersionInfo`, `WMInfo`, `SystemInfo`, `AppDescription`, etc.
    - `math/`: geometry and wedge algorithms (angles, wedges, clamping to monitor, etc.).
    - `icon-themes/`: icon theme registry implementations: system icons, file-based themes, Material Symbols, Simple Icons (colored + monochrome), emoji, fallback compositing, etc.
    - `item-types/`: item type registry and per-type metadata (distinct from item actions in `main`).
    - `settings-schemata/`: versioned settings schemas.

- **assets/**: Built-in content packaged with the app.
  - `menu-themes/`: first-class menu themes (each dir: `theme.json5` + `theme.css` + assets).
  - `icon-themes/`, `sound-themes/`, `images/`, `installer/`, `videos/`, `icons/`.
  - Tray icons: includes platform-specific variants; macOS uses `trayTemplate.png`.

- **locales/**: i18n strings for all supported languages (loaded by i18next in main; both renderers query via IPC).

- **build/**, **out/**: build artifacts (CMake for native add-ons; packaged apps).

- **Configuration**: `package.json` (scripts, versions), `webpack.*.ts` (bundling and asset relocation), `forge.config.ts` (makers: dmg/rpm/deb/zip/squirrel), `eslint.config.mjs`, `tsconfig.json`.

- **test/**: mocha-based tests.

## Pie menu engine: concepts, APIs, extensibility

### Data model and event flow

- **Menu items**: Tree structured `MenuItem` objects (via `common`). Items can be executable (leaf) or submenu (non-leaf).
  - Runtime rendering uses `RenderedMenuItem` (menu-renderer) which augments items with:
    - `path` (like `/0/2/1`), computed by `Menu.setupPaths()` on show.
    - Angular `wedge` and optional `parentWedge` (start/end angles in degrees), computed by `Menu.setupAngles()` using `common/math`.
    - DOM associations: `nodeDiv`, optional `connectorDiv`, and last-known angle caches for smooth CSS transitions.

- **Renderer lifecycle** (`menu-renderer/index.ts`):
  1. Requests theme, color overrides, sound theme, and general settings via `window.commonAPI` (preload IPC surface).
  2. Instantiates `MenuTheme`, `SoundTheme`, `SettingsButton`, then `Menu` with these dependencies and settings.
  3. Hooks IPC subscriptions:
     - Show/hide menu (`menuAPI.onShowMenu`, `onHideMenu`).
     - Theme reload (`onReloadMenuTheme`) and sound reload (`onReloadSoundTheme`).
     - Dark mode updates via `commonAPI.darkModeChanged`.
  4. Forwards menu events back to main: selection, cancel, hover/unhover, pointer warp request.
  5. Updates settings-driven behaviors live (e.g., sound volume, turbo/marking/hover modes, thresholds, fade durations, etc.).

- **Host lifecycle** (`main/index.ts` → `KandoApp`):
  - Parses CLI and deep links (e.g., `kando://menu?name=<menu>`), enforces single instance, sets protocol handler.
  - Chooses backend (see “Backends”), loads settings, optionally disables hardware acceleration, ensures theme directories exist.
  - Initializes i18n and the chosen backend, then constructs `KandoApp` and windows.
  - Binds/unbinds shortcuts per menus, wires tray menu for quick access, applies update checks.
  - When a shortcut/deeplink arrives: gathers `WMInfo` from backend, calculates `ShowMenuOptions` and sends it plus menu root over IPC to the renderer via `MenuWindow.showMenu()`.

### Menu class and rendering loop (`menu-renderer/menu.ts`)

- **Selection chain**: The central model is a stack from root to current item (`selectionChain`). The last element is the active center. Parents and children are styled and transformed relative to that center.

- **Show/hide**:
  - `show(root, showMenuOptions)`: clears DOM, applies input modes from settings (Marking/Turbo/Hover), computes paths and angles, constructs DOM tree, selects initial item (usually the root), optionally warps pointer to center, fades in.
  - `hide()`: toggles `.hidden`, schedules DOM clear after fade-out.
  - `cancel()`: emits `cancel` and plays close sound.

- **Angles and wedges** (via `common/math`):
  - `computeItemAngles(items, parentAngle?)`: distributes child directions; respects any given fixed angles and reserves parent gap when present. Fixed angle rules: monotonic increase; 0° at top; 90° right.
  - `computeItemWedges(angles, parentAngle?)`: converts center angles to [start,end] wedge arcs around each child; scales wedges (default 50%) and optionally yields a `parentWedge`.
  - `clampToMonitor(center, maxRadius, windowSize)`: clamps submenu positions to current monitor to keep the full structure visible (root moves; can trigger pointer warp on non-anchored with warp enabled).

- **DOM, transforms, CSS**:
  - Each item is a `.menu-node` containing one `connector` div and a per-theme set of layered divs (see theming).
  - Items get classes at runtime: `level-{n}`, `type-{item.type}`, plus direction hints `left|right|top|bottom` to assist CSS.
  - State classes: `active`, `parent`, `child`, `grandchild`, `hovered`, `clicked`, `dragged`. CSS selectors (see `index.scss`) use these to display connectors and other effects.
  - Transform loop updates:
    - For center: compute pointer/hover angles and call `theme.setCenterProperties()` to push CSS custom properties.
    - For children: call `theme.setChildProperties()` and let CSS drive transform/scale; inline transforms used only for dragged or clicked items.
    - Connectors: runtime width/rotation from child position or angle; stores accumulated rotations to avoid 360° jumps.

- **Inputs and gestures** (`input-methods/`):
  - `PointerInput`:
    - Modes: Marking (mouse drag), Turbo (keyboard modifier drag), Hover (no click if `hoverModeNeedsConfirmation` is false).
    - Thresholds: `dragThreshold`, `gestureMinStrokeLength`, `gestureMinStrokeAngle`, `gestureJitterThreshold`, `gesturePauseTimeout`, `fixedStrokeLength`, `centerDeadZone` (all driven from General Settings).
    - Gesture-based submenu selection via `GestureDetector`: detects corners (sharp turns) or pauses; also supports distance-based instant selections with `fixedStrokeLength`.
    - Right click closes (or goes to parent per setting), aux back button selects parent.
  - `GamepadInput`:
    - Polls the web Gamepad API (normalized wrapper), maps stick tilt to `InputState`, button indices for close/back configurable.
    - Selections are anchored at the initial center position; distance scaled by `parentDistance`.

### Theming and skinnability

- **MenuThemeDescription JSON (per theme)** (`common/index.ts`):
  - `id`, `directory` (auto-filled), `name`, `author`, `themeVersion`, `engineVersion`, `license`.
  - Layout flags: `maxMenuRadius`, `centerTextWrapWidth`, `drawChildrenBelow`, `drawCenterText`, `drawSelectionWedges`, `drawWedgeSeparators`.
  - `colors`: name→CSS color map; becomes CSS custom properties `--<name>` (user overrideable per theme, with dark-mode variant if configured).
  - `layers`: array of `{ class, content }` drawn back-to-front per item; `content` is `none | name | icon`.

- **How themes render** (`menu-renderer/menu-theme.ts`):
  - Registers CSS custom properties once globally:
    - `--angle-diff` per child (absolute angular distance from pointer) → drive zoom/scale rings.
    - For center layers: `--pointer-angle`, `--hover-angle`, `--hovered-child-angle` (degrees), set each frame; values eased by `getClosestEquivalentAngle` to avoid discontinuities.
  - `loadDescription(desc)`: injects `<link rel="stylesheet" href="file://<directory>/<id>/theme.css">` and registers/updates color properties as CSS custom properties.
  - `createItem(item)`: builds `.menu-node`, sets `data-name`, appends each layer div with `class` and optional icon/name.
  - `setChildProperties(item, pointerAngle)`: updates `--angle-diff`.
  - `setCenterProperties(item, pointerAngle, hoverAngle, parentHovered)`: updates angle properties on each center layer.

- **Optional global visuals** (`drawSelectionWedges`, `drawWedgeSeparators`):
  - `SelectionWedges`: full-viewport container whose CSS can use conic gradients; exposes `--center-x`, `--center-y`, `--start-angle`, `--end-angle` when hovered.
  - `WedgeSeparators`: injects absolute `div.separator` lines rotated to angles; theme defines style (width, colors, blend modes).

- **Icons** (`common/icon-themes` + `IconThemeRegistry`):
  - System icon theme comes from the backend (`common.get-system-icons()` → name → CSS image source, often base64 data URL), merged with user file/icon themes and built-ins (Material Symbols, Simple Icons, Emoji, fallback composition).
  - Items declare `iconTheme` + `icon` and `IconThemeRegistry.createIcon()` returns the element to append to layer divs.

- **Sounds** (`SoundThemeDescription` + `sound-theme.ts`):
  - `SoundType` enum covers open/close/select/hover variants (submenu/parent/leaf). Theme maps types to files and optional `volume`, `minPitch`, `maxPitch`.
  - Renderer uses Howler to play by building a `file://` URL and randomizing pitch; central volume from settings.

- **Theme development workflow**:
  - Place a theme under `<userData>/menu-themes/<theme-id>/theme.json5` and `theme.css`, or use built-in `assets/menu-themes/<id>`.
  - Switch theme in settings; modify color overrides (persisted per theme and per dark/light if enabled).
  - Hot reload themes via CLI `--reload-menu-theme` or UI button (invokes IPC to renderer to reload without restart).

### IPC surface and security

- **Context isolation and sandboxing** are enabled for renderers. Preloads expose whitelisted APIs only.
  - `common/common-window-api.ts`: shared IPC for both renderers (log, general/menu settings get/set + change streams, locales, theme descriptions/colors, isDarkMode, system icons, createItemForDroppedFile, devtools).
  - `menu-renderer/menu-window-api.ts`: menu-specific events (show/hide menu, selection/hover events, pointer warping, show settings, reload callbacks).
  - `main/menu-window.ts` listens to these channels and bridges to `KandoApp` and backends.

## Platform backends (enumeration and contract)

### Backend contract (`main/backends/backend.ts`)

- Responsibilities:
  - Expose `BackendInfo` (name, `menuWindowType`, `supportsShortcuts`, `shouldUseTransparentSettingsWindow`, optional hints for OS-level shortcut setup).
  - `init()` / `deinit()` lifecycle for native hooks.
  - Global shortcuts: `bindShortcuts(shortcuts)`, `inhibitShortcuts(shortcuts)`, `inhibitAllShortcuts()`, and emit `'shortcutPressed'` events. Base class default uses Electron `globalShortcut` but backends can override for OS integration/limitations.
  - Pointer: `movePointer(dx, dy)` relative movement in screen coordinates.
  - Key simulation: `simulateKeys(keySequence)` for macros/hotkeys.
  - Window manager info: `getWMInfo()` → `{ appName, windowName, pointerX, pointerY, workArea }`.
  - Installed apps: `getInstalledApps()` array for settings UI (id, name, command, icon, iconTheme).
  - System icons: `getSystemIcons()` map and `systemIconsChanged()` (hint for regenerating icon theme in renderer).
  - Drag-and-drop helper: `createItemForDroppedFile(name, path)` (override for platform semantics; defaults to `file` item with MIME-derived icon hint).

### Available backends (overview)

- **macOS** (`main/backends/macos/...`): see next section for a deep dive.

- **Windows** (`main/backends/windows/...`): Win32-native add-on; binds global shortcuts; simulates keys; moves pointer; lists apps and system icons. Window chrome configured to get reliable always-on-top overlay behavior (uses `type: 'toolbar'` for menu window in many cases, adjusted per-platform in `BackendInfo`). Includes native C++ (.cpp) with `stb_image_write` for icon handling.

- **Linux** (`main/backends/linux/...`): multiple flavors by desktop/sessions:
  - X11 generic (`x11/`), KDE X11 (`kde/x11/`), Cinnamon X11; use Xlib/XTest or native add-ons for input and WM info.
  - Wayland flavors (GNOME, KDE/Plasma, wlroots compositors, Niri); rely on portals or compositor-specific protocols (`wlr-layer-shell`, `wlr-virtual-pointer`, `virtual-keyboard`, `xdg-shell`), with a native shim where necessary.
  - Portals helpers (`portals/desktop-portal.ts`, `global-shortcuts.ts`, `remote-desktop.ts`).

## macOS backend and native bridge (deep dive)

### High-level architecture

- **Backend class**: `MacosBackend` extends `Backend`.
  - `getBackendInfo()` returns `{ name: 'macOS', menuWindowType: 'normal', supportsShortcuts: true, shouldUseTransparentSettingsWindow: true }`.
  - `init()` hides the app’s Dock icon (`app.dock.hide()`), enumerates installed apps+native icons, and fills `installedApps` and `systemIcons` for the renderer icon theme.
  - `getWMInfo()` returns active app/window (via native bridge) and pointer position (Electron `screen.getCursorScreenPoint()`); computes `workArea` for the display nearest to pointer.
  - `getInstalledApps()` returns cached list; `getSystemIcons()` returns cached base64 data URLs keyed by app name; `systemIconsChanged()` returns false (no dynamic changes).
  - `createItemForDroppedFile(name, path)` special-cases:
    - Executables (`isexe`) → `command` item with quoted absolute path.
    - App bundles (by matching `CFBundleExecutable` id against installed list) → `command` item with `open -a "<bundle id>"` and system icon.
    - Falls back to default `file` item otherwise.
  - Pointer and keys:
    - `movePointer(dx, dy)` delegates to native; errors logged if bridge fails.
    - `simulateKeys(keys)` maps DOM key names to Apple key codes using `common/key-codes` mapping (`mapKeys(keys, 'macos')`) and calls native per stroke, honoring per-keystroke delays.

### Native add-on (Node-API, Objective‑C++)

- **Module binding** (`main/backends/macos/native/index.ts`): requires `build/Release/NativeMacOS.node` and defines TypeScript interface `Native` exposing:
  - `movePointer(dx: number, dy: number)`
  - `simulateKey(keycode: number, down: boolean)`
  - `getActiveWindow(): { app: string; name: string }`
  - `listInstalledApplications(): Array<{ name: string; id: string; base64Icon: string }>`

- **Build** (`CMakeLists.txt`):
  - `enable_language(OBJCXX)`; builds `NativeMacOS` shared library with `.mm` sources and Node-API glue (`CMAKE_JS_*`), produces `.node` binary with no prefix/suffix tweaks.

- **Implementation** (`Native.mm`):
  - `movePointer(dx, dy)`: reads current pointer with Core Graphics and `CGWarpMouseCursorPosition` to warp cursor by delta. Used by renderer to gently nudge pointer when clamped near edges (see `menu.ts` + `menu-window.ts` scaling rules).
  - `simulateKey(keycode, down)`: ensures Accessibility permission via `CGRequestPostEventAccess()`; updates internal left/right modifier masks for Command/Shift/Control/Option; posts a keyboard event with combined modifier flags.
  - `getActiveWindow()`: uses AppKit to get `frontmostApplication`. Chooses ID via `bundleIdentifier` (preferred) or `localizedName`; scans on‑screen windows via `CGWindowListCopyWindowInfo` to find first window with same PID; returns title if available. If window title missing, returns a sentinel “Missing Screen Recording Permissions” and prints a console hint. This reflects macOS 10.15+ Screen Recording privacy requirement for enumerating window names.
  - `listInstalledApplications()`: enumerates `/Applications`, `/System/Applications`, `~/Applications`, and `~/Library/Applications` for `.app` bundles; reads `CFBundleName` and `CFBundleExecutable`; renders the Finder icon at 64×64 to a PNG and returns base64 data URL. The backend caches these for the system icon theme and the App picker in settings.

### macOS-specific windowing behaviors in main process

- **Menu window** (`main/menu-window.ts`):
  - `show()`: on macOS, toggles visibility on all workspaces briefly (`setVisibleOnAllWorkspaces(true)` → delay → `false`) to ensure the window is on the current desktop (#461 fix); always-on-top `screen-saver` level.
  - `hideWindow()`: on macOS, calls `super.hide()` and then `app.hide()` to properly return focus to the previous app, except when settings are visible.
  - **Pointer movement scaling**: Only non-macOS platforms scale deltas by monitor DPI; on macOS the native bridge is “pixel accurate”, so scaling is left at 1. The renderer deltas are additionally scaled by `webContents.getZoomFactor()` before sending to backend.

- **App policy & tray** (`main/app.ts` constructor of `KandoApp`):
  - On macOS, sets activation policy to `accessory` so the app doesn’t appear in Dock or Cmd‑Tab.
  - Tray icon uses a template PNG for automatic tinting. Context menu includes menus, settings, inhibit/uninhibit shortcuts, and Quit.

- **Settings window** (`main/settings-window.ts`):
  - Transparent flavors use macOS vibrancy `menu` (Electron `vibrancy`), with hidden titlebar overlay.

### macOS permissions and UX implications

- **Accessibility**: required for simulated key events (macros/hotkeys). If unavailable, native throws and the backend reports errors.
- **Screen Recording**: needed to retrieve window titles in `getActiveWindow()`; without it, Kando will still work but UI condition matching by `windowName` is impaired and a hint is logged.

## How it all fits together (runtime flow)

- A menu is shown when:
  - The user presses a globally bound shortcut; or
  - Kando is launched with `--menu <name>` or via `kando://menu?name=<name>` deep link; or
  - Tray context menu selection.

- Host-side (`KandoApp.showMenu`):
  - Ensures `MenuWindow` is created and loaded; asks backend for `WMInfo` and `systemIconsChanged`.
  - Uses `chooseMenu(request, info)` to pick the best-matching menu by trigger and optional conditions (`appName`, `windowName`, `screenArea` regex/substring checks). Supports cycling behavior when the same shortcut is pressed repeatedly.
  - Adjusts window bounds to the monitor `workArea`, shows the window, and computes `ShowMenuOptions` (mouse position relative to window, scaled by zoom; centered/anchored/hover mode flags; system icon theme change hint).
  - Sends root `MenuItem` and `ShowMenuOptions` to renderer.

- Renderer-side (`menu-renderer/index.ts` + `menu.ts`):
  - Creates themed DOM and inputs, positions root and children, and begins selection loop.
  - Emits `select`/`cancel` which `MenuWindow` converts to actions via `ItemActionRegistry`.
  - Hides with fade; host delays executing “delayedExecution” actions until fade-out completes so keystrokes go to the target app, not Kando’s window.

## Extending Kando: key seams

- **Add a new menu theme**:
  - Create `<userData>/menu-themes/<id>/theme.json5` + `theme.css` (or add to `assets/menu-themes` to ship with app).
  - Define `layers` and `colors`. Use CSS custom properties set by the engine: `--angle-diff` (children), `--pointer-angle`/`--hover-angle`/`--hovered-child-angle` (center layers), and item-level properties like `--dir-x`, `--dir-y`, `--angle`, `--parent-angle`, `--sibling-count`.
  - Turn on `drawSelectionWedges` / `drawWedgeSeparators` for global background effects.

- **Add/modify an item type**:
  - Define metadata in `common/item-types` (icon defaults, validation, etc.).
  - Implement behavior in `main/item-actions` and register in `ItemActionRegistry`.
  - Add a settings editor in `settings-renderer/components/menu-properties/item-configs` if user-editable.

- **Add a platform capability on macOS**:
  - Extend native add-on (`Native.hpp`/`.mm`) with a new method; export via `index.ts` and call from `MacosBackend`.
  - Watch for additional entitlements/permissions (e.g., accessibility, screen recording) and error surfaces.

- **Support a new backend**:
  - Create a `Backend` subclass with the required methods; consider session/DE detection in `backends/index.ts`; add native shim if needed.

## Settings overview (selected fields that affect the menu)

- Visuals & timing: `fadeInDuration`, `fadeOutDuration`, `zoomFactor`, `enableDarkModeForMenuThemes`.
- Input behavior: `warpMouse`, `enableMarkingMode`, `enableTurboMode`, `hoverModeNeedsConfirmation`, `dragThreshold`, gesture thresholds, `centerDeadZone`, `keepInputFocus`.
- Selection policies: `sameShortcutBehavior` (`nothing|close|cycle-from-first|cycle-from-recent`), `anchored`, `centered`, `hoverMode` (per menu).
- Sounds: `soundTheme`, `soundVolume`.
- Backend-specific UI hints: `trayIconFlavor`, `settingsWindowFlavor` (auto→system default per backend preference), `enableVersionCheck`.

## Build and run

- Toolchain: Node 20.x, Electron 38, TypeScript 5.9, Webpack forge plugin, cmake-js for native modules.
- Scripts (see `package.json`):
  - `postinstall`: `cmake-js compile` (builds native add-ons across platforms).
  - `start`: dev with electron-forge (webpack dev server for renderers; webSecurity disabled in dev only).
  - `make`: package with forge makers (DMG/RPM/DEB/Squirrel/ZIP as configured).
  - `test`: mocha specs.
  - `i18n`: extract strings.

## Quick reference: important types

- `ShowMenuOptions`: `{ mousePosition, windowSize, zoomFactor, centeredMode, anchoredMode, hoverMode, systemIconsChanged }`.
- `MenuThemeDescription`: identity metadata, layout flags, `colors`, `layers`.
- `SoundThemeDescription`: identity metadata + `sounds: Record<SoundType, SoundEffect>`.
- `WMInfo`: `{ windowName, appName, pointerX, pointerY, workArea }`.
- `BackendInfo`: `{ name, menuWindowType, supportsShortcuts, shouldUseTransparentSettingsWindow, shortcutHint? }`.

## Troubleshooting: macOS

- No window titles in conditions: grant Screen Recording permission to Kando (System Settings → Privacy & Security → Screen Recording).
- Macros/hotkeys not working: grant Accessibility permission (Privacy & Security → Accessibility).
- Menu not appearing on current desktop: the app sets `setVisibleOnAllWorkspaces(true) → false` on show as a workaround; verify Mission Control/Stage Manager settings.

---

If you’re extending the pie menu visuals, start with a copy of a built-in theme under `assets/menu-themes/default` and experiment with `--angle-diff`, conic gradients for `SelectionWedges`, and layer-specific transitions keyed off `--pointer-angle`/`--hover-angle`. For platform features on macOS, add minimally-scoped native methods and surface them through the `MacosBackend` while preserving renderer sandboxing and IPC boundaries.



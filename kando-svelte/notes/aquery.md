## aQuery: A Cross‑Platform Accessibility and Window API atop Kando

This proposal defines “aQuery” — a high‑level, cross‑platform TypeScript API (à la jQuery/Cordova) that abstracts platform accessibility (a11y), window management, and input simulation behind one contract. Kando provides the execution substrate (Electron main/renderer, native backends) and the permission UX; aQuery provides a stable JS interface and selector semantics.

### Rationale
- Fragmented OS capabilities (AX on macOS, UIA on Windows, AT‑SPI on Linux; Wayland vs X11) complicate app automations and accessibility tooling.
- Kando already ships native backends and a robust input pipeline; aQuery extends this into a reusable, documented API for first‑party features (triggers, editor helpers) and third‑party integrations.

### Design Principles
- Cross‑platform contract first; graceful capability detection (`supports.*`) and fallbacks.
- Explicit, per‑feature permission prompts (and persistent user consent) with clear failure modes.
- Asynchronous, promise‑first API; event‑driven subscriptions.
- Strong typing; no platform enums leaked through public surface.
- No busy loops; everything cancellable; observable streams where appropriate.

---

## Top‑Level API Surface (TypeScript)

```ts
namespace aquery {
  // Core & permissions
  function supports(): Promise<{
    a11y: boolean; window: boolean; input: boolean; screen: boolean;
    triggers: boolean; clipboard: boolean; app: boolean; gamepad: boolean;
  }>;
  function requestPermissions(opts: {
    a11y?: boolean; input?: boolean; screen?: boolean;
  }): Promise<{ granted: string[]; denied: string[] }>;

  // App / Window
  namespace app {
    function getForeground(): Promise<{ id: string; name: string }>;
    function listInstalled(): Promise<Array<{ id: string; name: string }>>;
  }
  namespace window {
    type Win = { id: string; appId: string; title: string; bounds: { x:number; y:number; w:number; h:number } };
    function getActive(): Promise<Win | null>;
    function list(opts?: { appId?: string }): Promise<Win[]>;
    function activate(id: string): Promise<void>;
    function moveResize(id: string, bounds: Partial<Win['bounds']>): Promise<void>;
  }

  // Input (synthetic)
  namespace input {
    type Button = 'left'|'middle'|'right'|'x1'|'x2';
    function mouse(event: {
      type: 'move'|'down'|'up'|'click'|'dblclick'|'scroll';
      button?: Button; x?: number; y?: number; dx?: number; dy?: number;
      scrollX?: number; scrollY?: number;
      modifiers?: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean };
    }): Promise<void>;
    function key(event: { code: string; down: boolean }): Promise<void>;
  }

  // Accessibility queries
  namespace a11y {
    type Node = { role: string; name?: string; enabled?: boolean; focused?: boolean; rect?: { x:number;y:number;w:number;h:number } };
    function query(selector: string, opts?: { root?: 'system'|string; timeoutMs?: number }): Promise<Node[]>;
    function action(selector: string, act: 'press'|'expand'|'collapse'|'focus'|'setValue', value?: unknown): Promise<boolean>;
  }

  // Screen / clipboard
  namespace screen {
    function displays(): Promise<Array<{ id: string; bounds: { x:number;y:number;w:number;h:number } }>>;
    // High‑performance capture primitives (prefer GPU/zero‑copy where available)
    function captureRegion(rect: { x:number;y:number;w:number;h:number }, opts?: { format?: 'png'|'jpeg'|'raw'; displayId?: string }): Promise<ImageBitmap | ArrayBuffer>;
    function captureWindow(id: string, opts?: { format?: 'png'|'jpeg'|'raw' }): Promise<ImageBitmap | ArrayBuffer>;
    function captureDisplay(displayId: string, opts?: { format?: 'png'|'jpeg'|'raw' }): Promise<ImageBitmap | ArrayBuffer>;
    // Tracking utilities (pixel‑level, optional ML backends)
    function trackRegion(init: { rect: { x:number;y:number;w:number;h:number }, strategy?: 'template'|'feature'|'ocr' }): AsyncGenerator<{ rect: { x:number;y:number;w:number;h:number }, confidence: number }>;
  }
  namespace clipboard {
    function read(): Promise<string>;
    function write(text: string): Promise<void>;
  }

  // Vision/LLM (pluggable providers: local VLMs or cloud)
  namespace llm {
    type Provider = 'auto'|'openai'|'ollama'|'local';
    function describe(image: ImageBitmap | ArrayBuffer, prompt?: string, opts?: { provider?: Provider }): Promise<string>;
    function locate(image: ImageBitmap | ArrayBuffer, query: string, opts?: { provider?: Provider }): Promise<Array<{ label: string; rect: { x:number;y:number;w:number;h:number }; score: number }>>;
    function plan(image: ImageBitmap | ArrayBuffer, goal: string, opts?: { provider?: Provider }): Promise<Array<{ action: 'click'|'dblclick'|'type'|'scroll'|'drag', target?: { x:number;y:number } | { rect: { x:number;y:number;w:number;h:number } }, text?: string }>>;
  }

  // Triggers (ties into Kando’s unified triggers[] model)
  namespace triggers {
    type MouseTrigger = { button: 'left'|'middle'|'right'|'x1'|'x2', mods?: string[] };
    type GamepadTrigger = { button: number; stick?: 'left'|'right'; tiltThreshold?: number };
    function register(menuName: string, trigger: { kind: 'mouse'; value: MouseTrigger } | { kind: 'gamepad'; value: GamepadTrigger }): Promise<void>;
    function unregister(menuName: string): Promise<void>;
  }
}
```

### Selector Grammar (a11y)
- CSS‑inspired for accessibility trees across AX/UIA/AT‑SPI:
  - Role: `button`, `menuitem`, `textbox`
  - Name: `[name="OK"]`, regex: `[name~/^Save/]`
  - State: `:enabled`, `:focused`, `:visible`
  - Hierarchy: `app[name="Safari"] > window > button[name="OK"]`
  - Short alias: `a$(selector)` returns first match; `a$All(selector)` returns all.

---

## Platform Adapters

- macOS: AX API (AXUIElement), CGEventTap (global hooks), CGEvent post (synthetic), NSWorkspace notifications (active app), Quartz Display Services (screens). Existing Kando native code already provides: pointer warp, simulateKey, active window, app listing — extend with: simulateMouse, event tap, AX queries/actions.
- Windows: UI Automation (COM), WH_MOUSE_LL / Raw Input, SendInput, GetForegroundWindow/EnumWindows, Graphics Capture API (DXGI Desktop Duplication / Windows.Graphics.Capture).
- Linux X11: AT‑SPI2 (D‑Bus), XTest/XI2, EWMH for windows. Wayland: portals (GlobalShortcuts keyboard only, RemoteDesktop/VirtualPointer/VirtualKeyboard with permissions), AT‑SPI via accessibility stack; many features are compositor‑dependent — expose via `supports()`.

IPC and isolation:
- Electron main performs privileged calls; renderer uses `contextBridge` APIs.
- All methods return Promises; cancellation via AbortSignal for long queries.

Permissions UX:
- `aquery.requestPermissions({ a11y: true, input: true })` triggers per‑OS guidance (e.g., macOS Accessibility & Input Monitoring; Screen Recording when capturing)
- Store consent in settings; re‑prompt on denial; surface clear error codes.

---

## Integration with Kando

- Triggers: the `triggers` registry is a thin facade over Kando’s unified `triggers[]` model (see button‑trigger‑support.md). Mouse/gamepad opener logic flows through Kando’s existing conditions matcher and `MenuWindow.showMenu`.
- Gesture pipeline: after open, existing `PointerInput`/`GamepadInput` continue to produce `InputState` (angle/distance), so selection/marking/turbo remain unchanged.
- Editor: add pickers for MouseTrigger and GamepadTrigger; reuse conditions UI.

---

## Svelte / Browser Variant

In `kando-svelte`, implement the same TS surface using browser capabilities:
- Mouse triggers: DOM pointer events and `contextmenu` suppression.
- Gamepad triggers: Web Gamepad API.
- a11y/window: limited; expose `supports().a11y = false` and provide no‑op or portal‑based fallbacks; the contract remains the same so apps can feature‑detect.
- Screen capture: `html2canvas`/`OffscreenCanvas` for demo purposes only; do not rely on for privacy‑sensitive features. In Electron renderer, prefer native capture bridges.

---

## Roadmap
1) Spec + types + `supports()`; Svelte demo polyfill for triggers
2) macOS adapter: simulateMouse + event tap + basic AX queries (role/name) and window list/activate
3) Windows adapter: hooks + SendInput + UIA minimal + Graphics Capture
4) Linux X11 adapter; Wayland: document limitations and portals where feasible
5) Editor pickers and unified `triggers[]` schema migration
6) Expanded AX/UIA actions and robust query engine (performance + timeouts)

Testing:
- Contract tests per method with platform‑specific expected capability matrices
- Golden tests for selector resolution on synthetic accessibility trees

Security:
- Only elevate when requested; never run hidden; log every privileged action origin (menu/editor) for audit when dev tools enabled.

License & contribution:
- MIT (inherit from Kando); adapters reside under platform folders; contributors can add new backends behind the same TS interface.

---

## Background, Prior Art, and References (aQuery vision)

The aQuery idea ("like jQuery for accessibility") predates Kando and draws on decades of HCI and accessibility research. Key motivations and inspirations include:

- Combine accessibility APIs with pixel‑based screen analysis to overcome each method’s limitations; use both to robustly select, recognize, and control UI elements.
- Treat desktop UIs as augmentable spaces: overlay guidance, implement target‑aware pointing (e.g., Bubble Cursor), sideviews, previews, and task‑specific controllers without modifying apps.
- Build a community library of high‑level, cross‑app widgets (e.g., a generic “video player” control) that adapt to VLC, QuickTime, browsers, etc., akin to jQuery UI widgets spanning browser differences.

Selected sources and quotes (lightly edited for clarity):

> "Screen scraping techniques are very powerful, but have limitations. Accessibility APIs are very powerful, but have different limitations. Using both approaches together, and tightly integrating with JavaScript, enables a much wider range of possibilities." — HN post by Don Hopkins (2016)

> "Prefab realizes this vision using only the pixels of everyday interfaces… add functionality to applications like Photoshop, iTunes, and WMP… first step toward a future where anybody can modify any interface." — Morgan Dixon & James Fogarty, CHI 2010–2012

Core references:
- Morgan Dixon et al., Prefab and target‑aware pointing (CHI ’10–’12)
  - Video: Prefab: What if We Could Modify Any Interface?
  - Video: Content and Hierarchy in Prefab
  - Paper: Prefab; Bubble Cursor; Target‑Aware Pointing
- Potter, Shneiderman, Bederson: Pixel Data Access & Triggers (1999)
- Speech control ecosystems (e.g., Dragonfly Python modules) for command repositories

How it maps to aQuery:
- a11y: selector engine over AX/UIA/AT‑SPI nodes (role/name/state), event binding, actions
- screen: capture/track (template/feature/OCR), compositing overlays
- input: synthetic mouse/keyboard; timing control for “press‑tilt‑release” and gesture playback
- llm: describe/locate/plan actions from snapshots; drive `input.*` with verifiable, sandboxed plans

---

## Snapshotting & LLM Scenarios

1) Visual targeting fallback: if `a11y.query('button[name="Play"]')` returns empty, use `screen.captureWindow()` + `llm.locate(…, 'play button')` to get a bounding box; click center via `input.mouse({ type:'click', button:'left', x, y })`.
2) Robust selectors: combine `a11y` and `screen` features: match role/name, verify icon pixels via `trackRegion` or LLM scoring.
3) Task agents: capture screen, `llm.plan('increase playback speed to 1.5x')`, vet and execute the plan with safety checks (bounds, foreground window) and reversible steps.

Privacy & safety:
- Favor on‑device VLMs where possible; redact PII regions; require explicit user consent for cloud processing; log actions when dev mode is on.




## Quick Start

### Check capabilities and request permissions

```ts
// Feature-detect what the current platform supports
const caps = await aquery.supports();

// Ask only for what you need right now
await aquery.requestPermissions({
  a11y: caps.a11y,
  input: caps.input,
  screen: false
});
```

### Focus an app window and press a button by accessible name

```ts
// Bring the target app window forward
const active = await aquery.window.getActive();
if (!active) {
  const safari = (await aquery.app.listInstalled()).find(a => a.name === 'Safari');
  if (safari) {
    const wins = await aquery.window.list({ appId: safari.id });
    if (wins[0]) await aquery.window.activate(wins[0].id);
  }
}

// Press a visible OK button
const ok = await aquery.a11y.query('window > button[name="OK"]:enabled:visible', { timeoutMs: 1000 });
if (ok[0]) {
  await aquery.a11y.action('window > button[name="OK"]', 'press');
}
```

### Fallback to vision when accessibility lookup fails

```ts
const match = await aquery.a11y.query('button[name~=/Play|▶/]:enabled', { timeoutMs: 500 });
if (!match[0] && (await aquery.supports()).screen) {
  const win = await aquery.window.getActive();
  if (win) {
    const img = await aquery.screen.captureWindow(win.id, { format: 'png' });
    const boxes = await aquery.llm.locate(img, 'play button');
    const best = boxes.sort((a, b) => b.score - a.score)[0];
    if (best) {
      const cx = best.rect.x + Math.floor(best.rect.w / 2);
      const cy = best.rect.y + Math.floor(best.rect.h / 2);
      await aquery.input.mouse({ type: 'move', x: cx, y: cy });
      await aquery.input.mouse({ type: 'click', button: 'left' });
    }
  }
}
```

---

## Selector Cookbook

- **By role**: `menuitem`, `button`, `textbox`, `checkbox`
- **By name (exact)**: `button[name="Save"]`
- **By name (regex)**: `button[name~/^Save (As|All)/]`
- **By state**: `:enabled`, `:focused`, `:visible`
- **By ancestry**: `app[name="Safari"] > window > toolbar > button[name="Reload"]`
- **Any of names**: `button[name~/^(OK|Yes|Continue)$/]`
- **First match helper**: `a$("button[name='OK']")`
- **All matches helper**: `a$All("menuitem:visible")`

Tips:
- Prefer stable identifiers (role + name) first; use vision as a verifier.
- Scope queries by app/window when possible for performance.
- Use `timeoutMs` conservatively to avoid long hangs; prefer retries with backoff.

---

## Capability Matrix (indicative)

| Feature       | macOS (AX) | Windows (UIA) | Linux X11 (AT‑SPI) | Wayland |
| ------------- | ---------- | ------------- | ------------------ | ------- |
| a11y query    | Yes        | Yes           | Yes                | Varies  |
| a11y actions  | Yes        | Yes           | Yes                | Varies  |
| window list   | Yes        | Yes           | Yes                | Yes     |
| window focus  | Yes        | Yes           | Yes                | Varies  |
| input synth   | Yes        | Yes           | Yes (XTest/XI2)    | Portals |
| screen capture| Yes        | Yes           | Yes                | Portals |

Notes:
- Wayland features depend on compositor and portals; expose via `supports()`.
- Some features require explicit OS permissions; see next section.

---

## Permissions Guide

### macOS
- **Accessibility**: required for a11y queries/actions and some input simulation.
- **Input Monitoring**: required for global input hooks.
- **Screen Recording**: required for display/window capture.
- Use `aquery.requestPermissions({ a11y: true, input: true })` to guide users.

### Windows
- UIA and SendInput generally work without special prompts; ensure the app has appropriate privileges when interacting with elevated windows.
- Graphics Capture may require enabling OS features on older builds.

### Linux
- **X11**: broad access via AT‑SPI and XTest/XI2; no prompts.
- **Wayland**: use portals for virtual keyboard/mouse and remote‑desktop capture; availability varies by desktop environment.

---

## Svelte / Browser Polyfill Notes

In `kando-svelte`, mirror the TS surface where possible so code can feature‑detect and degrade gracefully.

```ts
// Example: simple mouse trigger polyfill in the browser
const supports = await aquery.supports();
if (!supports.triggers) {
  // Fallback: listen to DOM events to open a demo menu
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    // show demo menu component at e.clientX/Y
  });
}
```

Prefer native bridges when running under Electron for capture and input.

---

## Prefab, HyperLook/HyperCard, and Design Inspiration

### Prefab (Dixon & Fogarty)
- Use pixel‑level recognition to identify widgets and verify targets.
- Combine with a11y selectors for robust, cross‑app interactions.

### HyperLook / HyperCard‑style Augmentation
- Treat desktop UIs as canvases you can annotate, overlay, and script.
- Compose higher‑level widgets (e.g., a generic media controller) that adapt to many apps.

### Window Management
- Expose predictable operations: focus, move/resize, enumerate, tile/snap.
- Build user scripts that arrange workspaces and then bind them to triggers.

### Pie Menus
- Integrate with Kando’s triggers and gesture pipeline.
- Use aQuery to query context (focused app/window/element) and tailor menu entries.

### Tabbed / Panel Workflows
- Script workflows that switch tabs, raise panels, and confirm dialogs by role/name.

---

## Eventing, Timeouts, and Cancellation

- Long queries should accept `timeoutMs` and `AbortSignal` to stay responsive.
- Emit progress or discovery events where supported (future roadmap) to enable live UIs.

```ts
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 800);
try {
  const nodes = await aquery.a11y.query('textbox:focused', { timeoutMs: 750 /*, signal: controller.signal */ });
  // ...
} finally {
  clearTimeout(timer);
}
```

---

## Error Handling Patterns

- Always check `supports()` before calling feature APIs.
- Prefer idempotent scripts; verify window focus and bounds before input.
- Layer fallbacks: a11y → vision verify → pure vision; fail fast with clear messages.

---

## Contributing Adapters

- Keep platform specifics inside adapter folders; conform to the TS interface.
- Add contract tests per method and capability matrices per OS.
- Document any limitations behind `supports()` feature flags.

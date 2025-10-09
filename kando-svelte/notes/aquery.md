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



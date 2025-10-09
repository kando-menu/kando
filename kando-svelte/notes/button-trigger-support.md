## Button and Gamepad Trigger Support — Design and Rationale

This document specifies how to add “open menu on button” triggers to Kando, covering mouse buttons and gamepads, with per‑app/window/region conditions, double‑click passthrough for RMB, and tight integration with the existing gesture pipeline (marking, turbo, hover, fixed‑stroke).

Although authored inside `kando-svelte`, the primary scope is the main Kando application (Electron + native backends). The Svelte variant can implement the same TypeScript surface using browser APIs (Gamepad API, DOM pointer events) without native hooks.

### Goals
- Support opening a menu via:
  - Keyboard (existing)
  - Mouse buttons (RMB, MMB, X1/X2, optionally LMB)
  - Gamepad buttons and optional “press‑tilt‑release” selection flow
- Reuse existing per‑menu `conditions` (app/window/region) for scoping
- Offer double‑right‑click passthrough to forward a native RMB click if user cancels quickly
- Integrate with the gesture pipeline so state machines remain consistent (jitter, dead‑zone, marking/turbo/hover)
- Cross‑platform shape with platform‑specific implementations

### Non‑Goals
- Provide global mouse hooks on Wayland (not feasible without compositor/portal support)
- Replace the existing keyboard shortcut flow (we remain backward‑compatible)

---

## Configuration Model

We keep `shortcut`/`shortcutID` for backwards compatibility and add a unified `triggers` array. Each entry is one of `keyboard | mouse | gamepad`.

Example (JSON excerpt from `menus.json`):

```json
{
  "root": { "type": "submenu", "name": "Apps", "icon": "apps", "iconTheme": "material-symbols-rounded" },
  "shortcut": "Control+Space",
  "triggers": [
    { "kind": "keyboard", "shortcut": "Control+Space" },
    { "kind": "mouse", "button": "right", "mods": [], "when": "matching-conditions", "doubleClickPassthrough": "on-cancel" },
    { "kind": "gamepad", "button": 0, "stick": "left", "tiltThreshold": 0.35 }
  ],
  "conditions": { "appName": "^com.apple.Safari$" }
}
```

Schema sketch (TypeScript/Zod intent):

```ts
type KeyboardTrigger = {
  kind: 'keyboard';
  shortcut?: string;   // Electron accelerator
  id?: string;         // fallback ID for DE/portal bindings
};

type MouseTrigger = {
  kind: 'mouse';
  button: 'left'|'middle'|'right'|'x1'|'x2';
  mods?: Array<'ctrl'|'alt'|'shift'|'meta'>;
  when?: 'matching-conditions'|'always';
  doubleClickPassthrough?: 'on-cancel'|'never'|'always';
};

type GamepadTrigger = {
  kind: 'gamepad';
  button: number;         // W3C remapped indices
  stick?: 'left'|'right';
  tiltThreshold?: number; // 0..1, default 0.3
};
```

Backward compatibility: if `triggers` is absent, existing `shortcut`/`shortcutID` is treated as a single keyboard trigger.

### Why not piggyback on `shortcut`?
- Electron’s accelerators are keyboard‑only; mouse buttons are not supported and would require native hooks anyway. Keeping distinct trigger kinds avoids fragile overloading and keeps the editor UX clear.

---

## Integration with Conditions and Menu Selection

We reuse the existing `conditions` matcher (app name, window title, screen region). On any trigger event, Kando computes the “best matching” menu exactly as today. If the selected menu contains a trigger matching the event (kind + details), we open it.

This supports per‑app RMB bindings naturally: put `mouse` triggers on menus and scope them with `conditions`.

---

## Event Flow and State Machines

### Mouse (open flow)
1) Global hook sees mouse event (e.g., RightDown + modifiers)
2) Resolve `WMInfo` (app/window/region), pick best menu by `conditions`
3) If a matching `mouse` trigger exists: swallow the OS event and `showMenu({ centered/anchored/hover })`
4) Pointer input continues as today (dead‑zone, jitter, marking/turbo/hover)

### Double‑RMB Passthrough
- Policy `doubleClickPassthrough`:
  - `on-cancel` (default): if the menu closes “quickly” (≤ system double‑click interval) without a selection, synthesize RMB (Down+Up) and close
  - `always`: synthesize RMB on quick close regardless of selection
  - `never`: never synthesize

### Gamepad (open + browse)
1) Renderer polls Gamepad API (already implemented for in‑menu browsing)
2) If a configured `gamepad` trigger button becomes down (and optional `tiltThreshold` satisfied), notify main to `showMenu` using current WM info and menu selection rules
3) In‑menu browsing uses existing GamepadInput: analog stick → hover; buttons → select/back/close
4) Optional mode: “press‑tilt‑release” — arm on button down, commit selection on button up (setting `gamepadSelectOnButtonUp`)

---

## Native Backends (platform support)

### macOS (first target)
- Global capture: CGEventTap (kCGHIDEventTap) for Right/Other buttons, with Accessibility permission
- Swallowing: return `nullptr` to prevent OS delivery when opening Kando
- Synthetic events: `CGEventCreateMouseEvent` + `CGEventPost`, support: move, down, up, click, dblclick (set click state), scroll, with modifiers
- Permissions: reuse current accessibility prompt; show guidance if access denied

### Windows (next)
- Global capture: `SetWindowsHookEx(WH_MOUSE_LL)`
- Synthetic events: `SendInput` for mouse

### Linux
- X11: XI2 + XTest (best effort)
- Wayland: no global mouse hooks; disable mouse triggers and recommend DE/portal bindings (keyboard only)

---

## Public Native API (cross‑platform shape)

- `startMouseHook({ buttons: string[], intercept: boolean }): void`
- `stopMouseHook(): void`
- `simulateMouse(event: {
     type: 'move'|'down'|'up'|'click'|'dblclick'|'scroll',
     button?: 'left'|'middle'|'right'|'x1'|'x2',
     x?: number, y?: number, dx?: number, dy?: number,
     scrollX?: number, scrollY?: number,
     modifiers?: { shift?: boolean, ctrl?: boolean, alt?: boolean, meta?: boolean }
   }): void`
- Emits events: `{ button, phase: 'down'|'up', x, y, mods, timestamp }`

These APIs are implemented natively per OS but identically shaped in Node.

---

## Active‑Window‑Aware Filtering (tap/untap strategy)

We minimize overhead and avoid “spying” on clicks in non‑target apps by enabling the intercepting hook only when necessary:

- Maintain a precomputed index of triggers per app/window pattern (compiled regex), plus any `when: 'always'` triggers.
- Track foreground window changes and pointer screen transitions; when the active app/window does not match any mouse triggers, disable the intercepting hook (or switch to a listen‑only tap where available). When a match appears, enable the intercepting hook.
- On platforms where toggling hooks is cheap, fully stop/start; otherwise `enable/disable` the same handle.

Platform specifics:
- macOS: subscribe to `NSWorkspaceDidActivateApplicationNotification` to detect app changes; `CGEventTapEnable(tap, true|false)` to toggle; use `kCGEventTapOptionListenOnly` when you want metrics without the ability to swallow. On match, keep the tap enabled in intercept mode; otherwise disable or switch to listen‑only.
- Windows: use `SetWinEventHook(EVENT_SYSTEM_FOREGROUND, ...)` to detect focus changes; toggle `WH_MOUSE_LL` hook accordingly.
- X11: watch `_NET_ACTIVE_WINDOW` via `XSelectInput` and PropertyNotify; toggle XI2 hook.
- Wayland: no reliable foreground app events; default to disabled hooks (mouse triggers unsupported) or to a per‑DE integration if available.

Race considerations:
- For RMB interception you must already be in intercept mode before the actual `RightDown` is dispatched by the OS. Therefore we only disable interception in apps without matching triggers; in apps with matches, interception remains enabled and the event is swallowed conditionally (constant‑time checks).
- Region conditions: decision is per‑event (we read pointer position from the event); interception remains enabled in candidate apps.

Behavior summary:
- Not a candidate app/window → hook disabled (zero overhead).
- Candidate app/window → hook enabled, events checked against triggers; if not matched, immediately pass through; if matched, swallow and open menu.

---

## LLM‑Driven Context‑Sensitive Menus (window snapshot → pie)

We can dynamically propose a menu when a trigger fires by analyzing the active window snapshot or accessibility tree. This augments (not replaces) authored menus.

High‑level pipeline:
1) Capture: use `aquery.screen.captureWindow(activeWindowId)` (prefer GPU/zero‑copy). Optionally include `aquery.a11y.query('window > *')` summaries.
2) Prompt: send snapshot (and AX summary) to `aquery.llm.describe/plan` with an instruction to emit a Kando `menus.json` fragment limited to 8–12 directions, names/icons, and safe actions only.
3) Validate: parse with Kando Zod schemas; reject if invalid or if contains disallowed actions.
4) Render: open the generated pie (ephemeral) or merge into a temporary overlay group; show a small “AI” badge and a “pin/save” affordance.
5) Learn/cache: key by app/window signature (bundle id + canonicalized title + UI hash). Cache top suggestions; allow feedback (👍/👎) and corrections; respect per‑app opt‑in.

Output schema (LLM target):
```json
{
  "version": "1",
  "menus": [
    {
      "name": "AI Context",
      "centered": false,
      "anchored": false,
      "root": {
        "type": "submenu",
        "name": "Context",
        "icon": "lightbulb",
        "iconTheme": "material-symbols-rounded",
        "children": [
          { "type": "hotkey", "name": "Copy",   "icon": "content_copy",   "iconTheme": "material-symbols-rounded", "data": { "hotkey": "Command+C" } },
          { "type": "hotkey", "name": "Paste",  "icon": "content_paste",  "iconTheme": "material-symbols-rounded", "data": { "hotkey": "Command+V" } }
        ]
      }
    }
  ]
}
```

Safety & UX guardrails:
- Privacy: default to on‑device VLM; if cloud is used, require explicit per‑app consent and allow redaction regions.
- Safety: only emit Kando‑supported safe actions (`hotkey`, `command`, `uri`, etc.); require confirmation for destructive actions.
- Determinism: clamp to ≤12 slices; prefer well‑known icons; avoid ambiguous labels; show confidence tooltips.
- Latency: if the LLM response exceeds a threshold, show the default authored menu first and add AI suggestions as a sibling pie when ready.

Refresh policy:
- Recompute when window identity or major layout hash changes.
- Cache per app/title signature; decay over time; respect user feedback.

Integration points:
- Triggers: `MouseTrigger`/`GamepadTrigger` can select an AI pie variant when `conditions` match and AI is enabled for the app.
- Editor: provide a “Generate with AI” button that seeds a baseline menu the user can edit and save.

---

## Editor UI Changes

- Keyboard: keep `ShortcutPicker` (existing)
- Mouse: add `MouseTriggerPicker`
  - Record button captures `mousedown` inside the dialog (button + current modifiers)
  - Options: When (`matching-conditions|always`), Passthrough (`on-cancel|never|always`)
- Gamepad: add `GamepadTriggerPicker`
  - Record listens via Gamepad API; captures button index; optional tilt threshold slider; stick selector

All pickers edit a `triggers[]` list on the menu.

---

## Gesture Pipeline Integration

The menu opens in the same state machine as keyboard triggers; thereafter pointer/gamepad input is handled by the existing InputMethods.

- PointerInput: unchanged for motion/jitter/marking/turbo/hover. Only the open event origin differs.
- GestureDetector: remains authoritative for corner/pause detection and fixed‑stroke; nothing changes here.
- GamepadInput: continues to publish an `InputState` with `distance/angle` based on stick tilt; optional “select on button up” adds a small arm/disarm flag in the input method.

Fast gesture modes (e.g., `fixedStrokeLength`) continue to apply; if configured, a gamepad tilt beyond threshold may immediately select upon button release if distance crosses the fixed stroke.

---

## Svelte Variant (browser)

Svelte apps can mirror the same TypeScript model without native code:
- Mouse triggers: use `pointerdown`/`contextmenu` on a global overlay to detect RMB/MMB; browsers allow canceling the default context menu
- Gamepad triggers: use the browser Gamepad API (as in Kando renderer) for both opening and browsing

The Svelte implementation should parse the same `triggers` array and apply identical selection/gesture logic, differing only in the capture layer.

---

## Telemetry, Testing, and Migration

- Logging: emit concise lines when a trigger matches or is ignored (kind, button/index, app/window, chosen menu)
- Unit tests: Zod schema for `triggers`; condition matcher remains as is
- Manual tests: per‑app RMB, double‑RMB passthrough, gamepad open/tilt/select, fixed‑stroke interactions
- Migration: if `triggers` missing, build a single `keyboard` trigger from `shortcut`/`shortcutID` at load time; editor writes the new schema going forward

---

## Rationale Summary

- Distinct trigger kinds keep platform realities clear (keyboard via Electron/portals; mouse via native hooks; gamepad via web API) while sharing the same conditions and open/gesture pipeline.
- Double‑RMB passthrough preserves native app context menus without spending a slice.
- The unified `triggers[]` is backward‑compatible and future‑proof (room for touch/pen or OS‑level gestures later).



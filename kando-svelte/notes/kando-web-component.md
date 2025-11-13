## Web Components with Svelte — Critiques, Support, Caveats, and Direction

### Summary of Rich Harris’s criticisms (condensed)
- Progressive enhancement: Web Components (CEs) don’t SSR and don’t render without JS, so they can’t progressively enhance document UX like plain HTML or framework‑SSR can. Using CEs for navigation or non‑interactive chrome is a bad fit.
- CSS in JS/string styles: Shadow DOM typically implies injecting styles via `<style>` in JS; this counters “less JS” and complicates pipeline vs extracted CSS. Constructable stylesheets/`::part` help but add complexity and aren’t universal.
- Platform complexity/fatigue: Adding new low‑level features increases browser surface area and long‑term maintenance burden; past detours (HTML Imports, early CE specs) show churn risk.
- Polyfills/historical gaps: Older cross‑browser support relied on heavy/buggy polyfills; legacy/embedded environments still complicate adoption.
- Composition pitfalls (slots): Slotted content renders eagerly; many apps want lazy/conditional rendering. Svelte v2 tried aligning with CE slot semantics and found real DX issues; v3 moved away from that model.
- Props vs attributes mismatch: HTML has inconsistent attr/prop semantics (types, names, reflection). CEs push authors to support both paths and observed attributes, increasing boilerplate and foot‑guns.
- Leaky lifecycle hooks: Methods like `attributeChangedCallback` are callable from userland (implementation details visible), which feels fragile.
- DOM ergonomics: Imperative DOM for app logic is verbose/error‑prone; frameworks provide clearer, batched, reactive models with less code and better update semantics.
- Global namespace: One global CE registry can collide and constrains naming.
- “Solved in userland”: Many CE goals are already addressed by frameworks with better DX; the platform investment may compete with improvements elsewhere.

Takeaway: CEs are useful for distribution/interop and encapsulation in specific cases, but often not ideal as the primary component model for apps, especially where SSR, lazy composition, and ergonomic reactivity matter.


### Svelte’s support for Custom Elements (Svelte 4/5)
- Compile to Custom Elements:
  - Use `<svelte:options customElement="tag-name" />` or `customElement={{ tag, shadow, props, extend }}`.
  - Exposes a static `.element` constructor for manual `customElements.define('tag', Component.element)`.
  - `$host()` rune gives access to the CE host for dispatching native `CustomEvent`s, form participation (via `ElementInternals` in `extend`), etc.
- Lifecycle model:
  - Svelte wraps the component in a CE shell. The inner Svelte component mounts in the microtask after `connectedCallback`, and unmounts in the microtask after `disconnectedCallback` if not reinserted.
  - Props set before connection are queued then applied on mount.
- Props/attributes:
  - Declare props with `$props()`; list props explicitly to be exposed on the element.
  - Configure attribute mapping, type conversion, reflection via `<svelte:options customElement={{ props: { ... } }}>`.
  - For complex inputs, prefer element properties over attributes.
- Shadow DOM control:
  - Default creates a shadow root; `shadow: 'none'` disables it (loses slots/encapsulation, but simplifies global styling).
- Class extension (`extend`):
  - Provide a function that returns a subclass of the generated CE to add class‑level features (e.g., `static formAssociated = true`, attach `ElementInternals`, expose imperative methods like `openAt(x, y)`). TS support is limited to erasable syntax.
- Events:
  - Dispatch via `$host().dispatchEvent(new CustomEvent('select', { detail }))`. Consumers listen with standard DOM event APIs. In Svelte apps, `on:event` works as with native elements.


### Caveats and limitations (from Svelte docs + ecosystem experience)
- No SSR for CEs: Shadow DOM is invisible server‑side; CEs are client‑only. Treat CE usage as CSR or as widgets, not server‑rendered structure.
- Styling and theming:
  - Shadow DOM encapsulation prevents page/global styles from affecting internals. Use CSS custom properties, `::part`/`exportparts`, or `shadow: 'none'` if you need global styling. Styles are inlined rather than extracted.
- Slots semantics differ from Svelte components:
  - Slotted content renders eagerly per DOM spec; lazy routing/layout patterns must be implemented explicitly.
- Context boundaries:
  - Svelte `setContext/getContext` works within a CE, not across CE boundaries.
- Attributes vs properties:
  - Attributes are strings; configure type conversion or prefer setting properties imperatively for rich data.
- Browser support and legacy environments:
  - Modern evergreen browsers are fine; legacy/embedded contexts may still require careful testing or avoid CEs.


### Where Svelte stands and likely direction
- Svelte continues to support producing and consuming Custom Elements but does not make them the default component model.
- Svelte 4/5 improved CE ergonomics with `$host`, richer `<svelte:options customElement={...}>`, and better packaging flows via SvelteKit’s `@sveltejs/package` (for Svelte libraries) and separate CE bundles.
- SSR for CEs remains out‑of‑scope for core; community tooling explores SSR‑adjacent ideas, but production SSR for CE/shadow DOM is not a present guarantee.
- Expect steady, pragmatic CE support (compile target + interop), while core focuses on Svelte’s primary strengths: runes reactivity, great SSR/SPA DX, and minimal runtime.


### Practical guidance for Kando (pie menus) and Micropolis
- Use a dual‑surface approach:
  - Svelte component export for SvelteKit consumers (best DX, SSR for outer app).
  - CE build for React/vanilla consumers (client‑only). Expose properties for complex inputs; emit `CustomEvent`s for outputs; optionally add imperative methods via `extend`.
- Overlay/gesture architecture:
  - Keep a single global manager and portal the overlay to `document.body` (fixed positioning) to avoid shadow/stacking issues. Bind input at `window/document` during open to bypass retargeting.
  - Themes: inject theme CSS at the overlay; use CSS variables on `:root` (or CE host) as knobs. Keep icon/sound themes registry‑driven and pass only ids/labels to clients.
- Shadow DOM choice:
  - Default to shadow for the CE host (encapsulation for host UI), but keep the overlay in the light DOM (portal) for full‑viewport clamping and pointer lock. Use `shadow: 'none'` only if you need global CSS to style host internals.

#### Why a global manager + many targets
- Pie menus are global overlays; their lifetime, viewport clamping, and gesture pipeline are orthogonal to the element you clicked.
- Model:
  - One singleton PieMenuManager (overlay root, gesture/selection state, theme/icon/sound registries).
  - Many lightweight “targets” (element, region, or background) that call `manager.show({ menu, x, y, ... })`.
  - Submenus and marking/turbo/hover are purely menu/gesture concerns handled by the manager.
- Benefits: consistent z‑index and clamping, no shadow retargeting pitfalls, clear separation between “what you clicked” and “overlay that appears”.

#### Pointer warping, pointer lock, and virtual cursor
- Optional pointer‑lock simulation: capture mouse input, hide native cursor, and animate a virtual cursor DOM element.
- Keep separate “visual” vs “destination” positions:
  - `simPos` (what’s drawn) animates toward `simDest` (the authoritative virtual pointer position used for events).
  - Motion events apply deltas to `simDest`; we send one synthesized move at `simDest` per frame. The animation of `simPos` is visual only.
- Expose CSS variables for debugging and theming:
  - `--kando-sim-x`, `--kando-sim-y` — animated visual cursor screen coords
  - `--kando-dest-x`, `--kando-dest-y` — authoritative virtual destination coords
  - `--kando-actual-x`, `--kando-actual-y` — real pointer coords (when not locked)
- Recommended defaults for the virtual cursor (themeable): black dot, thin white outline, soft shadow; show immediately on mousedown; animate back to real cursor on popdown.
- Always clamp to the viewport (position: fixed overlay) so scrolling doesn’t offset the menu.

Example debug line (optional in themes):

```css
.kando-overlay::before {
  content: '';
  position: fixed;
  left: min(var(--kando-sim-x), var(--kando-dest-x));
  top: min(var(--kando-sim-y), var(--kando-dest-y));
  width: calc(abs(var(--kando-dest-x) - var(--kando-sim-x)));
  height: 0;
  border-top: 1px dashed rgba(255,255,0,.6);
  pointer-events: none;
}
```

#### Proposed Kando Custom Element API (framework‑agnostic)
- Element tag: `kando-menu` (host), overlay is portaled to `document.body`.
- Properties (set as JS properties for rich data; attributes for simple scalars):
  - `config`: optional object for global options (e.g., `simulateWarp`, `globalTarget`, cursor styling vars).
  - `themeId`: string — menu theme id (CSS injected by manager).
  - `soundThemeId`: string — sound theme id.
  - `iconThemes`: object/string map or list — available icon themes.
  - `menus`: registry map `{ [menuId]: MenuDefinition }` (or call `registerMenu` imperatively).
  - `mouseBindings`: string[] — e.g., `['right','ctrl+right']` (browser variant; Electron/native uses backend).
- Methods (imperative, exposed via `extend` or a companion wrapper):
  - `show(options)`: open a menu. Options mirror Kando’s `ShowMenuOptions` — `{ menuId, x, y, centeredMode, anchoredMode, hoverMode }`.
  - `cancel(reason?)`: close the active menu.
  - `registerMenu(id, def)`, `unregisterMenu(id)`.
  - `registerTheme(kind, id, def)` for `menu|icon|sound`.
  - `setPointerLock(enabled: boolean)`.
- Events (native `CustomEvent`s):
  - `open` `{ menuId, x, y }`
  - `hover` `{ path, item, coords }`
  - `unhover` `{ path }`
  - `move` `{ x, y }`
  - `select` `{ path, item, coords }`  ← primary output
  - `cancel` `{ reason }`
- Type guidance:
  - CE boundaries are not reactive; treat inputs as id/config objects and outputs as `CustomEvent`s.
  - For strongly‑typed consumers (TS/React/Svelte), ship d.ts types for method signatures and event `detail`.

#### Using in frameworks
- SvelteKit (best DX):
  - Import Svelte component wrapper directly for SSR of host layout; the overlay still attaches on the client.
  - For “CE mode,” lazy‑load the CE define bundle on the client only.
- React:
  - Use a `ref` to `kando-menu`, set properties in an effect, attach listeners with `addEventListener`. Treat it as a client component (no SSR).
  - Optional thin React adapter can wire props→properties and events→callbacks.
- Vanilla:
  - Load the ESM define bundle (`customElements.define('kando-menu', Kando.element)`) and use `<kando-menu>` directly. Set properties imperatively and listen to `CustomEvent`s.

#### Packaging plan
- Svelte library export (for Svelte apps):
  - Use `@sveltejs/package` to publish `src/lib` to `dist`, with `exports` exposing `index.js` and types.
- CE bundle (for React/vanilla):
  - Compile the same wrapper with `<svelte:options customElement={{ tag: 'kando-menu' }}>` or export `.element` and define in a tiny `define.js`.
  - Ship an ESM entry that performs `customElements.define('kando-menu', Kando.element)`. Keep CSS inlined for shadow host; overlay/theme CSS injected at runtime by the manager.
  - Document property vs attribute usage; encourage properties for complex objects, attributes for booleans/strings/numbers with Svelte CE type conversion when desired.

#### Events vs direct function calls
- Prefer imperative methods for commands (`show`, `cancel`, `register*`) and `CustomEvent` for outputs (`select`, `cancel`, …).
- Inside Svelte CE, expose methods via `customElement.extend` so they are available before inner mount if necessary.
- Avoid overusing DOM events for inputs; set element properties instead for performance, typing, and clarity.

#### SSR stance (why it’s acceptable here)
- Pie menus are transient overlays; SSR provides little value for the overlay itself.
- Treat the CE or wrapper as “client‑only”; SSR the rest of the application normally.
- If host UI must appear before hydration, render a simple placeholder and hydrate the menu subsystem on first interaction.


### References (for further reading)
- Svelte docs: Custom elements, `<svelte:options>`, `$host`, Packaging.
- Rich Harris: “Why I don’t use web components” (key critiques above).
- Custom Elements Everywhere: Interop scores for frameworks and CE usage.



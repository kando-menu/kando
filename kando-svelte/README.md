# kando-svelte (library)

Svelte 5 library that renders Kando pie menus in web/SvelteKit apps.

Goals
- Be compatible with Kando data, themes and algorithms.
- Reuse Kando source directly (math, types, schemata) where practical.
- Keep rendering and event wiring idiomatic Svelte 5.

What it is
- A Svelte 5 library exporting components and helpers:
  - `PieMenu.svelte`: render a Kando menu tree; emits `select`, `cancel`, `hover`, `unhover` events.
  - `PieItem.svelte`, `SelectionWedges.svelte`, `WedgeSeparators.svelte`: building blocks.
  - `Vendor`: convenient URLs for a bundled default theme and a minimal "none" sound theme.
  - `theme-loader`: utilities to load JSON5 theme metadata, inject theme.css, and apply color overrides.
  - `validation`: re-exports Kando zod schemata and simple parse helpers (optional to use).

What it is not
- It does not perform file system discovery, snapshot management, or OS integrations.
- It does not implement execution of platform-specific item actions (command/file/hotkey/macro/settings).
- It does not bundle icon fonts/CSS; the host app should include Material Symbols / Simple Icons if used by the chosen theme.

Compatibility
- Types: re-exported from Kando (`@kando/common`, `@kando/schemata/*`).
- Math: imported from Kando (`src/common/math`).
- Themes: accepts a `MenuThemeDescription` object or can load from a theme directory via `themeDirUrl` + `themeId`.

Install & build (library)
```bash
# from the library folder
npm install
npm run build    # builds .svelte-kit and dist via svelte-package
```

Usage (consumer app)
```svelte
<script lang="ts">
  import { PieMenu } from 'kando-svelte';
  import type { MenuItem, MenuThemeDescription } from 'kando-svelte';

  // Provide either a ready theme object…
  export let theme: MenuThemeDescription;
  export let root: MenuItem;

  // …or let the component load a theme from a directory
  // <PieMenu themeDirUrl="/kando/menu-themes" themeId="default" {root} />
</script>

<PieMenu {theme} {root}
         on:select={(e) => console.log('select', e.detail)} />
```

Theme loading
- `PieMenu` props:
  - `theme` (object) OR `themeDirUrl` + `themeId` (string).
  - When loading by URL, `theme-loader` fetches `theme.json5`, injects `theme.css`, and applies colors.
- You can also use the exported `Vendor.defaultThemeCss` and `Vendor.defaultThemeJson` URLs for a built-in default theme.

Sound themes
- The library bundles a minimal "none" sound theme JSON (`Vendor.noneSoundThemeJson`).
- For real sound themes, load them in your app and use Howler in client-only lifecycle hooks.

Icons
- Include the icon CSS your themes expect in the app (e.g. in `app.html`):
  - Material Symbols Rounded CSS (Google Fonts) or the `material-symbols` npm package.
  - `simple-icons-font` if you use Simple Icons.

Svelte 5
- Internals use Svelte 5 runes for state/derived/effect where appropriate.
- Public API remains plain props/events for maximum compatibility.

Notes on path aliases
- This repo uses `kit.alias` in `svelte.config.js` to reference Kando sources during development.
- If you publish this library to npm, either bundle those sources or depend on a separate `kando-core` package.

License & attribution
- Kando is MIT; themes and font assets have their own licenses (e.g., CC0-1.0 for the default theme).
- Preserve SPDX headers and attributions when copying code.

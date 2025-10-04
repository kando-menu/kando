# kando-svelte-demo (SvelteKit app)

Single-page demo that loads a static Kando snapshot (config.json, menus.json, themes/sounds) and renders:
- A summary of config and theme metadata
- A recursive outline of all menus and items
- (future) The `PieMenu` component from `kando-svelte` for interactive previews

What it is
- A minimal SvelteKit app to validate data loading and rendering using the kando-svelte library.
- Uses JSON5 to parse theme.json5 and Kando’s zod schemata (optional) to validate inputs.

What it is not
- It does not implement OS-specific item actions (command/file/hotkey/macro/settings).
- It does not ship platform backends.

Snapshot layout (under `static/`)
```
static/
  kando/
    config.json
    menus.json
    menu-themes/ <symlink or copy of Kando’s themes>
    sound-themes/ <symlink or copy>
    icon-themes/ <optional>
  kando-vendor/
    menu-themes/default/{ theme.json5, theme.css }
    sound-themes/none/theme.json
```

Install & run
```bash
cd kando-svelte-demo
npm install
npm run dev -- --open
# or build/preview
npm run build
npm run preview
```

Using the library
- The demo depends on the local library via `file:../kando-svelte`.
- Build the library first if you change it:
```bash
cd ../kando-svelte
npm run build
```

Icon CSS
- If themes expect icon fonts, include them (e.g., in `src/app.html`):
  - Material Symbols Rounded CSS (Google Fonts) or `material-symbols` npm package.
  - `simple-icons-font` for Simple Icons.

Notes
- The demo logs key load steps to the console to aid debugging.
- For production, copy assets into `static/` (symlinks may not survive packaging).

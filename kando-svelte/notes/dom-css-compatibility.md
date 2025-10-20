# Exhaustive DOM/CSS compatibility report (Svelte vs Kando)

This document captures the exact DOM/CSS contract Kando uses and the differences observed in kando‑svelte, together with concrete fixes. The goal is 100% compatibility: same DOM structure, same CSS variables, same classes, and the same behavior across themes.

## 1) High‑level structure

- Kando
  - Single nested tree. One `div.menu-node.level-0` (the parent/center) contains all descendants.
  - The selected child that becomes the new center is still a descendant of the parent and is positioned via a relative translate inside the parent node.
- Current Svelte
  - Two parallel trees rendered as separate siblings: one `.pie-level` for the parent preview and another `.pie-level` for the active tip level.
  - Both centers are absolutely translated to the same screen center, instead of nesting the active center under the parent.
- Fix
  - Render a single `PieMenu` tree. If you keep a parent preview, its active child MUST be an immediate child of the parent `menu-node` with a relative `translate(...)` equal to child distance in the selected direction. Avoid a second top‑level `.pie-level` for the active level.

## 2) Center positioning

- Kando
  - Parent center: `transform: translate(<absX>, <absY>)` on `.menu-node.level-0.parent`.
  - Active submenu center: `transform: translate(dx, dy)` on `.menu-node.level-1.active`, where `dx/dy = max(--child-distance, 10px * var(--sibling-count)) * (--dir-x/--dir-y)`. Absolute center = parent absolute + relative.
- Current Svelte
  - Both parent and tip `.menu-node.level-0` receive the same absolute translate.
  - The active center is not a relative child of the parent; child placement and connectors misalign and “slide”.
- Fix
  - Keep the parent `.menu-node.level-0` translated to absolute center. Insert the active child `.menu-node.level-1.active` as its descendant with relative translate only. Do not re‑translate a second root.

## 3) DOM nesting and levels

- Kando: `.menu-node.level-0.parent` contains `.menu-node.level-1.*` children; each level‑1 submenu contains `.menu-node.level-2.*` grandchildren.
- Current Svelte: the top‑level “tip” `.menu-node.level-0.active` contains `.level-1.*`, while a separate `.level-0.parent` exists alongside it.
- Fix: ensure the “active” level (and its grandchildren) are descendants of the parent node, not siblings in a different top‑level container.

## 4) Parent/child bars, gaps and “nubs”

- Kando: parent’s `.connector` is drawn inside `.menu-node.level-0.parent` with a width equal to the active child distance and rotated to connect to that child. The active child sits at the connector end.
- Current Svelte: parent and active levels are disconnected; connectors are computed relative to duplicate centers; bars and nubs don’t align.
- Fix: compute the parent connector width/rotation inside the parent node (only) and position the active child as a descendant of the parent. Stop drawing connectors in a duplicate “tip” tree.

## 5) Relative transforms and CSS contract

- Kando: children/grandchildren transform via CSS only using `--dir-x/--dir-y` and theme distances:
  - Child: `translate(calc(max(var(--child-distance), 10px * var(--sibling-count)) * var(--dir-x)), calc(... * var(--dir-y)))`.
  - Grandchild: `translate(var(--grandchild-distance) * var(--dir-x), var(--grandchild-distance) * var(--dir-y))`.
  - JS sets inline transforms only for dragged/clicked items.
- Current Svelte: correct vars exist but the wrong ancestor breaks relative positioning.
- Fix: keep children/grandchildren in the correct parent; do NOT inline transforms on children (except drag/click); let theme CSS position them.

## 6) Active submenu center transform

- Kando: `.menu-node.level-1.type-submenu.active` has a relative `translate(dx, dy)` under the parent (e.g., `translate(≈0px, -150px)` for a top child).
- Current Svelte: no `.level-1.active` relative translate under the parent; a second `.level-0.active` is used instead.
- Fix: produce `.menu-node.level-1.active` under the parent with relative translate per theme CSS rules.

## 7) `--parent-angle` propagation for grandchildren

- Kando: grandchildren `.level-2` nodes carry `--parent-angle: <child.angle>deg` to orient wedges/gaps.
- Current Svelte: sets `--parent-angle`, but grandchildren live under a separate root so visuals appear in the wrong place.
- Fix: ensure grandchildren are descendants of the selected child (itself a descendant of the parent) so `--parent-angle` works as intended.

## 8) Selection wedges and separators

- Kando: global singletons sized to the viewport; separators: `translate(centerX, centerY) rotate(angle-90deg)`; wedges read `--center-x/--center-y`.
- Current Svelte: components added and translated correctly but must be driven by the same center as the single nested tree.
- Fix: maintain one instance of each overlay, recomputed when chain/hover changes.

## 9) Center text

- Kando: `center-text` is absolutely positioned with `translate(centerX, centerY)` and uses deferred measurement to vertically center text in the circle; cached for performance.
- Current Svelte: placeholder; placed within the active node without iterative layout.
- Fix: replicate `center-text.ts` (deferred measurement + caching) and absolutely translate to the active center.

## 10) Icon font tag

- Kando: `<i class="material-symbols-rounded">glyph</i>` and `<i class="si si-<name>"></i>` in `.icon-container`.
- Current Svelte: updated to `<i>` (good). Keep consistent.

## 11) Directional classes

- Kando: `.left/.right/.top/.bottom` based on `--dir-x/--dir-y` thresholds.
- Fix: keep generating these; correctness depends on proper nesting.

## 12) Connector rotation accumulation

- Kando: avoids 360° flips by tracking `lastConnectorAngle` and using closest‑equivalent rotation.
- Current Svelte: connector angle recomputed directly; can flip.
- Fix: store/accumulate connector rotation per item using closest‑equivalent logic.

## 13) Duplicate centers and the “sliding” bug

- Root cause: a second absolute root is rendered for the active level; the UI slides instead of nesting.
- Fix: use one root; move it once when needed; nest the active center under the parent.

---

## Concrete implementation changes (Svelte)

### `PieTree.svelte`
- Render a single nested tree (remove separate tip tree).
- On selection, compute the new root center per Kando’s `selectItem()`; then nest the active child relative to the parent.
- Keep a single global wedges/separators overlay driven by the same center.

### `PieMenu.svelte`
- Stop creating a second `.level-0.active` root.
- Render `.level-1.active` as a child of the parent node; children/grandchildren position via CSS vars only.
- Set `--parent-angle` for grandchildren; compute parent connector width/rotation in parent; use closest‑equivalent rotation.

### `PieItem.svelte`
- Maintain `<i>` icon tags; set CSS vars and directional classes; avoid inline transforms (except drag/click).

### `SelectionWedges.svelte` / `WedgeSeparators.svelte`
- Singletons; `translate(center.x, center.y) rotate(angle-90deg)` for separators; wedges read `--center-x/--center-y` and hovered wedge angles.

### `CenterText.svelte`
- Implement iterative layout and caching; translate to active center; mirror Kando behavior.

---

## Key acceptance checks

- One `.menu-node.level-0.parent` at absolute center containing the entire tree.
- After selecting a submenu, the active `.menu-node.level-1.active` is a descendant with correct relative translate.
- Parent connector terminates exactly at the active child; bars/nubs align; wedges/separators rotate correctly.
- Direction classes, CSS vars, and name/icon layers behave identically across Kando’s themes.

---

## Kando Goal HTML and CSS outerHTML (Apps submenu selected)

```html
<div id="kando-menu" class="" style="--fade-in-duration: 150ms; --fade-out-duration: 200ms;">
  <div class="menu-node level-0 type-submenu parent" data-name="Example Menu" style="transform: translate(732px, 351.541px);">
    <div class="menu-node left level-1 type-submenu grandchild" data-name="Bookmarks" style="--dir-x: -0.7071067811865477; --dir-y: -0.7071067811865475; --angle: 315deg; --sibling-count: 8; --angle-diff: 40.23635830927378;">
      <div class="menu-node left level-2 type-command grandchild" data-name="Music" style="--dir-x: -0.7071067811865477; --dir-y: -0.7071067811865475; --angle: 315deg; --sibling-count: 7; --parent-angle: 315deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">music_note</i>
          </div>
        </div>
      </div>
      <div class="menu-node left level-2 type-command grandchild" data-name="Home" style="--dir-x: -1; --dir-y: 1.2246467991473532e-16; --angle: 270deg; --sibling-count: 7; --parent-angle: 315deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">home</i>
          </div>
        </div>
      </div>
      <div class="menu-node left level-2 type-command grandchild" data-name="Desktop" style="--dir-x: -0.7071067811865475; --dir-y: 0.7071067811865476; --angle: 225deg; --sibling-count: 7; --parent-angle: 315deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">desktop_windows</i>
          </div>
        </div>
      </div>
      <div class="menu-node bottom level-2 type-command grandchild" data-name="Docuexample-menu.bookmarks.documentsments" style="--dir-x: 6.123233995736766e-17; --dir-y: 1; --angle: 180deg; --sibling-count: 7; --parent-angle: 315deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">text_ad</i>
          </div>
        </div>
      </div>
      <div class="menu-node right level-2 type-command grandchild" data-name="Pictures" style="--dir-x: 1; --dir-y: 0; --angle: 90deg; --sibling-count: 7; --parent-angle: 315deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">imagesmode</i>
          </div>
        </div>
      </div>
      <div class="menu-node right level-2 type-command grandchild" data-name="Videos" style="--dir-x: 0.7071067811865476; --dir-y: -0.7071067811865475; --angle: 45deg; --sibling-count: 7; --parent-angle: 315deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">video_camera_front</i>
          </div>
        </div>
      </div>
      <div class="menu-node top level-2 type-command grandchild" data-name="Downloads" style="--dir-x: 6.123233995736766e-17; --dir-y: -1; --angle: 0deg; --sibling-count: 7; --parent-angle: 315deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">download</i>
          </div>
        </div>
      </div>
      <div class="icon-layer">
        <div class="icon-container">
          <i class="material-symbols-rounded">folder_special</i>
        </div>
      </div>
      <div class="connector"></div>
    </div>

    <div class="menu-node left level-1 type-command grandchild" data-name="Previous Workspace" style="--dir-x: -1; --dir-y: 1.2246467991473532e-16; --angle: 270deg; --sibling-count: 8; --angle-diff: 85.23635830927378;">
      <div class="icon-layer">
        <div class="icon-container">
          <i class="material-symbols-rounded">arrow_back</i>
        </div>
      </div>
    </div>

    <div class="menu-node left level-1 type-submenu grandchild" data-name="Windows" style="--dir-x: -0.7071067811865475; --dir-y: 0.7071067811865476; --angle: 225deg; --sibling-count: 8; --angle-diff: 130.23635830927378;">
      <div class="menu-node left level-2 type-hotkey grandchild" data-name="Tile Left" style="--dir-x: -1; --dir-y: 1.2246467991473532e-16; --angle: 270deg; --sibling-count: 4; --parent-angle: 225deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">text_select_jump_to_beginning</i>
          </div>
        </div>
      </div>
      <div class="menu-node bottom level-2 type-hotkey grandchild" data-name="Close Window" style="--dir-x: 6.123233995736766e-17; --dir-y: 1; --angle: 180deg; --sibling-count: 4; --parent-angle: 225deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">cancel_presentation</i>
          </div>
        </div>
      </div>
      <div class="menu-node right level-2 type-hotkey grandchild" data-name="Tile Right" style="--dir-x: 1; --dir-y: 0; --angle: 90deg; --sibling-count: 4; --parent-angle: 225deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">text_select_jump_to_end</i>
          </div>
        </div>
      </div>
      <div class="menu-node top level-2 type-command grandchild" data-name="Mission Control" style="--dir-x: 6.123233995736766e-17; --dir-y: -1; --angle: 0deg; --sibling-count: 4; --parent-angle: 225deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">select_window</i>
          </div>
        </div>
      </div>
      <div class="icon-layer">
        <div class="icon-container">
          <i class="material-symbols-rounded">select_window</i>
        </div>
      </div>
      <div class="connector"></div>
    </div>

    <div class="menu-node bottom level-1 type-submenu grandchild" data-name="Audio" style="--dir-x: 6.123233995736766e-17; --dir-y: 1; --angle: 180deg; --sibling-count: 8; --angle-diff: 175.23635830927378;">
      <div class="menu-node left level-2 type-command grandchild" data-name="Previous Track" style="--dir-x: -1; --dir-y: 1.2246467991473532e-16; --angle: 270deg; --sibling-count: 3; --parent-angle: 180deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">skip_previous</i>
          </div>
        </div>
      </div>
      <div class="menu-node bottom level-2 type-command grandchild" data-name="Play / Pause" style="--dir-x: 6.123233995736766e-17; --dir-y: 1; --angle: 180deg; --sibling-count: 3; --parent-angle: 180deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">play_pause</i>
          </div>
        </div>
      </div>
      <div class="menu-node right level-2 type-command grandchild" data-name="Next Track" style="--dir-x: 1; --dir-y: 0; --angle: 90deg; --sibling-count: 3; --parent-angle: 180deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">skip_next</i>
          </div>
        </div>
      </div>
      <div class="icon-layer">
        <div class="icon-container">
          <i class="material-symbols-rounded">play_circle</i>
        </div>
      </div>
      <div class="connector"></div>
    </div>

    <div class="menu-node right level-1 type-submenu grandchild" data-name="Clipboard" style="--dir-x: 0.7071067811865476; --dir-y: 0.7071067811865475; --angle: 135deg; --sibling-count: 8; --angle-diff: 139.76364169072622;">
      <div class="menu-node left level-2 type-hotkey grandchild" data-name="Cut" style="--dir-x: -1; --dir-y: 1.2246467991473532e-16; --angle: 270deg; --sibling-count: 3; --parent-angle: 135deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">cut</i>
          </div>
        </div>
      </div>
      <div class="menu-node bottom level-2 type-hotkey grandchild" data-name="Copy" style="--dir-x: 6.123233995736766e-17; --dir-y: 1; --angle: 180deg; --sibling-count: 3; --parent-angle: 135deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">content_copy</i>
          </div>
        </div>
      </div>
      <div class="menu-node right level-2 type-hotkey grandchild" data-name="Paste" style="--dir-x: 1; --dir-y: 0; --angle: 90deg; --sibling-count: 3; --parent-angle: 135deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">content_paste_go</i>
          </div>
        </div>
      </div>
      <div class="icon-layer">
        <div class="icon-container">
          <i class="material-symbols-rounded">assignment</i>
        </div>
      </div>
      <div class="connector"></div>
    </div>

    <div class="menu-node right level-1 type-command grandchild" data-name="Next Workspace" style="--dir-x: 1; --dir-y: 0; --angle: 90deg; --sibling-count: 8; --angle-diff: 94.76364169072622;">
      <div class="icon-layer">
        <div class="icon-container">
          <i class="material-symbols-rounded">arrow_forward</i>
        </div>
      </div>
    </div>

    <div class="menu-node right level-1 type-submenu grandchild" data-name="Web Links" style="--dir-x: 0.7071067811865476; --dir-y: -0.7071067811865475; --angle: 45deg; --sibling-count: 8; --angle-diff: 49.76364169072622;">
      <div class="menu-node left level-2 type-uri grandchild" data-name="Kando on Discord" style="--dir-x: -0.25881904510252063; --dir-y: -0.9659258262890683; --angle: 345deg; --sibling-count: 5; --parent-angle: 45deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="si si-discord"></i>
          </div>
        </div>
      </div>
      <div class="menu-node left level-2 type-uri grandchild" data-name="Kando on YouTube" style="--dir-x: -0.9659258262890684; --dir-y: -0.25881904510252035; --angle: 285deg; --sibling-count: 5; --parent-angle: 45deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="si si-youtube"></i>
          </div>
        </div>
      </div>
      <div class="menu-node right level-2 type-uri grandchild" data-name="Kando on Ko-fi" style="--dir-x: 0.25881904510252074; --dir-y: 0.9659258262890683; --angle: 165deg; --sibling-count: 5; --parent-angle: 45deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="si si-kofi"></i>
          </div>
        </div>
      </div>
      <div class="menu-node right level-2 type-uri grandchild" data-name="Kando on GitHub" style="--dir-x: 0.9659258262890683; --dir-y: 0.25881904510252074; --angle: 105deg; --sibling-count: 5; --parent-angle: 45deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="si si-github"></i>
          </div>
        </div>
      </div>
      <div class="menu-node right level-2 type-uri grandchild" data-name="Google" style="--dir-x: 0.7071067811865476; --dir-y: -0.7071067811865475; --angle: 45deg; --sibling-count: 5; --parent-angle: 45deg;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="si si-google"></i>
          </div>
        </div>
      </div>
      <div class="icon-layer">
        <div class="icon-container">
          <i class="material-symbols-rounded">public</i>
        </div>
      </div>
      <div class="connector"></div>
    </div>

    <div class="menu-node top level-1 type-submenu active" data-name="Apps" style="--dir-x: 6.123233995736766e-17; --dir-y: -1; --angle: 0deg; --sibling-count: 8; --angle-diff: 4.763641690726217; transform: translate(9.58536e-15px, -156.541px);">
      <div class="menu-node left level-2 type-command child" data-name="Terminal" style="--dir-x: -0.8660254037844386; --dir-y: -0.5000000000000001; --angle: 300deg; --sibling-count: 5; --parent-angle: 0deg; --angle-diff: 149.4907175950225;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">terminal</i>
          </div>
        </div>
      </div>
      <div class="menu-node left level-2 type-command child" data-name="Finder" style="--dir-x: -0.8660254037844387; --dir-y: 0.49999999999999994; --angle: 240deg; --sibling-count: 5; --parent-angle: 0deg; --angle-diff: 150.5092824049775;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">folder_shared</i>
          </div>
        </div>
      </div>
      <div class="menu-node right level-2 type-command child" data-name="Music" style="--dir-x: 0.8660254037844387; --dir-y: 0.49999999999999994; --angle: 120deg; --sibling-count: 5; --parent-angle: 0deg; --angle-diff: 30.509282404977526;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="si si-itunes"></i>
          </div>
        </div>
      </div>
      <div class="menu-node right level-2 type-command child hovered" data-name="E-Mail" style="--dir-x: 0.8660254037844387; --dir-y: -0.49999999999999994; --angle: 60deg; --sibling-count: 5; --parent-angle: 0deg; --angle-diff: 29.490717595022474;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="material-symbols-rounded">mail</i>
          </div>
        </div>
      </div>
      <div class="menu-node top level-2 type-command child" data-name="Safari" style="--dir-x: 6.123233995736766e-17; --dir-y: -1; --angle: 0deg; --sibling-count: 5; --parent-angle: 0deg; --angle-diff: 89.49071759502247;">
        <div class="icon-layer">
          <div class="icon-container">
            <i class="si si-safari"></i>
          </div>
        </div>
      </div>
      <div class="icon-layer" style="--pointer-angle: 89.49071759502247deg; --hover-angle: 60deg; --hovered-child-angle: 60deg;">
        <div class="icon-container">
          <i class="material-symbols-rounded">apps</i>
        </div>
      </div>
      <div class="connector" style="width: 0px; transform: rotate(-30deg);"></div>
    </div>

    <div class="icon-layer" style="--pointer-angle: -4.763641690726217deg; --hover-angle: 0deg; --hovered-child-angle: 0deg;">
      <div class="icon-container">
        <i class="material-symbols-rounded">award_star</i>
      </div>
    </div>
    <div class="connector" style="width: 156.541px; transform: rotate(-90deg);"></div>
  </div>

  <div class="center-text" style="transform: translate(732px, 195px); width: 92.4175px; height: 22px; top: -11px; left: -46.2088px;">E-Mail</div>
</div>
```

---

## Kando DOM/CSS and Protocol Contracts (Authoritative)

This section defines the target contract the Svelte implementation MUST match exactly.

### A. Layering and Structure
- One overlay root per popup with two logical layers:
  - Parent layer: `.menu-node.level-0.parent` positioned at absolute center using `transform: translate(<cx>, <cy>)`.
  - Active layer: `.menu-node.level-0.active` positioned at the same absolute center. Its `.level-1` children are rendered here.
- Grandchild previews ("nubs") are rendered in the parent layer under each `.level-1` child that has children, as `.menu-node.level-2.grandchild` elements. They are not separate menus.
- No duplicate absolute roots other than the two centers above.

### B. Class names and dataset attributes
- Every node is `.menu-node level-<n> type-<kind> [parent|active|child|grandchild] [left|right|top|bottom]`.
- Required data attributes for tooling and themes:
  - `data-name`, `data-type`, `data-path`, `data-level`.
- Directional classes derive from `--dir-x/--dir-y` thresholds exactly like Kando.

### C. Inline styles and CSS custom properties
- Inline style variables are authoritative inputs for theme CSS:
  - `--dir-x`, `--dir-y`: unitless direction cosines for each item.
  - `--angle`: item’s absolute direction in degrees.
  - `--sibling-count`: number of siblings at that level.
  - `--child-distance`: pixel radius for level‑1 children; set on the center node.
  - `--parent-angle`: on grandchildren, equal to the angle of their parent (the selected child) relative to its parent center.
  - Optional: `--angle-diff` for themes that need delta from pointer.
- Center nodes apply absolute `transform: translate(centerX, centerY)` only. Children and grandchildren must not receive inline `transform` from JS (except transient drag/press effects). Their placement is driven by CSS using the variables above.

### D. Child placement (CSS-driven, no JS transforms)
- Level‑1 children translation relative to center:
  - `translate(calc(max(var(--child-distance), 10px * var(--sibling-count)) * var(--dir-x)), calc(max(var(--child-distance), 10px * var(--sibling-count)) * var(--dir-y)))`.
- Level‑2 grandchildren translation relative to their child:
  - `translate(calc(var(--grandchild-distance) * var(--dir-x)), calc(var(--grandchild-distance) * var(--dir-y)))`.
- Themes define `--grandchild-distance`; core code only sets `--parent-angle` for wedge alignment.

### E. Connectors and gaps
- The parent layer draws a single `.connector` inside `.menu-node.level-0.parent`:
  - Width equals distance from parent center to the selected child’s center.
  - Rotation equals `angle(parent→child) - 90deg`, accumulated with closest‑equivalent logic to avoid flips.
- The active layer draws its own `.connector` sized to `--child-distance` and rotated to the hovered child; it may be zero width.
- Gaps and “nubs” are entirely CSS-driven via `--parent-angle` on descendants.

### F. Layers content and ordering
- Theme layers follow Kando’s `MenuThemeDescription.layers` contract. Typical:
  - `.icon-layer[data-content="icon"]` (required for icon glyphs)
  - `.label-layer[data-content="name"]` (optional; theme decides visibility and style)
- Icons render inside `.icon-container` as:
  - `<i class="material-symbols-rounded">{glyph}</i>` or `<i class="si si-{name}"></i>`
  - SVG `<img>` allowed for packs; must live inside `.icon-container`.
- A visually hidden `<output aria-live="polite" aria-atomic="true">` mirrors the center label for screen readers.

### G. Center text
- A `.center-text` element is absolutely positioned at the center using `transform: translate(-50%, -50%)` within the center node’s local space.
- Text content is the hovered child’s name on the active layer and the parent item’s name on the parent layer.
- Measurement is deferred and cached to ensure proper max‑width and vertical centering without layout thrash.

### H. Selection wedges and separators (overlays)
- Singletons:
  - Separators: `translate(centerX, centerY) rotate(angle - 90deg)` for each separator angle.
  - Wedges: read `--center-x`, `--center-y`, `--start-angle`, `--end-angle` from the active selection; use viewport‑sized geometry.
- These overlays are recomputed when pointer, hover, or chain change.

### I. Input protocol (mouse/keyboard/gamepad)
- Hovering and selection state machine: `idle` → `pressed-static` → `pressed-dragging` → `hovering` → selection.
- Mouse binding parity: left click selects; right click cancels or selects parent (config); X1 back pops chain.
- Escape cancels; Backspace/Delete pops one level.
- No global keyboard capture outside the overlay; focus remains scoped.

### J. Lifecycle and creation
- Only two centers exist concurrently: parent and active. Deeper submenus are not instantiated; their “nubs” are rendered by the parent level as `.level-2.grandchild` nodes.
- Entering a submenu updates the chain; the parent remains at the same absolute translate; the active center is rendered in its own layer and children are positioned by CSS.

### K. Accessibility
- Use `role="application"` on the overlay root and `role="menuitem"` per node.
- The live region `<output aria-live="polite" aria-atomic="true">` announces hovered item names.
- Directional classes and labels must not interfere with screen readers; icons are `aria-hidden`.

These constraints form the binding contract for 100% theme compatibility with Kando. Any deviation (extra wrappers, missing variables, inline transforms on children, incorrect layering) will cause visual or behavioral drift across themes and must be avoided.

---

## Kando Menu Themes: DOM/CSS Protocol (Authoritative)

This section describes the theme engine contract the implementation must honor exactly so all existing Kando themes work without modification.

### 1. Theme package layout
- A theme directory contains at minimum: `theme.json5`, `theme.css`, `preview.jpg` (plus optional `REUSE.toml`).
- Assets (fonts, images, SVG) live alongside or in subfolders; CSS references them via relative URLs.

### 2. `theme.json5` metadata keys
- `name`, `author`, `license`, `themeVersion`, `engineVersion` (compatibility gate)
- `maxMenuRadius` (px): soft constraint used by Kando when nudging menus from screen edges.
- `centerTextWrapWidth` (px): maximum width for center text measurement and wrapping.
- `drawChildrenBelow` (boolean): whether children render “below” the center (affects stacking hints only; actual transforms remain CSS-driven).
- `drawCenterText` (boolean): whether a `.center-text` element should be shown.
- `drawSelectionWedges` (boolean): whether selection wedges are drawn.
- `drawWedgeSeparators` (boolean): whether separator lines are drawn between wedges.
- `colors: { <css-var-name>: <color> }`: theme‑configurable color variables injected into CSS (e.g., `--background-color`, `--text-color`).
- `layers: Array<{ class: string; content: 'none'|'icon'|'name' }>`: ordered top‑to‑bottom layer descriptors, created for each `.menu-node`.

### 3. Layer DOM contract
- For each `.menu-node`, create one div for each `layers[]` item with:
  - `class` attribute set to the layer’s class (e.g., `icon-layer`, `label-layer`).
  - `data-content` attribute equal to `content`.
- `content` behavior:
  - `none`: empty layer (used for backgrounds, outlines, effects via CSS).
  - `icon`: contains `<div class="icon-container">…</div>`.
    - Inside the container:
      - Material Symbols: `<i class="material-symbols-rounded">glyph</i>`
      - Simple Icons: `<i class="si si-{name}"></i>`
      - Optional SVG: `<img src="..." alt="{item.name}">`
  - `name`: the layer’s text content is the item name.
- Order matters. First `layers[]` entry is rendered on top; last entry is at the bottom (same as Kando).

### 4. Node classes and attributes
- Each item is rendered as `.menu-node` with classes:
  - `level-<n>`: depth (root is 0, children 1, grandchildren 2, …)
  - `type-<kind>`: Kando item type (submenu, command, hotkey, uri, macro, …)
  - State classes: `active`, `parent`, `child`, `grandchild`, `hovered`, `clicked`, `dragged`
  - Direction classes: `left`, `right`, `top`, `bottom` per direction thresholds
- Required data attributes:
  - `data-name`, `data-type`, `data-path`, `data-level`

### 5. Inline CSS variables (authoritative inputs to theme CSS)
Set on `.menu-node` as inline styles:
- `--dir-x`, `--dir-y`: unitless direction cosines of the item
- `--angle`: absolute direction in degrees
- `--sibling-count`: number of siblings at that level
- `--child-distance`: pixel radius for level‑1 children; set on center node (active or parent as applicable)
- `--parent-angle`: on grandchildren: the angle of their parent (child) relative to its parent center
- `--angle-diff` (optional): difference to pointer for hover/zoom effects

Center node special variables for layers (set as inline or style props on layers):
- `--pointer-angle`: current pointer angle (deg) around center
- `--hover-angle`: angle of hovered child (deg)
- `--hovered-child-angle`: same as `--hover-angle` when a child is hovered and the parent is not hovered

### 6. Transform rules (CSS-driven)
- Center nodes (both parent and active) use inline `transform: translate(centerX, centerY)` to move to absolute screen center.
- Children (level‑1) placement (no inline JS transforms):
  - `translate(calc(max(var(--child-distance), 10px * var(--sibling-count)) * var(--dir-x)), calc(max(var(--child-distance), 10px * var(--sibling-count)) * var(--dir-y)))`
- Grandchildren (level‑2) placement relative to their level‑1 parent:
  - `translate(calc(var(--grandchild-distance) * var(--dir-x)), calc(var(--grandchild-distance) * var(--dir-y)))`
- Themes define `--grandchild-distance`, `--center-size`, `--child-size`, `--grandchild-size`, `--connector-width`, and transitions.

### 7. Layering and visibility
- Two centers exist concurrently:
  - `.menu-node.level-0.parent` (parent layer): absolute translate; draws connector to selected child; may draw grandchild “nubs”. Does not render `.level-1` children.
  - `.menu-node.level-0.active` (active layer): absolute translate; renders `.level-1` children; may draw its own zero/short connector.
- Grandchild “nubs” appear under the appropriate parent layer children as `.menu-node.level-2.grandchild` elements.
- A visually hidden `<output aria-live="polite" aria-atomic="true">` mirrors the current center text.

### 8. Connectors (bars)
- Parent layer `.connector`:
  - Width = distance from parent center to selected child center
  - Rotation = `angle(parent→child) - 90deg`, using closest‑equivalent accumulation to avoid flips
- Active layer `.connector`:
  - Width = `--child-distance` or theme‑specific; rotation to hovered child

### 9. Center text
- `.center-text` is absolutely positioned at the center using `transform: translate(-50%, -50%)` inside the node’s local space.
- Parent layer shows parent item name; active layer shows hovered child (or active item) name.
- Measurement is deferred and cached; width constrained to `centerTextWrapWidth`.

### 10. Overlays
- Separators: global element with `translate(centerX, centerY) rotate(angle - 90deg)` per separator angle.
- Selection wedges: global element reading `--center-x`, `--center-y`, `--start-angle`, `--end-angle`.

### 11. Input and state mapping
- States map to classes exactly: `hovered`, `clicked`, `dragged`; chain push/pop toggles `parent`/`active`.
- Mouse buttons: left select, right cancel/back per config, X1 back; keyboard Esc cancel; Backspace/Delete back.

### 12. Theme CSS responsibilities
- Use the variables above to position nodes; never rely on extra wrappers or inline child transforms.
- Style layers via the layer classes and `data-content` attributes.
- Provide transitions (`--menu-transition`, `--opacity-transition`) and sizing variables.

Adhering to these rules guarantees full compatibility across bundled and community themes under `menu-themes/` (e.g., `default`, `clean-circle`, `neon-lights`, `rainbow-labels`, `nord`, etc.). Any deviation (extra wrappers, altered class names, missing variables, JS‑driven transforms for children) will break visual parity and must be avoided.

---

## Example Themes

Here’s a quick tour of the bundled themes under `static/kando/menu-themes/`. Each one showcases a facet of the Kando theme engine and is a great starting point for your own designs.

### Default
- Layers: `[ icon-layer(icon) ]`
- Options: `drawChildrenBelow: true`, `drawSelectionWedges: true`, `centerTextWrapWidth: 95`
- Colors: background/text/border/hover plus wedge colors
- Vibe: A clean baseline ring with separators and subtle wedge highlights. Perfect reference for minimal, readable setups.

### Clean Circle
- Layers: `[ arrow-layer(none), icon-layer(icon) ]`
- Options: `drawChildrenBelow: true`, `centerTextWrapWidth: 95`
- Colors: action/submenu icon colors, text/background
- Vibe: Sleek circles and a directional arrow layer. Great example of mixing a foreground icon with a slim guidance layer.

### Rainbow Labels
- Layers: `[ icon-layer(icon), label-layer(name) ]`
- Options: `drawChildrenBelow: false`, `drawCenterText: false`, `centerTextWrapWidth: 90`
- Colors: icon and label background
- Vibe: Joyful labels around the ring. Shows how name layers can take center stage without a center text.

### Neon Lights
- Layers: `[ icon-layer(icon), ring-fast-layer(none), ring-slow-layer(none), arrow-layer(none) ]`
- Options: `drawChildrenBelow: true`, `drawSelectionWedges: true`, `drawWedgeSeparators: true`, `centerTextWrapWidth: 95`
- Colors: glow/connector/separator/wedge tints
- Vibe: Pulsing neon energy with animated rings. A great stress test for multi-layer glow and motion aesthetics.

### neon-lights-color
- Layers: `[ inner-glow-ring(none), outer-glow-ring(none), icon-layer(icon), icon-glow-layer(icon), ring-fast-layer(none), ring-slow-layer(none), arrow-layer(none) ]`
- Options: `drawChildrenBelow: true`, generous `centerTextWrapWidth`
- Colors: comprehensive icon/text/ring/connector/interaction/background palette
- Vibe: A richly parameterized spin on Neon—colorful, configurable, and designed to glow beautifully.

### Navigation
- Layers: `[ icon-layer(icon) ]`
- Options: `drawChildrenBelow: true`, `centerTextWrapWidth: 140`, `maxMenuRadius: 180`
- Colors: text/icon/ring/sector/parent-indicator/background
- Vibe: Minimalist navigation ring with gentle ripples and natural sway. Crisp, modern, and focused.

### Minecraft
- Layers: `[ icon-layer(icon) ]`
- Options: `drawChildrenBelow: true`, `centerTextWrapWidth: 120`
- Colors: text
- Vibe: A simple, playful template—ideal to study the essentials without extra layers.

### KnightForge
- Layers: `[ label-layer(name) ]`
- Options: `drawChildrenBelow: true`, `drawSelectionWedges: true`, `centerTextWrapWidth: 120`
- Colors: text and wedge colors
- Vibe: High-contrast labels and wedge highlights—great for classic, text-forward designs.

### Hexperiment
- Layers: `[ glow-layer(none), icon-layer(icon) ]`
- Options: `drawChildrenBelow: false`, `centerTextWrapWidth: 90`
- Colors: dark background, bright text, pink glow/hover
- Vibe: Futuristic hex glow. Shows how a single glow layer can transform the entire look.

### Bent Photon Modified
- Layers: `[ label-layer(name), icon-layer(icon) ]`
- Options: `drawChildrenBelow: true`
- Colors: rich OKLCH palette for nuanced lights and canvas/dots
- Vibe: Elegant mixed label+icon theme with carefully tuned color science.

### Nord
- Layers: `[ icon-layer(icon), label-layer(name) ]`
- Options: `drawChildrenBelow: false`
- Colors: Nord-inspired cool palette: accents, connectors, borders, labels, text
- Vibe: Calm, legible nordic vibes with tasteful labels—professional and friendly.

### Nether Labels
- Layers: `[ icon-layer(icon), label-layer(name) ]`
- Options: `drawChildrenBelow: false`
- Colors: deep purples/blacks and matching accents, shrinked-outline, submenu hover
- Vibe: Moody and magical—great example of label-forward styling with bold accents.

Tips
- Start from Default or Minecraft to learn the variables and transforms.
- Add a `label-layer` when you want text-heavy menus; adjust `centerTextWrapWidth` accordingly.
- Use multiple `none` layers to build glows/rings without changing the icon layer.
- Keep transforms in CSS, feed variables from the DOM; it keeps themes portable and fast.

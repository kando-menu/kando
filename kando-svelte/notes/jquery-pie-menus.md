## jQuery Pie Menus — Clean Reference (from the MediaWiki page)

This document is a structured, markdown version of the historical jQuery Pie Menus write‑up. It captures the model, API, configuration formats, callbacks, and selection rules of that system. It intentionally differs from Kando, but we document it precisely so we can learn from its design (what to adopt, adapt, or avoid) and mine its ideas for Svelte/Kando integration.

Key links (source/history):
- Project: `https://github.com/SimHacker/jquery-pie`
- Clone: `git clone --recursive https://github.com/SimHacker/jquery-pie.git`

Notes:
- The original system de‑emphasizes “menus,” calling them “pies,” to encourage a gestural, direct‑manipulation framing (graph/map vs strict tree).
- The model introduces an explicit “slice” layer between pies and items to stabilize layout while freely adding/removing items.

---

## Model

### Target
- A DOM element enhanced by the jQuery pie component.
- Holds a set of named pies, each defined by a DOM node or by JavaScript data.
- Clicking the target activates a pie: either a default or one chosen dynamically by a handler.
- Multiple pies per target support context sensitivity and navigation (submenus and sibling interlinks).

### Pie
- A pie contains an ordered list of slices; each slice has a direction.
- Pies have a background and an overlay that may contain arbitrary HTML.
- Explicit slices provide a stable directional scaffold; items then populate slices without perturbing directions.
- Enforces good practice (e.g., 8 or 12 slices, even counts) without dummy items.
- Allows per‑slice layout and interaction policies (mix/match across a pie).

### Slice
- Slice is defined by a unique direction; slices need not be evenly spaced.
- Slices have background and overlay HTML layers.
- Selection rule: compute the dot product between cursor direction and slice direction; the closest wins.
- Edges are implicit mid‑angles between adjacent directions (no explicit subtend needed): every possible direction maps to exactly one slice; no gaps/overlaps.
- Cursor distance is available as a continuous parameter or for discrete item selection.
- Slices contain ordered items and support per‑slice layout/selection policies.
- Slices can emulate classic controls:
  - Linear slider (“slideout”)
  - Pull‑down (“pullout”)
  - Drop‑down (“dropout”)

### Item
- Items live inside slices; item position/selection is driven by the slice’s policy.
- Items provide an optional label plus background and overlay HTML.

Item layout/selection policies (examples):
- Equidistant: place compact icons at even distances along the slice vector; select nearest center.
- Justified: arrange text labels so they touch but don’t overlap; select by containment (or nearest if none contain the cursor).
- Pull‑out: show only the currently selected item centered at a fixed distance; switch by cursor distance.

---

## Defining and Editing

Multiple authoring channels are supported:

### API
- Programmatic definition in JavaScript (client/server).
- Supports embedded “onshow” handlers that build/modify pies/slices/items dynamically.
- Utility helpers and templates envisioned for common styles.

### JSON
- Pure data definitions suitable for static authoring or dynamic server‑side generation.
- Functions are not JSON, but you may reference handler names which resolve to functions.

### HTML DOM
- Pies, slices, items defined by nested DOM; backgrounds/overlays can include arbitrary HTML/CSS/JS.
- Good for designers comfortable in HTML.

### Tools
- UI builders: lists, property sheets, or direct manipulation (drag/drop) editors.
- Goal: empower both designers and end users (task‑specific pies).

---

## Notification and Tracking

Integration requires events and feedback during live tracking for previews, documentation, and emphasis of relevant choices. Three ways to attach handlers:

### HTML Attributes
Inline event attributes (traditional):

```html
<div onclick="handler(event)"></div>
```

### jQuery Handlers
Programmatic binding:

```js
$('#target').on('pieitemselect', function (e, pie, slice, item) {
  // ...
});
```

### JavaScript Data
Handlers embedded directly in pie definitions (as functions) or referenced by name:

```js
const pieDefinition = {
  slices: [ /* ... */ ],
  onpieitemselect: function (event, pie, slice, item) {
    // ...
  }
};
```

Event bubbling/capturing rules let you attach specific handlers at the item level or generalized handlers at the slice/pie/target levels.

---

## Customization

### CSS Classes and Styles
- Assign static or dynamic classes/styles to pies, slices, and items—during tracking as well.

### HTML Content
- Backgrounds and overlays may contain arbitrary HTML/CSS/JS: SVG, Canvas, WebGL, video, CSS 3D, filters, etc.

### Dynamic Feedback
- Rich, real‑time preview via callbacks and layered presentation.

### Rich Application Integration
- The host app may provide in‑world previews responding live to tracking.
- Pie selection is purely directional; once learned, users can “mouse ahead,” keeping attention on objects while menus provide peripheral/contextual feedback.

---

## Documentation (Behavioral Spec)

### Creating a Target

```js
const gTarget = $('#target').pie({
  // options
});
```

### Options Dictionary
- Configures the target and defines pies.
- Contains optional event handler functions.
- Pies/slices/items may inherit properties from options via delegation and events bubble up to the target.

Two main forms of pie definitions: dictionaries or DOM elements. Several ways to reference them (see below).

---

## DOM Pie Definitions

- Pies can be declared as DOM elements and referred to by jQuery selectors, provided via `options.defaultPie`, returned by `options.findPie`, or listed in `options.pies`.
- DOM attributes encode properties: `data-<scope>-<prop>="<value>"` (supports inheritance).
- Inline event attributes `on<event>="..."` are used (since events do not dispatch directly to definition nodes).

---

## Pie/Slice/Item Dictionaries

### Pie Dictionary
- Keys configure appearance/behavior.
- Usually contains `slices: []`.
- May define `onshowpie` to create/modify slices/items before show.
- A pie may have zero slices for continuous angle/distance tracking use‑cases.

### Slice Dictionary
- Keys configure appearance/behavior.
- Usually contains `items: []`.
- May define `onshowslice` to create/modify items before show.
- A slice may have zero items (continuous distance parameter).

### Item Dictionary
- Keys configure appearance/behavior.
- Usually contains `label` (optional if using icons/HTML instead).
- May define `onshowitem` for dynamic label/content.

---

## Deciding Which Pie to Pop Up (Resolution Algorithm)

1) `options.defaultPie`
   - When the user clicks the target, `findDefaultPie(event)` reads `options.defaultPie`.
   - It may be: a pie dictionary, a `pieRef` string, or `null` (no pie).

2) `pieRef` string
   - A reference to a pie definition. Possible forms:
     - Key into `options.pies`
     - jQuery selector string
     - Any identifier interpretable by `options.findPie`

3) `options.findPie(event, pieRef)` (optional)
   - First stage resolver; enables context sensitivity (location, state machine for submenus/sibmenus).
   - Return `null` → no pie; a dictionary → use it; a string → further resolve; absent → skip.

4) `options.pies`
   - If still a string, look it up in `options.pies`.
   - Value may be a dictionary or a jQuery selector string pointing to a single DOM element.

5) jQuery selector to DOM
   - If still unresolved, treat as a jQuery selector; call `makePieFromDOM(selector)`.
   - On success, cache the resulting dictionary in `options.pies` and use it; else no pie.

---

## Callback Surface (summary)

Event names typically bubbled to target (illustrative; actual names in the original code):
- `onshowpie(event, pie)`
- `onshowslice(event, pie, slice)`
- `onshowitem(event, pie, slice, item)`
- `onpieitemhover(event, pie, slice, item, trackingState)`
- `onpieitemselect(event, pie, slice, item)`
- `onpiecancel(event, pie)`

The Svelte/Kando port can map these to component events and/or Svelte 5 snippets to allow parameterized layers and dynamic feedback.

---

## Porting Notes (to Svelte/Kando)

- Keep the explicit slice layer to stabilize directions while editing.
- Support multiple item policies per slice (equidistant/justified/pull‑out) via themeable CSS variables and per‑slice props.
- Provide a rich callback/event surface equivalent to the jQuery version and connect it to Svelte runes/snippets for dynamic content, previews, and instrumentation.
- Align selection math (angle → slice by nearest direction; edges as mid‑angles) to avoid gaps/overlaps and to guarantee a unique match.
- Encourage app‑level integration for real‑time in‑world previews during tracking.



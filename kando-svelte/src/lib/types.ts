export type { Vec2, ShowMenuOptions, MenuThemeDescription } from '@kando/common';
export type { MenuItemV1 as MenuItem, MenuV1, MenuCollectionV1 } from '@kando/common';

// Svelte-side trigger types (browser polyfill variant)
export type MouseButton = 'left' | 'middle' | 'right' | 'x1' | 'x2';
export type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta';

export type MouseTrigger = {
  kind: 'mouse';
  button: MouseButton;
  mods?: ModifierKey[];
};

export type Trigger = MouseTrigger; // Extend with gamepad/keyboard variants as needed

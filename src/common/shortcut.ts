//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

const MAC_MODIFIER_SYMBOLS = new Map([
  ['Command', '⌘'],
  ['Cmd', '⌘'],
  ['CommandOrControl', '⌘'],
  ['CmdOrCtrl', '⌘'],
  ['Meta', '⌘'],
  ['Option', '⌥'],
  ['Alt', '⌥'],
  ['Control', '⌃'],
  ['Ctrl', '⌃'],
  ['Shift', '⇧'],
]);

export type ModifierSide = 'left' | 'right' | 'any';

/** Maximum delay between two modifier presses which should count as a double press. */
export const DOUBLE_MODIFIER_SHORTCUT_INTERVAL_MS = 300;

const SIDE_AWARE_MODIFIERS = new Set([
  'Command',
  'Cmd',
  'Control',
  'Ctrl',
  'CommandOrControl',
  'CmdOrCtrl',
  'Alt',
  'Option',
  'AltGr',
  'Shift',
  'Super',
  'Meta',
]);

/** Returns whether a shortcut part is a modifier with an optional side suffix. */
export function isShortcutModifier(modifier: string): boolean {
  return SIDE_AWARE_MODIFIERS.has(splitModifierSide(modifier).base);
}

/**
 * Returns the number of presses represented by a modifier-only shortcut. A modifier may
 * occur once for a regular press or twice for a double press. All other shortcuts return
 * zero.
 */
export function getModifierShortcutTapCount(shortcut: string): 0 | 1 | 2 {
  const parts = shortcut.split('+');

  if (
    (parts.length === 1 || parts.length === 2) &&
    parts[0].length > 0 &&
    parts.every((part) => part === parts[0] && isShortcutModifier(part))
  ) {
    return parts.length;
  }

  return 0;
}

/** Returns whether a shortcut consists only of one repeated modifier key. */
export function isModifierOnlyShortcut(shortcut: string): boolean {
  return getModifierShortcutTapCount(shortcut) > 0;
}

/**
 * Splits the optional side suffix from a modifier name.
 *
 * @param modifier A modifier such as `Shift`, `ShiftLeft`, or `ShiftRight`.
 * @returns The modifier's base name and selected side.
 */
export function splitModifierSide(modifier: string): {
  base: string;
  side: ModifierSide;
} {
  if (modifier.endsWith('Left')) {
    return { base: modifier.slice(0, -4), side: 'left' };
  }

  if (modifier.endsWith('Right')) {
    return { base: modifier.slice(0, -5), side: 'right' };
  }

  return { base: modifier, side: 'any' };
}

/**
 * Cycles a modifier from either side to left, right, and back to either side.
 *
 * @param modifier The modifier to update.
 * @returns The modifier with the next side selection.
 */
export function cycleModifierSide(modifier: string): string {
  const { base, side } = splitModifierSide(modifier);

  if (side === 'any') {
    return `${base}Left`;
  }

  if (side === 'left') {
    return `${base}Right`;
  }

  return base;
}

/**
 * Gets all modifiers in a shortcut which require a specific physical side.
 *
 * @param shortcut The shortcut to inspect.
 * @returns All side-specific modifier names in the shortcut.
 */
export function getSideSpecificModifiers(shortcut: string): string[] {
  return shortcut.split('+').filter((part) => {
    const { side } = splitModifierSide(part);
    return side !== 'any' && isShortcutModifier(part);
  });
}

/**
 * Converts a side-specific shortcut to an Electron-compatible accelerator. Side selection
 * is checked separately when the accelerator callback runs.
 *
 * @param shortcut The shortcut to convert.
 * @returns The same shortcut without modifier side suffixes.
 */
export function stripShortcutModifierSides(shortcut: string): string {
  return shortcut
    .split('+')
    .map((part) => {
      const { base, side } = splitModifierSide(part);
      return side !== 'any' && SIDE_AWARE_MODIFIERS.has(base) ? base : part;
    })
    .join('+');
}

/**
 * Formats a shortcut for display without changing the accelerator used for binding it.
 *
 * @param shortcut The accelerator string to format.
 * @param useMacSymbols Whether macOS keyboard symbols should be used.
 * @returns The formatted shortcut.
 */
export function formatShortcutForDisplay(
  shortcut: string,
  useMacSymbols: boolean
): string {
  if (!useMacSymbols) {
    return shortcut;
  }

  return shortcut
    .split('+')
    .map((part) => {
      const { base, side } = splitModifierSide(part);
      const symbol = MAC_MODIFIER_SYMBOLS.get(base);

      if (!symbol) {
        return part;
      }

      const sidePrefix = side === 'left' ? 'L' : side === 'right' ? 'R' : '';
      return `${sidePrefix}${symbol}`;
    })
    .join('');
}

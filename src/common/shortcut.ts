//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * Shortcuts which start with this prefix are not keyboard accelerators but "mouse-hold
 * triggers": The menu opens when the respective mouse button is held down for a short
 * time and the selection is made when the button is released. Currently, the following
 * triggers exist: 'MouseRight', 'MouseMiddle', 'MouseX1', and 'MouseX2'.
 */
export const MOUSE_TRIGGER_PREFIX = 'Mouse';

/** The mouse buttons which can be used as a mouse-hold trigger. */
export const MOUSE_TRIGGER_BUTTONS = ['Right', 'Middle', 'X1', 'X2'] as const;

export type MouseTriggerButton = (typeof MOUSE_TRIGGER_BUTTONS)[number];

/**
 * Checks whether the given shortcut string describes a mouse-hold trigger instead of a
 * keyboard accelerator.
 *
 * @param shortcut The shortcut string to check.
 * @returns True if the shortcut is a mouse-hold trigger like 'MouseRight'.
 */
export function isMouseTrigger(shortcut: string): boolean {
  return getMouseTriggerButton(shortcut) !== null;
}

/**
 * Extracts the mouse button from a mouse-hold trigger string.
 *
 * @param shortcut The shortcut string, e.g. 'MouseRight'.
 * @returns The button name, or null if the string is not a mouse-hold trigger.
 */
export function getMouseTriggerButton(shortcut: string): MouseTriggerButton | null {
  if (!shortcut.startsWith(MOUSE_TRIGGER_PREFIX)) {
    return null;
  }

  const button = shortcut.slice(MOUSE_TRIGGER_PREFIX.length);
  return (MOUSE_TRIGGER_BUTTONS as readonly string[]).includes(button)
    ? (button as MouseTriggerButton)
    : null;
}

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
    .map((part) => MAC_MODIFIER_SYMBOLS.get(part) || part)
    .join('');
}

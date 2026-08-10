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

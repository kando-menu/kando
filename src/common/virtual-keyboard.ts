// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { isShortcutModifier, splitModifierSide } from './shortcut';

/**
 * A virtual key has an explicit key name and physical code; never infer one from the
 * other.
 */
export type VirtualKey = { name: string; code: string; label?: string };

const key = (name: string, code = name, label?: string): VirtualKey => ({
  name,
  code,
  label,
});

export const COMMON_KEY_ROWS: VirtualKey[][] = [
  [
    key('Escape'),
    ...'1234567890'.split('').map((n) => key(n, `Digit${n}`)),
    key('Backspace'),
  ],
  [key('Tab'), ...'QWERTYUIOP'.split('').map((n) => key(n, `Key${n}`))],
  [...'ASDFGHJKL'.split('').map((n) => key(n, `Key${n}`)), key('Enter')],
  [
    ...'ZXCVBNM'.split('').map((n) => key(n, `Key${n}`)),
    key(',', 'Comma'),
    key('.', 'Period'),
    key('/', 'Slash'),
  ],
  [
    key('`', 'Backquote'),
    key('-', 'Minus'),
    key('=', 'Equal'),
    key('[', 'BracketLeft'),
    key(']', 'BracketRight'),
    key('\\', 'Backslash'),
    key(';', 'Semicolon'),
    key("'", 'Quote'),
  ],
  [
    key('Capslock', 'CapsLock', 'Caps Lock'),
    key('Space'),
    key('Left', 'ArrowLeft', '←'),
    key('Up', 'ArrowUp', '↑'),
    key('Down', 'ArrowDown', '↓'),
    key('Right', 'ArrowRight', '→'),
  ],
];

export const FUNCTION_KEYS = Array.from({ length: 24 }, (_, i) => key(`F${i + 1}`));
export const NAVIGATION_KEYS = [
  key('Insert'),
  key('Home'),
  key('PageUp', 'PageUp', 'Page Up'),
  key('Delete'),
  key('End'),
  key('PageDown', 'PageDown', 'Page Down'),
];
export const NUMPAD_KEYS = [
  key('Numlock', 'NumLock', 'Num Lock'),
  key('numdiv', 'NumpadDivide', '/'),
  key('nummult', 'NumpadMultiply', '*'),
  key('numsub', 'NumpadSubtract', '-'),
  ...[7, 8, 9].map((n) => key(`num${n}`, `Numpad${n}`, `${n}`)),
  key('numadd', 'NumpadAdd', '+'),
  ...[4, 5, 6, 1, 2, 3].map((n) => key(`num${n}`, `Numpad${n}`, `${n}`)),
  key('Enter', 'NumpadEnter', 'Enter'),
  key('num0', 'Numpad0', '0'),
  key('numdec', 'NumpadDecimal', '.'),
];

/** Toggle a modifier family or replace the ordinary key, retaining modifier sides. */
export function toggleVirtualKey(
  shortcut: string,
  value: string,
  useModifiers: boolean
): string {
  const parts = shortcut.split('+').filter(Boolean);
  const base = splitModifierSide(value).base;
  if (isShortcutModifier(value)) {
    if (parts.some((part) => splitModifierSide(part).base === base)) {
      return parts.filter((part) => splitModifierSide(part).base !== base).join('+');
    }
    if (!useModifiers) {
      return value;
    }
    const modifiers = [...new Set(parts.filter(isShortcutModifier))];
    return [
      ...modifiers,
      value,
      ...parts.filter((part) => !isShortcutModifier(part)),
    ].join('+');
  }
  const modifiers = useModifiers ? [...new Set(parts.filter(isShortcutModifier))] : [];
  return [...modifiers, ...(parts.includes(value) ? [] : [value])].join('+');
}

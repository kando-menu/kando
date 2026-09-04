//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |__| | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { isShortcutModifier, splitModifierSide } from '../../common';
import { mapKeys } from '../../common/key-codes';

export const NATIVE_MODIFIER_CONTROL = 1 << 0;
export const NATIVE_MODIFIER_SHIFT = 1 << 1;
export const NATIVE_MODIFIER_ALT = 1 << 2;
export const NATIVE_MODIFIER_META = 1 << 3;

/** A shortcut which can be matched synchronously by a native keyboard hook. */
export type NativeShortcutBinding = {
  readonly shortcut: string;
  readonly keyCode: number;
  readonly modifierMask: number;
  readonly sideModifiers: number[];
};

const KEY_NAMES_TO_CODES = new Map([
  ['Space', 'Space'],
  ['Tab', 'Tab'],
  ['Capslock', 'CapsLock'],
  ['Numlock', 'NumLock'],
  ['Scrolllock', 'ScrollLock'],
  ['Backspace', 'Backspace'],
  ['Delete', 'Delete'],
  ['Insert', 'Insert'],
  ['Return', 'Enter'],
  ['Enter', 'Enter'],
  ['Up', 'ArrowUp'],
  ['Down', 'ArrowDown'],
  ['Left', 'ArrowLeft'],
  ['Right', 'ArrowRight'],
  ['Home', 'Home'],
  ['End', 'End'],
  ['PageUp', 'PageUp'],
  ['PageDown', 'PageDown'],
  ['Escape', 'Escape'],
  ['Esc', 'Escape'],
  ['VolumeUp', 'AudioVolumeUp'],
  ['VolumeDown', 'AudioVolumeDown'],
  ['VolumeMute', 'AudioVolumeMute'],
  ['MediaNextTrack', 'MediaTrackNext'],
  ['MediaPreviousTrack', 'MediaTrackPrevious'],
  ['MediaStop', 'MediaStop'],
  ['MediaPlayPause', 'MediaPlayPause'],
  ['PrintScreen', 'PrintScreen'],
]);

// Key-name shortcuts store printable characters, while the native APIs use physical key
// codes. Shifted and unshifted characters therefore map to the same physical key.
const CHARACTER_KEYS_TO_CODES = new Map([
  ['`', 'Backquote'],
  ['~', 'Backquote'],
  ['-', 'Minus'],
  ['_', 'Minus'],
  ['=', 'Equal'],
  ['[', 'BracketLeft'],
  ['{', 'BracketLeft'],
  [']', 'BracketRight'],
  ['}', 'BracketRight'],
  ['\\', 'Backslash'],
  ['|', 'Backslash'],
  [';', 'Semicolon'],
  [':', 'Semicolon'],
  ["'", 'Quote'],
  ['"', 'Quote'],
  [',', 'Comma'],
  ['<', 'Comma'],
  ['.', 'Period'],
  ['>', 'Period'],
  ['/', 'Slash'],
  ['?', 'Slash'],
  ['!', 'Digit1'],
  ['@', 'Digit2'],
  ['#', 'Digit3'],
  ['$', 'Digit4'],
  ['%', 'Digit5'],
  ['^', 'Digit6'],
  ['&', 'Digit7'],
  ['*', 'Digit8'],
  ['(', 'Digit9'],
  [')', 'Digit0'],
]);

/** Converts an Electron accelerator key name to a DOM code used by mapKeys(). */
function acceleratorKeyToCode(key: string): string | undefined {
  if (/^[A-Z]$/i.test(key)) {
    return `Key${key.toUpperCase()}`;
  }
  if (/^[0-9]$/.test(key)) {
    return `Digit${key}`;
  }
  if (/^F(?:[1-9]|1[0-9]|2[0-4])$/i.test(key)) {
    return key.toUpperCase();
  }
  if (/^num[0-9]$/i.test(key)) {
    return `Numpad${key.slice(3)}`;
  }

  const numpadCodes = new Map([
    ['numdec', 'NumpadDecimal'],
    ['numadd', 'NumpadAdd'],
    ['numsub', 'NumpadSubtract'],
    ['nummult', 'NumpadMultiply'],
    ['numdiv', 'NumpadDivide'],
  ]);

  return (
    KEY_NAMES_TO_CODES.get(key) ||
    CHARACTER_KEYS_TO_CODES.get(key) ||
    numpadCodes.get(key.toLowerCase())
  );
}

/** Creates a native binding for an accelerator which Electron could not register. */
export function createNativeShortcutBinding(
  shortcut: string,
  os: 'macos' | 'windows'
): NativeShortcutBinding | undefined {
  let keyCodeName: string | undefined;
  let modifierMask = 0;
  const sideModifierNames: string[] = [];

  for (const part of shortcut.split('+')) {
    if (!isShortcutModifier(part)) {
      if (keyCodeName) {
        return undefined;
      }
      const code = acceleratorKeyToCode(part);
      if (!code) {
        return undefined;
      }
      keyCodeName = code;
      continue;
    }

    const { base, side } = splitModifierSide(part);
    let codeBase: string;

    if (['Control', 'Ctrl'].includes(base)) {
      modifierMask |= NATIVE_MODIFIER_CONTROL;
      codeBase = 'Control';
    } else if (base === 'Shift') {
      modifierMask |= NATIVE_MODIFIER_SHIFT;
      codeBase = 'Shift';
    } else if (['Alt', 'Option', 'AltGr'].includes(base)) {
      modifierMask |= NATIVE_MODIFIER_ALT;
      codeBase = 'Alt';
    } else if (['CommandOrControl', 'CmdOrCtrl'].includes(base)) {
      modifierMask |= os === 'macos' ? NATIVE_MODIFIER_META : NATIVE_MODIFIER_CONTROL;
      codeBase = os === 'macos' ? 'Meta' : 'Control';
    } else {
      modifierMask |= NATIVE_MODIFIER_META;
      codeBase = 'Meta';
    }

    if (side !== 'any') {
      sideModifierNames.push(`${codeBase}${side === 'left' ? 'Left' : 'Right'}`);
    }
  }

  if (!keyCodeName) {
    return undefined;
  }

  try {
    return {
      shortcut,
      keyCode: mapKeys([{ name: keyCodeName, down: true, delay: 0 }], os)[0],
      modifierMask,
      sideModifiers: mapKeys(
        sideModifierNames.map((name) => ({ name, down: true, delay: 0 })),
        os
      ),
    };
  } catch {
    return undefined;
  }
}

/** Returns physical Windows-key scan codes claimed by standalone Meta shortcuts. */
export function getWindowsMetaShortcutKeyCodes(shortcuts: string[]): number[] {
  const codes = new Set<number>();

  for (const shortcut of shortcuts) {
    const modifier = shortcut.split('+')[0];
    const { base, side } = splitModifierSide(modifier);
    if (!['Command', 'Cmd', 'Meta', 'Super'].includes(base)) {
      continue;
    }

    const names =
      side === 'any'
        ? ['MetaLeft', 'MetaRight']
        : [`Meta${side === 'left' ? 'Left' : 'Right'}`];
    for (const code of mapKeys(
      names.map((name) => ({ name, down: true, delay: 0 })),
      'windows'
    )) {
      codes.add(code);
    }
  }

  return Array.from(codes);
}

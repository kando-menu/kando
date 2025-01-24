//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

import { IKeySequence } from '.';

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * This function maps a sequence of key names to platform specific key codes.
 *
 * @param keys The sequence of keys to map.
 * @param os The operating system to map for.
 * @returns The sequence of key codes.
 * @throws If an unknown key is encountered.
 */
export function mapKeys(keys: IKeySequence, os: 'windows' | 'macos' | 'linux'): number[] {
  return keys.map((key) => {
    const code = KEY_CODES.get(key.name.toLowerCase())?.[os];

    if (code === undefined || code === null) {
      throw new Error(`Unknown key: ${key.name}`);
    }

    return code;
  });
}

/**
 * This function fixes a key code case. If the key code is not known, it is returned as
 * is.
 *
 * @param code The key code to fix.
 * @returns The fixed key code.
 */
export function fixKeyCodeCase(code: string): string {
  return PROPER_KEY_CASE.get(code.toLowerCase()) ?? code;
}

/**
 * This function returns true if the key code is known.
 *
 * @param code The key code to check.
 * @returns True if the key code is known.
 */
export function isKnownKeyCode(code: string) {
  return PROPER_KEY_CASE.has(code.toLowerCase());
}

/**
 * This is used in the map below to map from DOM key codes (which are strings) to platform
 * specific key code numbers.
 */
interface IKeyMapping {
  windows: number | null;
  macos: number | null;
  linux: number | null;
}

/**
 * This map contains the proper key case for all key names which are used in the key codes
 * map below. Internally, we use the key names in lower case to make the user input case
 * insensitive. However, we usually want to display the key names in a user-friendly way.
 * This map is used to convert the key names to proper case.
 */
const PROPER_KEY_CASE: Map<string, string> = new Map([
  ['again', 'Again'],
  ['altleft', 'AltLeft'],
  ['altright', 'AltRight'],
  ['arrowdown', 'ArrowDown'],
  ['arrowleft', 'ArrowLeft'],
  ['arrowright', 'ArrowRight'],
  ['arrowup', 'ArrowUp'],
  ['audiovolumedown', 'AudioVolumeDown'],
  ['audiovolumemute', 'AudioVolumeMute'],
  ['audiovolumeup', 'AudioVolumeUp'],
  ['backquote', 'Backquote'],
  ['backslash', 'Backslash'],
  ['backspace', 'Backspace'],
  ['bracketleft', 'BracketLeft'],
  ['bracketright', 'BracketRight'],
  ['browserback', 'BrowserBack'],
  ['browserfavorites', 'BrowserFavorites'],
  ['browserforward', 'BrowserForward'],
  ['browserhome', 'BrowserHome'],
  ['browserrefresh', 'BrowserRefresh'],
  ['browsersearch', 'BrowserSearch'],
  ['browserstop', 'BrowserStop'],
  ['capslock', 'CapsLock'],
  ['comma', 'Comma'],
  ['contextmenu', 'ContextMenu'],
  ['controlleft', 'ControlLeft'],
  ['controlright', 'ControlRight'],
  ['convert', 'Convert'],
  ['copy', 'Copy'],
  ['cut', 'Cut'],
  ['delete', 'Delete'],
  ['digit0', 'Digit0'],
  ['digit1', 'Digit1'],
  ['digit2', 'Digit2'],
  ['digit3', 'Digit3'],
  ['digit4', 'Digit4'],
  ['digit5', 'Digit5'],
  ['digit6', 'Digit6'],
  ['digit7', 'Digit7'],
  ['digit8', 'Digit8'],
  ['digit9', 'Digit9'],
  ['eject', 'Eject'],
  ['end', 'End'],
  ['enter', 'Enter'],
  ['equal', 'Equal'],
  ['escape', 'Escape'],
  ['f1', 'F1'],
  ['f10', 'F10'],
  ['f11', 'F11'],
  ['f12', 'F12'],
  ['f13', 'F13'],
  ['f14', 'F14'],
  ['f15', 'F15'],
  ['f16', 'F16'],
  ['f17', 'F17'],
  ['f18', 'F18'],
  ['f19', 'F19'],
  ['f2', 'F2'],
  ['f20', 'F20'],
  ['f21', 'F21'],
  ['f22', 'F22'],
  ['f23', 'F23'],
  ['f24', 'F24'],
  ['f3', 'F3'],
  ['f4', 'F4'],
  ['f5', 'F5'],
  ['f6', 'F6'],
  ['f7', 'F7'],
  ['f8', 'F8'],
  ['f9', 'F9'],
  ['find', 'Find'],
  ['help', 'Help'],
  ['home', 'Home'],
  ['insert', 'Insert'],
  ['intlbackslash', 'IntlBackslash'],
  ['intlro', 'IntlRo'],
  ['intlyen', 'IntlYen'],
  ['kanamode', 'KanaMode'],
  ['keya', 'KeyA'],
  ['keyb', 'KeyB'],
  ['keyc', 'KeyC'],
  ['keyd', 'KeyD'],
  ['keye', 'KeyE'],
  ['keyf', 'KeyF'],
  ['keyg', 'KeyG'],
  ['keyh', 'KeyH'],
  ['keyi', 'KeyI'],
  ['keyj', 'KeyJ'],
  ['keyk', 'KeyK'],
  ['keyl', 'KeyL'],
  ['keym', 'KeyM'],
  ['keyn', 'KeyN'],
  ['keyo', 'KeyO'],
  ['keyp', 'KeyP'],
  ['keyq', 'KeyQ'],
  ['keyr', 'KeyR'],
  ['keys', 'KeyS'],
  ['keyt', 'KeyT'],
  ['keyu', 'KeyU'],
  ['keyv', 'KeyV'],
  ['keyw', 'KeyW'],
  ['keyx', 'KeyX'],
  ['keyy', 'KeyY'],
  ['keyz', 'KeyZ'],
  ['lang1', 'Lang1'],
  ['lang2', 'Lang2'],
  ['lang3', 'Lang3'],
  ['lang4', 'Lang4'],
  ['lang5', 'Lang5'],
  ['launchapp1', 'LaunchApp1'],
  ['launchapp2', 'LaunchApp2'],
  ['launchmail', 'LaunchMail'],
  ['mediaplaypause', 'MediaPlayPause'],
  ['mediaselect', 'MediaSelect'],
  ['mediastop', 'MediaStop'],
  ['mediatracknext', 'MediaTrackNext'],
  ['mediatrackprevious', 'MediaTrackPrevious'],
  ['metaleft', 'MetaLeft'],
  ['metaright', 'MetaRight'],
  ['minus', 'Minus'],
  ['nonconvert', 'NonConvert'],
  ['numlock', 'NumLock'],
  ['numpad0', 'Numpad0'],
  ['numpad1', 'Numpad1'],
  ['numpad2', 'Numpad2'],
  ['numpad3', 'Numpad3'],
  ['numpad4', 'Numpad4'],
  ['numpad5', 'Numpad5'],
  ['numpad6', 'Numpad6'],
  ['numpad7', 'Numpad7'],
  ['numpad8', 'Numpad8'],
  ['numpad9', 'Numpad9'],
  ['numpadadd', 'NumpadAdd'],
  ['numpadcomma', 'NumpadComma'],
  ['numpaddecimal', 'NumpadDecimal'],
  ['numpaddivide', 'NumpadDivide'],
  ['numpadenter', 'NumpadEnter'],
  ['numpadequal', 'NumpadEqual'],
  ['numpadmultiply', 'NumpadMultiply'],
  ['numpadparenleft', 'NumpadParenLeft'],
  ['numpadparenright', 'NumpadParenRight'],
  ['numpadsubtract', 'NumpadSubtract'],
  ['open', 'Open'],
  ['pagedown', 'PageDown'],
  ['pageup', 'PageUp'],
  ['paste', 'Paste'],
  ['pause', 'Pause'],
  ['period', 'Period'],
  ['power', 'Power'],
  ['printscreen', 'PrintScreen'],
  ['quote', 'Quote'],
  ['scrolllock', 'ScrollLock'],
  ['select', 'Select'],
  ['semicolon', 'Semicolon'],
  ['shiftleft', 'ShiftLeft'],
  ['shiftright', 'ShiftRight'],
  ['slash', 'Slash'],
  ['sleep', 'Sleep'],
  ['space', 'Space'],
  ['tab', 'Tab'],
  ['undo', 'Undo'],
  ['wakeup', 'WakeUp'],
]);

// The values in this map are derived from the tables on this page:
// https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
const KEY_CODES: Map<string, IKeyMapping> = new Map([
  [
    'again',
    {
      windows: null,
      macos: null,
      linux: 0x0089,
    },
  ],
  [
    'altleft',
    {
      windows: 0x0038,
      macos: 0x3a,
      linux: 0x0040,
    },
  ],
  [
    'altright',
    {
      windows: 0xe038,
      macos: 0x3d,
      linux: 0x006c,
    },
  ],
  [
    'arrowdown',
    {
      windows: 0xe050,
      macos: 0x7d,
      linux: 0x0074,
    },
  ],
  [
    'arrowleft',
    {
      windows: 0xe04b,
      macos: 0x7b,
      linux: 0x0071,
    },
  ],
  [
    'arrowright',
    {
      windows: 0xe04d,
      macos: 0x7c,
      linux: 0x0072,
    },
  ],
  [
    'arrowup',
    {
      windows: 0xe048,
      macos: 0x7e,
      linux: 0x006f,
    },
  ],
  [
    'audiovolumedown',
    {
      windows: 0xe02e,
      macos: 0x49,
      linux: 0x007a,
    },
  ],
  [
    'audiovolumemute',
    {
      windows: 0xe020,
      macos: 0x4a,
      linux: 0x0079,
    },
  ],
  [
    'audiovolumeup',
    {
      windows: 0xe030,
      macos: 0x48,
      linux: 0x007b,
    },
  ],
  [
    'backquote',
    {
      windows: 0x0029,
      macos: 0x32,
      linux: 0x0031,
    },
  ],
  [
    'backslash',
    {
      windows: 0x002b,
      macos: 0x2a,
      linux: 0x0033,
    },
  ],
  [
    'backspace',
    {
      windows: 0x000e,
      macos: 0x33,
      linux: 0x0016,
    },
  ],
  [
    'bracketleft',
    {
      windows: 0x001a,
      macos: 0x21,
      linux: 0x0022,
    },
  ],
  [
    'bracketright',
    {
      windows: 0x001b,
      macos: 0x1e,
      linux: 0x0023,
    },
  ],
  [
    'browserback',
    {
      windows: 0xe06a,
      macos: null,
      linux: 0x00a6,
    },
  ],
  [
    'browserfavorites',
    {
      windows: 0xe066,
      macos: null,
      linux: 0x00a4,
    },
  ],
  [
    'browserforward',
    {
      windows: 0xe069,
      macos: null,
      linux: 0x00a7,
    },
  ],
  [
    'browserhome',
    {
      windows: 0xe032,
      macos: null,
      linux: 0x00b4,
    },
  ],
  [
    'browserrefresh',
    {
      windows: 0xe067,
      macos: null,
      linux: 0x00b5,
    },
  ],
  [
    'browsersearch',
    {
      windows: 0xe065,
      macos: null,
      linux: 0x00e1,
    },
  ],
  [
    'browserstop',
    {
      windows: 0xe068,
      macos: null,
      linux: 0x0088,
    },
  ],
  [
    'capslock',
    {
      windows: 0x003a,
      macos: 0x39,
      linux: 0x0042,
    },
  ],
  [
    'comma',
    {
      windows: 0x0033,
      macos: 0x2b,
      linux: 0x003b,
    },
  ],
  [
    'contextmenu',
    {
      windows: 0xe05d,
      macos: 0x6e,
      linux: 0x0087,
    },
  ],
  [
    'controlleft',
    {
      windows: 0x001d,
      macos: 0x3b,
      linux: 0x0025,
    },
  ],
  [
    'controlright',
    {
      windows: 0xe01d,
      macos: 0x3e,
      linux: 0x0069,
    },
  ],
  [
    'convert',
    {
      windows: 0x0079,
      macos: null,
      linux: 0x0064,
    },
  ],
  [
    'copy',
    {
      windows: 0xe018,
      macos: null,
      linux: 0x008d,
    },
  ],
  [
    'cut',
    {
      windows: 0xe017,
      macos: null,
      linux: 0x0091,
    },
  ],
  [
    'delete',
    {
      windows: 0xe053,
      macos: 0x75,
      linux: 0x0077,
    },
  ],
  [
    'digit0',
    {
      windows: 0x000b,
      macos: 0x1d,
      linux: 0x0013,
    },
  ],
  [
    'digit1',
    {
      windows: 0x0002,
      macos: 0x12,
      linux: 0x000a,
    },
  ],
  [
    'digit2',
    {
      windows: 0x0003,
      macos: 0x13,
      linux: 0x000b,
    },
  ],
  [
    'digit3',
    {
      windows: 0x0004,
      macos: 0x14,
      linux: 0x000c,
    },
  ],
  [
    'digit4',
    {
      windows: 0x0005,
      macos: 0x15,
      linux: 0x000d,
    },
  ],
  [
    'digit5',
    {
      windows: 0x0006,
      macos: 0x17,
      linux: 0x000e,
    },
  ],
  [
    'digit6',
    {
      windows: 0x0007,
      macos: 0x16,
      linux: 0x000f,
    },
  ],
  [
    'digit7',
    {
      windows: 0x0008,
      macos: 0x1a,
      linux: 0x0010,
    },
  ],
  [
    'digit8',
    {
      windows: 0x0009,
      macos: 0x1c,
      linux: 0x0011,
    },
  ],
  [
    'digit9',
    {
      windows: 0x000a,
      macos: 0x19,
      linux: 0x0012,
    },
  ],
  [
    'eject',
    {
      windows: 0xe02c,
      macos: null,
      linux: 0x00a9,
    },
  ],
  [
    'end',
    {
      windows: 0xe04f,
      macos: 0x77,
      linux: 0x0073,
    },
  ],
  [
    'enter',
    {
      windows: 0x001c,
      macos: 0x24,
      linux: 0x0024,
    },
  ],
  [
    'equal',
    {
      windows: 0x000d,
      macos: 0x18,
      linux: 0x0015,
    },
  ],
  [
    'escape',
    {
      windows: 0x0001,
      macos: 0x35,
      linux: 0x0009,
    },
  ],
  [
    'f1',
    {
      windows: 0x003b,
      macos: 0x7a,
      linux: 0x0043,
    },
  ],
  [
    'f10',
    {
      windows: 0x0044,
      macos: 0x6d,
      linux: 0x004c,
    },
  ],
  [
    'f11',
    {
      windows: 0x0057,
      macos: 0x67,
      linux: 0x005f,
    },
  ],
  [
    'f12',
    {
      windows: 0x0058,
      macos: 0x6f,
      linux: 0x0060,
    },
  ],
  [
    'f13',
    {
      windows: 0x0064,
      macos: 0x69,
      linux: 0x00bf,
    },
  ],
  [
    'f14',
    {
      windows: 0x0065,
      macos: 0x6b,
      linux: 0x00c0,
    },
  ],
  [
    'f15',
    {
      windows: 0x0066,
      macos: 0x71,
      linux: 0x00c1,
    },
  ],
  [
    'f16',
    {
      windows: 0x0067,
      macos: 0x6a,
      linux: 0x00c2,
    },
  ],
  [
    'f17',
    {
      windows: 0x0068,
      macos: 0x40,
      linux: 0x00c3,
    },
  ],
  [
    'f18',
    {
      windows: 0x0069,
      macos: 0x4f,
      linux: 0x00c4,
    },
  ],
  [
    'f19',
    {
      windows: 0x006a,
      macos: 0x50,
      linux: 0x00c5,
    },
  ],
  [
    'f2',
    {
      windows: 0x003c,
      macos: 0x78,
      linux: 0x0044,
    },
  ],
  [
    'f20',
    {
      windows: 0x006b,
      macos: 0x5a,
      linux: 0x00c6,
    },
  ],
  [
    'f21',
    {
      windows: 0x006c,
      macos: null,
      linux: 0x00c7,
    },
  ],
  [
    'f22',
    {
      windows: 0x006d,
      macos: null,
      linux: 0x00c8,
    },
  ],
  [
    'f23',
    {
      windows: 0x006e,
      macos: null,
      linux: 0x00c9,
    },
  ],
  [
    'f24',
    {
      windows: 0x0076,
      macos: null,
      linux: 0x00ca,
    },
  ],
  [
    'f3',
    {
      windows: 0x003d,
      macos: 0x63,
      linux: 0x0045,
    },
  ],
  [
    'f4',
    {
      windows: 0x003e,
      macos: 0x76,
      linux: 0x0046,
    },
  ],
  [
    'f5',
    {
      windows: 0x003f,
      macos: 0x60,
      linux: 0x0047,
    },
  ],
  [
    'f6',
    {
      windows: 0x0040,
      macos: 0x61,
      linux: 0x0048,
    },
  ],
  [
    'f7',
    {
      windows: 0x0041,
      macos: 0x62,
      linux: 0x0049,
    },
  ],
  [
    'f8',
    {
      windows: 0x0042,
      macos: 0x64,
      linux: 0x004a,
    },
  ],
  [
    'f9',
    {
      windows: 0x0043,
      macos: 0x65,
      linux: 0x004b,
    },
  ],
  [
    'find',
    {
      windows: null,
      macos: null,
      linux: 0x0090,
    },
  ],
  [
    'help',
    {
      windows: 0xe03b,
      macos: null,
      linux: 0x0092,
    },
  ],
  [
    'home',
    {
      windows: 0xe047,
      macos: 0x73,
      linux: 0x006e,
    },
  ],
  [
    'insert',
    {
      windows: 0xe052,
      macos: 0x72,
      linux: 0x0076,
    },
  ],
  [
    'intlbackslash',
    {
      windows: 0x0056,
      macos: 0x0a,
      linux: 0x005e,
    },
  ],
  [
    'intlro',
    {
      windows: 0x0073,
      macos: 0x5e,
      linux: 0x0061,
    },
  ],
  [
    'intlyen',
    {
      windows: 0x007d,
      macos: 0x5d,
      linux: 0x0084,
    },
  ],
  [
    'kanamode',
    {
      windows: 0x0070,
      macos: null,
      linux: 0x0065,
    },
  ],
  [
    'keya',
    {
      windows: 0x001e,
      macos: 0x00,
      linux: 0x0026,
    },
  ],
  [
    'keyb',
    {
      windows: 0x0030,
      macos: 0x0b,
      linux: 0x0038,
    },
  ],
  [
    'keyc',
    {
      windows: 0x002e,
      macos: 0x08,
      linux: 0x0036,
    },
  ],
  [
    'keyd',
    {
      windows: 0x0020,
      macos: 0x02,
      linux: 0x0028,
    },
  ],
  [
    'keye',
    {
      windows: 0x0012,
      macos: 0x0e,
      linux: 0x001a,
    },
  ],
  [
    'keyf',
    {
      windows: 0x0021,
      macos: 0x03,
      linux: 0x0029,
    },
  ],
  [
    'keyg',
    {
      windows: 0x0022,
      macos: 0x05,
      linux: 0x002a,
    },
  ],
  [
    'keyh',
    {
      windows: 0x0023,
      macos: 0x04,
      linux: 0x002b,
    },
  ],
  [
    'keyi',
    {
      windows: 0x0017,
      macos: 0x22,
      linux: 0x001f,
    },
  ],
  [
    'keyj',
    {
      windows: 0x0024,
      macos: 0x26,
      linux: 0x002c,
    },
  ],
  [
    'keyk',
    {
      windows: 0x0025,
      macos: 0x28,
      linux: 0x002d,
    },
  ],
  [
    'keyl',
    {
      windows: 0x0026,
      macos: 0x25,
      linux: 0x002e,
    },
  ],
  [
    'keym',
    {
      windows: 0x0032,
      macos: 0x2e,
      linux: 0x003a,
    },
  ],
  [
    'keyn',
    {
      windows: 0x0031,
      macos: 0x2d,
      linux: 0x0039,
    },
  ],
  [
    'keyo',
    {
      windows: 0x0018,
      macos: 0x1f,
      linux: 0x0020,
    },
  ],
  [
    'keyp',
    {
      windows: 0x0019,
      macos: 0x23,
      linux: 0x0021,
    },
  ],
  [
    'keyq',
    {
      windows: 0x0010,
      macos: 0x0c,
      linux: 0x0018,
    },
  ],
  [
    'keyr',
    {
      windows: 0x0013,
      macos: 0x0f,
      linux: 0x001b,
    },
  ],
  [
    'keys',
    {
      windows: 0x001f,
      macos: 0x01,
      linux: 0x0027,
    },
  ],
  [
    'keyt',
    {
      windows: 0x0014,
      macos: 0x11,
      linux: 0x001c,
    },
  ],
  [
    'keyu',
    {
      windows: 0x0016,
      macos: 0x20,
      linux: 0x001e,
    },
  ],
  [
    'keyv',
    {
      windows: 0x002f,
      macos: 0x09,
      linux: 0x0037,
    },
  ],
  [
    'keyw',
    {
      windows: 0x0011,
      macos: 0x0d,
      linux: 0x0019,
    },
  ],
  [
    'keyx',
    {
      windows: 0x002d,
      macos: 0x07,
      linux: 0x0035,
    },
  ],
  [
    'keyy',
    {
      windows: 0x0015,
      macos: 0x10,
      linux: 0x001d,
    },
  ],
  [
    'keyz',
    {
      windows: 0x002c,
      macos: 0x06,
      linux: 0x0034,
    },
  ],
  [
    'lang1',
    {
      windows: 0x0072,
      macos: 0x68,
      linux: 0x0082,
    },
  ],
  [
    'lang2',
    {
      windows: 0x0071,
      macos: 0x66,
      linux: 0x0083,
    },
  ],
  [
    'lang3',
    {
      windows: 0x0078,
      macos: null,
      linux: 0x0062,
    },
  ],
  [
    'lang4',
    {
      windows: 0x0077,
      macos: null,
      linux: 0x0063,
    },
  ],
  [
    'lang5',
    {
      windows: null,
      macos: null,
      linux: 0x005d,
    },
  ],
  [
    'launchapp1',
    {
      windows: 0xe06b,
      macos: null,
      linux: 0x0098,
    },
  ],
  [
    'launchapp2',
    {
      windows: 0xe021,
      macos: null,
      linux: 0x0094,
    },
  ],
  [
    'launchmail',
    {
      windows: 0xe06c,
      macos: null,
      linux: 0x00a3,
    },
  ],
  [
    'mediaplaypause',
    {
      windows: 0xe022,
      macos: null,
      linux: 0x00ac,
    },
  ],
  [
    'mediaselect',
    {
      windows: 0xe06d,
      macos: null,
      linux: 0x00b3,
    },
  ],
  [
    'mediastop',
    {
      windows: 0xe024,
      macos: null,
      linux: 0x00ae,
    },
  ],
  [
    'mediatracknext',
    {
      windows: 0xe019,
      macos: null,
      linux: 0x00ab,
    },
  ],
  [
    'mediatrackprevious',
    {
      windows: 0xe010,
      macos: null,
      linux: 0x00ad,
    },
  ],
  [
    'metaleft',
    {
      windows: 0xe05b,
      macos: 0x37,
      linux: 0x0085,
    },
  ],
  [
    'metaright',
    {
      windows: 0xe05c,
      macos: 0x36,
      linux: 0x0086,
    },
  ],
  [
    'minus',
    {
      windows: 0x000c,
      macos: 0x1b,
      linux: 0x0014,
    },
  ],
  [
    'nonconvert',
    {
      windows: 0x007b,
      macos: null,
      linux: 0x0066,
    },
  ],
  [
    'numlock',
    {
      windows: 0xe045,
      macos: 0x47,
      linux: 0x004d,
    },
  ],
  [
    'numpad0',
    {
      windows: 0x0052,
      macos: 0x52,
      linux: 0x005a,
    },
  ],
  [
    'numpad1',
    {
      windows: 0x004f,
      macos: 0x53,
      linux: 0x0057,
    },
  ],
  [
    'numpad2',
    {
      windows: 0x0050,
      macos: 0x54,
      linux: 0x0058,
    },
  ],
  [
    'numpad3',
    {
      windows: 0x0051,
      macos: 0x55,
      linux: 0x0059,
    },
  ],
  [
    'numpad4',
    {
      windows: 0x004b,
      macos: 0x56,
      linux: 0x0053,
    },
  ],
  [
    'numpad5',
    {
      windows: 0x004c,
      macos: 0x57,
      linux: 0x0054,
    },
  ],
  [
    'numpad6',
    {
      windows: 0x004d,
      macos: 0x58,
      linux: 0x0055,
    },
  ],
  [
    'numpad7',
    {
      windows: 0x0047,
      macos: 0x59,
      linux: 0x004f,
    },
  ],
  [
    'numpad8',
    {
      windows: 0x0048,
      macos: 0x5b,
      linux: 0x0050,
    },
  ],
  [
    'numpad9',
    {
      windows: 0x0049,
      macos: 0x5c,
      linux: 0x0051,
    },
  ],
  [
    'numpadadd',
    {
      windows: 0x004e,
      macos: 0x45,
      linux: 0x0056,
    },
  ],
  [
    'numpadcomma',
    {
      windows: 0x007e,
      macos: 0x5f,
      linux: 0x0081,
    },
  ],
  [
    'numpaddecimal',
    {
      windows: 0x0053,
      macos: 0x41,
      linux: 0x005b,
    },
  ],
  [
    'numpaddivide',
    {
      windows: 0xe035,
      macos: 0x4b,
      linux: 0x006a,
    },
  ],
  [
    'numpadenter',
    {
      windows: 0xe01c,
      macos: 0x4c,
      linux: 0x0068,
    },
  ],
  [
    'numpadequal',
    {
      windows: 0x0059,
      macos: 0x51,
      linux: 0x007d,
    },
  ],
  [
    'numpadmultiply',
    {
      windows: 0x0037,
      macos: 0x43,
      linux: 0x003f,
    },
  ],
  [
    'numpadparenleft',
    {
      windows: null,
      macos: null,
      linux: 0x00bb,
    },
  ],
  [
    'numpadparenright',
    {
      windows: null,
      macos: null,
      linux: 0x00bc,
    },
  ],
  [
    'numpadsubtract',
    {
      windows: 0x004a,
      macos: 0x4e,
      linux: 0x0052,
    },
  ],
  [
    'open',
    {
      windows: null,
      macos: null,
      linux: 0x008e,
    },
  ],
  [
    'pagedown',
    {
      windows: 0xe051,
      macos: 0x79,
      linux: 0x0075,
    },
  ],
  [
    'pageup',
    {
      windows: 0xe049,
      macos: 0x74,
      linux: 0x0070,
    },
  ],
  [
    'paste',
    {
      windows: 0xe00a,
      macos: null,
      linux: 0x008f,
    },
  ],
  [
    'pause',
    {
      windows: 0x0045,
      macos: null,
      linux: 0x007f,
    },
  ],
  [
    'period',
    {
      windows: 0x0034,
      macos: 0x2f,
      linux: 0x003c,
    },
  ],
  [
    'power',
    {
      windows: 0xe05e,
      macos: null,
      linux: 0x007c,
    },
  ],
  [
    'printscreen',
    {
      windows: 0xe037,
      macos: null,
      linux: 0x006b,
    },
  ],
  [
    'quote',
    {
      windows: 0x0028,
      macos: 0x27,
      linux: 0x0030,
    },
  ],
  [
    'scrolllock',
    {
      windows: 0x0046,
      macos: null,
      linux: 0x004e,
    },
  ],
  [
    'select',
    {
      windows: null,
      macos: null,
      linux: 0x008c,
    },
  ],
  [
    'semicolon',
    {
      windows: 0x0027,
      macos: 0x29,
      linux: 0x002f,
    },
  ],
  [
    'shiftleft',
    {
      windows: 0x002a,
      macos: 0x38,
      linux: 0x0032,
    },
  ],
  [
    'shiftright',
    {
      windows: 0x0036,
      macos: 0x3c,
      linux: 0x003e,
    },
  ],
  [
    'slash',
    {
      windows: 0x0035,
      macos: 0x2c,
      linux: 0x003d,
    },
  ],
  [
    'sleep',
    {
      windows: 0xe05f,
      macos: null,
      linux: 0x0096,
    },
  ],
  [
    'space',
    {
      windows: 0x0039,
      macos: 0x31,
      linux: 0x0041,
    },
  ],
  [
    'tab',
    {
      windows: 0x000f,
      macos: 0x30,
      linux: 0x0017,
    },
  ],
  [
    'undo',
    {
      windows: 0xe008,
      macos: null,
      linux: 0x008b,
    },
  ],
  [
    'wakeup',
    {
      windows: 0xe063,
      macos: 0x30,
      linux: 0x0097,
    },
  ],
]);

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
 * This is used in the map below to map from DOM key codes (which are strings) to platform
 * specific key code numbers.
 */
interface IKeyMapping {
  windows: number | null;
  macos: number | null;
  linux: number | null;
}

// The values in this map are derived from the tables on this page:
// https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
const KeyCodes: Map<string, IKeyMapping> = new Map([
  [
    'Again',
    {
      windows: null,
      macos: null,
      linux: 0x0089,
    },
  ],
  [
    'AltLeft',
    {
      windows: 0x0038,
      macos: 0x3a,
      linux: 0x0040,
    },
  ],
  [
    'AltRight',
    {
      windows: 0xe038,
      macos: 0x3d,
      linux: 0x006c,
    },
  ],
  [
    'ArrowDown',
    {
      windows: 0xe050,
      macos: 0x7d,
      linux: 0x0074,
    },
  ],
  [
    'ArrowLeft',
    {
      windows: 0xe04b,
      macos: 0x7b,
      linux: 0x0071,
    },
  ],
  [
    'ArrowRight',
    {
      windows: 0xe04d,
      macos: 0x7c,
      linux: 0x0072,
    },
  ],
  [
    'ArrowUp',
    {
      windows: 0xe048,
      macos: 0x7e,
      linux: 0x006f,
    },
  ],
  [
    'AudioVolumeDown',
    {
      windows: 0xe02e,
      macos: 0x49,
      linux: 0x007a,
    },
  ],
  [
    'AudioVolumeMute',
    {
      windows: 0xe020,
      macos: 0x4a,
      linux: 0x0079,
    },
  ],
  [
    'AudioVolumeUp',
    {
      windows: 0xe030,
      macos: 0x48,
      linux: 0x007b,
    },
  ],
  [
    'Backquote',
    {
      windows: 0x0029,
      macos: 0x32,
      linux: 0x0031,
    },
  ],
  [
    'Backslash',
    {
      windows: 0x002b,
      macos: 0x2a,
      linux: 0x0033,
    },
  ],
  [
    'Backspace',
    {
      windows: 0x000e,
      macos: 0x33,
      linux: 0x0016,
    },
  ],
  [
    'BracketLeft',
    {
      windows: 0x001a,
      macos: 0x21,
      linux: 0x0022,
    },
  ],
  [
    'BracketRight',
    {
      windows: 0x001b,
      macos: 0x1e,
      linux: 0x0023,
    },
  ],
  [
    'BrowserBack',
    {
      windows: 0xe06a,
      macos: null,
      linux: 0x00a6,
    },
  ],
  [
    'BrowserFavorites',
    {
      windows: 0xe066,
      macos: null,
      linux: 0x00a4,
    },
  ],
  [
    'BrowserForward',
    {
      windows: 0xe069,
      macos: null,
      linux: 0x00a7,
    },
  ],
  [
    'BrowserHome',
    {
      windows: 0xe032,
      macos: null,
      linux: 0x00b4,
    },
  ],
  [
    'BrowserRefresh',
    {
      windows: 0xe067,
      macos: null,
      linux: 0x00b5,
    },
  ],
  [
    'BrowserSearch',
    {
      windows: 0xe065,
      macos: null,
      linux: 0x00e1,
    },
  ],
  [
    'BrowserStop',
    {
      windows: 0xe068,
      macos: null,
      linux: 0x0088,
    },
  ],
  [
    'CapsLock',
    {
      windows: 0x003a,
      macos: 0x39,
      linux: 0x0042,
    },
  ],
  [
    'Comma',
    {
      windows: 0x0033,
      macos: 0x2b,
      linux: 0x003b,
    },
  ],
  [
    'ContextMenu',
    {
      windows: 0xe05d,
      macos: 0x6e,
      linux: 0x0087,
    },
  ],
  [
    'ControlLeft',
    {
      windows: 0x001d,
      macos: 0x3b,
      linux: 0x0025,
    },
  ],
  [
    'ControlRight',
    {
      windows: 0xe01d,
      macos: 0x3e,
      linux: 0x0069,
    },
  ],
  [
    'Convert',
    {
      windows: 0x0079,
      macos: null,
      linux: 0x0064,
    },
  ],
  [
    'Copy',
    {
      windows: 0xe018,
      macos: null,
      linux: 0x008d,
    },
  ],
  [
    'Cut',
    {
      windows: 0xe017,
      macos: null,
      linux: 0x0091,
    },
  ],
  [
    'Delete',
    {
      windows: 0xe053,
      macos: 0x75,
      linux: 0x0077,
    },
  ],
  [
    'Digit0',
    {
      windows: 0x000b,
      macos: 0x1d,
      linux: 0x0013,
    },
  ],
  [
    'Digit1',
    {
      windows: 0x0002,
      macos: 0x12,
      linux: 0x000a,
    },
  ],
  [
    'Digit2',
    {
      windows: 0x0003,
      macos: 0x13,
      linux: 0x000b,
    },
  ],
  [
    'Digit3',
    {
      windows: 0x0004,
      macos: 0x14,
      linux: 0x000c,
    },
  ],
  [
    'Digit4',
    {
      windows: 0x0005,
      macos: 0x15,
      linux: 0x000d,
    },
  ],
  [
    'Digit5',
    {
      windows: 0x0006,
      macos: 0x17,
      linux: 0x000e,
    },
  ],
  [
    'Digit6',
    {
      windows: 0x0007,
      macos: 0x16,
      linux: 0x000f,
    },
  ],
  [
    'Digit7',
    {
      windows: 0x0008,
      macos: 0x1a,
      linux: 0x0010,
    },
  ],
  [
    'Digit8',
    {
      windows: 0x0009,
      macos: 0x1c,
      linux: 0x0011,
    },
  ],
  [
    'Digit9',
    {
      windows: 0x000a,
      macos: 0x19,
      linux: 0x0012,
    },
  ],
  [
    'Eject',
    {
      windows: 0xe02c,
      macos: null,
      linux: 0x00a9,
    },
  ],
  [
    'End',
    {
      windows: 0xe04f,
      macos: 0x77,
      linux: 0x0073,
    },
  ],
  [
    'Enter',
    {
      windows: 0x001c,
      macos: 0x24,
      linux: 0x0024,
    },
  ],
  [
    'Equal',
    {
      windows: 0x000d,
      macos: 0x18,
      linux: 0x0015,
    },
  ],
  [
    'Escape',
    {
      windows: 0x0001,
      macos: 0x35,
      linux: 0x0009,
    },
  ],
  [
    'F1',
    {
      windows: 0x003b,
      macos: 0x7a,
      linux: 0x0043,
    },
  ],
  [
    'F10',
    {
      windows: 0x0044,
      macos: 0x6d,
      linux: 0x004c,
    },
  ],
  [
    'F11',
    {
      windows: 0x0057,
      macos: 0x67,
      linux: 0x005f,
    },
  ],
  [
    'F12',
    {
      windows: 0x0058,
      macos: 0x6f,
      linux: 0x0060,
    },
  ],
  [
    'F13',
    {
      windows: 0x0064,
      macos: 0x69,
      linux: 0x00bf,
    },
  ],
  [
    'F14',
    {
      windows: 0x0065,
      macos: 0x6b,
      linux: 0x00c0,
    },
  ],
  [
    'F15',
    {
      windows: 0x0066,
      macos: 0x71,
      linux: 0x00c1,
    },
  ],
  [
    'F16',
    {
      windows: 0x0067,
      macos: 0x6a,
      linux: 0x00c2,
    },
  ],
  [
    'F17',
    {
      windows: 0x0068,
      macos: 0x40,
      linux: 0x00c3,
    },
  ],
  [
    'F18',
    {
      windows: 0x0069,
      macos: 0x4f,
      linux: 0x00c4,
    },
  ],
  [
    'F19',
    {
      windows: 0x006a,
      macos: 0x50,
      linux: 0x00c5,
    },
  ],
  [
    'F2',
    {
      windows: 0x003c,
      macos: 0x78,
      linux: 0x0044,
    },
  ],
  [
    'F20',
    {
      windows: 0x006b,
      macos: 0x5a,
      linux: 0x00c6,
    },
  ],
  [
    'F21',
    {
      windows: 0x006c,
      macos: null,
      linux: 0x00c7,
    },
  ],
  [
    'F22',
    {
      windows: 0x006d,
      macos: null,
      linux: 0x00c8,
    },
  ],
  [
    'F23',
    {
      windows: 0x006e,
      macos: null,
      linux: 0x00c9,
    },
  ],
  [
    'F24',
    {
      windows: 0x0076,
      macos: null,
      linux: 0x00ca,
    },
  ],
  [
    'F3',
    {
      windows: 0x003d,
      macos: 0x63,
      linux: 0x0045,
    },
  ],
  [
    'F4',
    {
      windows: 0x003e,
      macos: 0x76,
      linux: 0x0046,
    },
  ],
  [
    'F5',
    {
      windows: 0x003f,
      macos: 0x60,
      linux: 0x0047,
    },
  ],
  [
    'F6',
    {
      windows: 0x0040,
      macos: 0x61,
      linux: 0x0048,
    },
  ],
  [
    'F7',
    {
      windows: 0x0041,
      macos: 0x62,
      linux: 0x0049,
    },
  ],
  [
    'F8',
    {
      windows: 0x0042,
      macos: 0x64,
      linux: 0x004a,
    },
  ],
  [
    'F9',
    {
      windows: 0x0043,
      macos: 0x65,
      linux: 0x004b,
    },
  ],
  [
    'Find',
    {
      windows: null,
      macos: null,
      linux: 0x0090,
    },
  ],
  [
    'Help',
    {
      windows: 0xe03b,
      macos: null,
      linux: 0x0092,
    },
  ],
  [
    'Home',
    {
      windows: 0xe047,
      macos: 0x73,
      linux: 0x006e,
    },
  ],
  [
    'Insert',
    {
      windows: 0xe052,
      macos: 0x72,
      linux: 0x0076,
    },
  ],
  [
    'IntlBackslash',
    {
      windows: 0x0056,
      macos: 0x0a,
      linux: 0x005e,
    },
  ],
  [
    'IntlRo',
    {
      windows: 0x0073,
      macos: 0x5e,
      linux: 0x0061,
    },
  ],
  [
    'IntlYen',
    {
      windows: 0x007d,
      macos: 0x5d,
      linux: 0x0084,
    },
  ],
  [
    'KanaMode',
    {
      windows: 0x0070,
      macos: null,
      linux: 0x0065,
    },
  ],
  [
    'KeyA',
    {
      windows: 0x001e,
      macos: 0x00,
      linux: 0x0026,
    },
  ],
  [
    'KeyB',
    {
      windows: 0x0030,
      macos: 0x0b,
      linux: 0x0038,
    },
  ],
  [
    'KeyC',
    {
      windows: 0x002e,
      macos: 0x08,
      linux: 0x0036,
    },
  ],
  [
    'KeyD',
    {
      windows: 0x0020,
      macos: 0x02,
      linux: 0x0028,
    },
  ],
  [
    'KeyE',
    {
      windows: 0x0012,
      macos: 0x0e,
      linux: 0x001a,
    },
  ],
  [
    'KeyF',
    {
      windows: 0x0021,
      macos: 0x03,
      linux: 0x0029,
    },
  ],
  [
    'KeyG',
    {
      windows: 0x0022,
      macos: 0x05,
      linux: 0x002a,
    },
  ],
  [
    'KeyH',
    {
      windows: 0x0023,
      macos: 0x04,
      linux: 0x002b,
    },
  ],
  [
    'KeyI',
    {
      windows: 0x0017,
      macos: 0x22,
      linux: 0x001f,
    },
  ],
  [
    'KeyJ',
    {
      windows: 0x0024,
      macos: 0x26,
      linux: 0x002c,
    },
  ],
  [
    'KeyK',
    {
      windows: 0x0025,
      macos: 0x28,
      linux: 0x002d,
    },
  ],
  [
    'KeyL',
    {
      windows: 0x0026,
      macos: 0x25,
      linux: 0x002e,
    },
  ],
  [
    'KeyM',
    {
      windows: 0x0032,
      macos: 0x2e,
      linux: 0x003a,
    },
  ],
  [
    'KeyN',
    {
      windows: 0x0031,
      macos: 0x2d,
      linux: 0x0039,
    },
  ],
  [
    'KeyO',
    {
      windows: 0x0018,
      macos: 0x1f,
      linux: 0x0020,
    },
  ],
  [
    'KeyP',
    {
      windows: 0x0019,
      macos: 0x23,
      linux: 0x0021,
    },
  ],
  [
    'KeyQ',
    {
      windows: 0x0010,
      macos: 0x0c,
      linux: 0x0018,
    },
  ],
  [
    'KeyR',
    {
      windows: 0x0013,
      macos: 0x0f,
      linux: 0x001b,
    },
  ],
  [
    'KeyS',
    {
      windows: 0x001f,
      macos: 0x01,
      linux: 0x0027,
    },
  ],
  [
    'KeyT',
    {
      windows: 0x0014,
      macos: 0x11,
      linux: 0x001c,
    },
  ],
  [
    'KeyU',
    {
      windows: 0x0016,
      macos: 0x20,
      linux: 0x001e,
    },
  ],
  [
    'KeyV',
    {
      windows: 0x002f,
      macos: 0x09,
      linux: 0x0037,
    },
  ],
  [
    'KeyW',
    {
      windows: 0x0011,
      macos: 0x0d,
      linux: 0x0019,
    },
  ],
  [
    'KeyX',
    {
      windows: 0x002d,
      macos: 0x07,
      linux: 0x0035,
    },
  ],
  [
    'KeyY',
    {
      windows: 0x0015,
      macos: 0x10,
      linux: 0x001d,
    },
  ],
  [
    'KeyZ',
    {
      windows: 0x002c,
      macos: 0x06,
      linux: 0x0034,
    },
  ],
  [
    'Lang1',
    {
      windows: 0x0072,
      macos: 0x68,
      linux: 0x0082,
    },
  ],
  [
    'Lang2',
    {
      windows: 0x0071,
      macos: 0x66,
      linux: 0x0083,
    },
  ],
  [
    'Lang3',
    {
      windows: 0x0078,
      macos: null,
      linux: 0x0062,
    },
  ],
  [
    'Lang4',
    {
      windows: 0x0077,
      macos: null,
      linux: 0x0063,
    },
  ],
  [
    'Lang5',
    {
      windows: null,
      macos: null,
      linux: 0x005d,
    },
  ],
  [
    'LaunchApp1',
    {
      windows: 0xe06b,
      macos: null,
      linux: 0x0098,
    },
  ],
  [
    'LaunchApp2',
    {
      windows: 0xe021,
      macos: null,
      linux: 0x0094,
    },
  ],
  [
    'LaunchMail',
    {
      windows: 0xe06c,
      macos: null,
      linux: 0x00a3,
    },
  ],
  [
    'MediaPlayPause',
    {
      windows: 0xe022,
      macos: null,
      linux: 0x00ac,
    },
  ],
  [
    'MediaSelect',
    {
      windows: 0xe06d,
      macos: null,
      linux: 0x00b3,
    },
  ],
  [
    'MediaStop',
    {
      windows: 0xe024,
      macos: null,
      linux: 0x00ae,
    },
  ],
  [
    'MediaTrackNext',
    {
      windows: 0xe019,
      macos: null,
      linux: 0x00ab,
    },
  ],
  [
    'MediaTrackPrevious',
    {
      windows: 0xe010,
      macos: null,
      linux: 0x00ad,
    },
  ],
  [
    'MetaLeft',
    {
      windows: 0xe05b,
      macos: 0x37,
      linux: 0x0085,
    },
  ],
  [
    'MetaRight',
    {
      windows: 0xe05c,
      macos: 0x36,
      linux: 0x0086,
    },
  ],
  [
    'Minus',
    {
      windows: 0x000c,
      macos: 0x1b,
      linux: 0x0014,
    },
  ],
  [
    'NonConvert',
    {
      windows: 0x007b,
      macos: null,
      linux: 0x0066,
    },
  ],
  [
    'NumLock',
    {
      windows: 0xe045,
      macos: 0x47,
      linux: 0x004d,
    },
  ],
  [
    'Numpad0',
    {
      windows: 0x0052,
      macos: 0x52,
      linux: 0x005a,
    },
  ],
  [
    'Numpad1',
    {
      windows: 0x004f,
      macos: 0x53,
      linux: 0x0057,
    },
  ],
  [
    'Numpad2',
    {
      windows: 0x0050,
      macos: 0x54,
      linux: 0x0058,
    },
  ],
  [
    'Numpad3',
    {
      windows: 0x0051,
      macos: 0x55,
      linux: 0x0059,
    },
  ],
  [
    'Numpad4',
    {
      windows: 0x004b,
      macos: 0x56,
      linux: 0x0053,
    },
  ],
  [
    'Numpad5',
    {
      windows: 0x004c,
      macos: 0x57,
      linux: 0x0054,
    },
  ],
  [
    'Numpad6',
    {
      windows: 0x004d,
      macos: 0x58,
      linux: 0x0055,
    },
  ],
  [
    'Numpad7',
    {
      windows: 0x0047,
      macos: 0x59,
      linux: 0x004f,
    },
  ],
  [
    'Numpad8',
    {
      windows: 0x0048,
      macos: 0x5b,
      linux: 0x0050,
    },
  ],
  [
    'Numpad9',
    {
      windows: 0x0049,
      macos: 0x5c,
      linux: 0x0051,
    },
  ],
  [
    'NumpadAdd',
    {
      windows: 0x004e,
      macos: 0x45,
      linux: 0x0056,
    },
  ],
  [
    'NumpadComma',
    {
      windows: 0x007e,
      macos: 0x5f,
      linux: 0x0081,
    },
  ],
  [
    'NumpadDecimal',
    {
      windows: 0x0053,
      macos: 0x41,
      linux: 0x005b,
    },
  ],
  [
    'NumpadDivide',
    {
      windows: 0xe035,
      macos: 0x4b,
      linux: 0x006a,
    },
  ],
  [
    'NumpadEnter',
    {
      windows: 0xe01c,
      macos: 0x4c,
      linux: 0x0068,
    },
  ],
  [
    'NumpadEqual',
    {
      windows: 0x0059,
      macos: 0x51,
      linux: 0x007d,
    },
  ],
  [
    'NumpadMultiply',
    {
      windows: 0x0037,
      macos: 0x43,
      linux: 0x003f,
    },
  ],
  [
    'NumpadParenLeft',
    {
      windows: null,
      macos: null,
      linux: 0x00bb,
    },
  ],
  [
    'NumpadParenRight',
    {
      windows: null,
      macos: null,
      linux: 0x00bc,
    },
  ],
  [
    'NumpadSubtract',
    {
      windows: null,
      macos: 0x4e,
      linux: 0x0052,
    },
  ],
  [
    'Open',
    {
      windows: null,
      macos: null,
      linux: 0x008e,
    },
  ],
  [
    'PageDown',
    {
      windows: 0xe051,
      macos: 0x79,
      linux: 0x0075,
    },
  ],
  [
    'PageUp',
    {
      windows: 0xe049,
      macos: 0x74,
      linux: 0x0070,
    },
  ],
  [
    'Paste',
    {
      windows: 0xe00a,
      macos: null,
      linux: 0x008f,
    },
  ],
  [
    'Pause',
    {
      windows: 0x0045,
      macos: null,
      linux: 0x007f,
    },
  ],
  [
    'Period',
    {
      windows: 0x0034,
      macos: 0x2f,
      linux: 0x003c,
    },
  ],
  [
    'Power',
    {
      windows: 0xe05e,
      macos: null,
      linux: 0x007c,
    },
  ],
  [
    'PrintScreen',
    {
      windows: 0xe037,
      macos: null,
      linux: 0x006b,
    },
  ],
  [
    'Quote',
    {
      windows: 0x0028,
      macos: 0x27,
      linux: 0x0030,
    },
  ],
  [
    'ScrollLock',
    {
      windows: 0x0046,
      macos: null,
      linux: 0x004e,
    },
  ],
  [
    'Select',
    {
      windows: null,
      macos: null,
      linux: 0x008c,
    },
  ],
  [
    'Semicolon',
    {
      windows: 0x0027,
      macos: 0x29,
      linux: 0x002f,
    },
  ],
  [
    'ShiftLeft',
    {
      windows: 0x002a,
      macos: 0x38,
      linux: 0x0032,
    },
  ],
  [
    'ShiftRight',
    {
      windows: 0x0036,
      macos: 0x3c,
      linux: 0x003e,
    },
  ],
  [
    'Slash',
    {
      windows: 0x0035,
      macos: 0x2c,
      linux: 0x003d,
    },
  ],
  [
    'Sleep',
    {
      windows: 0xe05f,
      macos: null,
      linux: 0x0096,
    },
  ],
  [
    'Space',
    {
      windows: 0x0039,
      macos: 0x31,
      linux: 0x0041,
    },
  ],
  [
    'Tab',
    {
      windows: 0x000f,
      macos: null,
      linux: 0x0017,
    },
  ],
  [
    'Undo',
    {
      windows: 0xe008,
      macos: null,
      linux: 0x008b,
    },
  ],
  [
    'WakeUp',
    {
      windows: 0xe063,
      macos: 0x30,
      linux: 0x0097,
    },
  ],
]);

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
    const code = KeyCodes.get(key.name.toLowerCase())?.[os];

    if (!code) {
      throw new Error(`Unknown key: ${key.name}`);
    }

    return code;
  });
}

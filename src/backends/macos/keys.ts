//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * This is a mapping from the DOM key names to the MacOS virtual key codes. This is based
 * on this list:
 * https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
 */
export const MacosKeyNames = new Map<string, string>([
  ['Alt', 'kVK_Option'], // (0x3A), kVK_RightOption (0x3D)
  ['CapsLock', 'kVK_CapsLock'], // (0x39)
  ['Control', 'kVK_Control'], // (0x3B), kVK_RightControl (0x3E)
  ['Fn', 'kVK_Function'], // (0x3F)
  ['Meta', 'kVK_Command'], // (0x37), kVK_RightCommand (0x36)
  ['Shift', 'kVK_Shift'], // (0x38), kVK_RightShift (0x3C)
  ['Enter', 'kVK_Return'], // (0x24), kVK_ANSI_KeypadEnter (0x4C), kVK_Powerbook_KeypadEnter (0x34)
  ['Tab', 'kVK_Tab'], // (0x30)
  [' ', 'kVK_Space'], // (0x31)
  ['ArrowDown', 'kVK_DownArrow'], // (0x7D)
  ['ArrowLeft', 'kVK_LeftArrow'], // (0x7B)
  ['ArrowRight', 'kVK_RightArrow'], // (0x7C)
  ['ArrowUp', 'kVK_UpArrow'], // (0x7E)
  ['End', 'kVK_End'], // (0x77)
  ['Home', 'kVK_Home'], // (0x73)
  ['PageDown', 'kVK_PageDown'], // (0x79)
  ['PageUp', 'kVK_PageUp'], // (0x74)
  ['Backspace', 'kVK_Delete'], // (0x33)
  ['Clear', 'kVK_ANSI_KeypadClear'], // (0x47)
  ['Delete', 'kVK_ForwardDelete'], // (0x75) [1]
  ['ContextMenu', 'kVK_PC_ContextMenu'], // (0x6E)
  ['Escape', 'kVK_Escape'], // (0x35)
  ['Help', 'kVK_Help'], // (0x72)
  ['Eisu', 'kVK_JIS_Eisu'], // (0x66)
  ['KanjiMode', 'kVK_JIS_Kana'], // (0x68)
  ['F1', 'kVK_F1'], // (0x7A)
  ['F2', 'kVK_F2'], // (0x78)
  ['F3', 'kVK_F3'], // (0x63)
  ['F4', 'kVK_F4'], // (0x76)
  ['F5', 'kVK_F5'], // (0x60)
  ['F6', 'kVK_F6'], // (0x61)
  ['F7', 'kVK_F7'], // (0x62)
  ['F8', 'kVK_F8'], // (0x64)
  ['F9', 'kVK_F9'], // (0x65)
  ['F10', 'kVK_F10'], // (0x6D)
  ['F11', 'kVK_F11'], // (0x67)
  ['F12', 'kVK_F12'], // (0x6F)
  ['F13', 'kVK_F13'], // (0x69)
  ['F14', 'kVK_F14'], // (0x6B)
  ['F15', 'kVK_F15'], // (0x71)
  ['F16', 'kVK_F16'], // (0x6A)
  ['F17', 'kVK_F17'], // (0x40)
  ['F18', 'kVK_F18'], // (0x4F)
  ['F19', 'kVK_F19'], // (0x50)
  ['F20', 'kVK_F20'], // (0x5A)
  ['AudioVolumeDown', 'kVK_VolumeDown'], // (0x49)
  ['AudioVolumeMute', 'kVK_Mute'], // (0x4A)
  ['AudioVolumeUp', 'kVK_VolumeUp'], // (0x48)
  ['Decimal', 'kVK_ANSI_KeypadDecimal'], // (0x41)
  ['Multiply', 'kVK_ANSI_KeypadMultiply'], // (0x43)
  ['Add', 'kVK_ANSI_KeypadPlus'], // (0x45)
  ['Divide', 'kVK_ANSI_KeypadDivide'], // (0x4B)
  ['Subtract', 'kVK_ANSI_KeypadMinus'], // (0x4E)
  ['Separator', 'kVK_JIS_KeypadComma'], // (0x5F)
  ['0', 'kVK_Keypad0'], // (0x52)
  ['1', 'kVK_Keypad1'], // (0x53)
  ['2', 'kVK_Keypad2'], // (0x54)
  ['3', 'kVK_Keypad3'], // (0x55)
  ['4', 'kVK_Keypad4'], // (0x56)
  ['5', 'kVK_Keypad5'], // (0x57)
  ['6', 'kVK_Keypad6'], // (0x58)
  ['7', 'kVK_Keypad7'], // (0x59)
  ['8', 'kVK_Keypad8'], // (0x5a)
  ['9', 'kVK_Keypad9'], // (0x5b)
]);

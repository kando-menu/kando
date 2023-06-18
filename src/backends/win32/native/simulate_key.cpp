//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#include "simulate_key.hpp"

#include <windows.h>
#include <winuser.h>

#include <unordered_map>

namespace simulate_key {

std::unordered_map<std::string, WORD> WindowsKeyCodes = {
  {"VK_ATTN", 0xF6},
  {"VK_CAPITAL", 0x14},
  {"VK_CANCEL", 0x03},
  {"VK_CONTROL", 0x11},
  {"VK_LWIN", 0x5B},
  {"VK_NUMLOCK", 0x90},
  {"VK_SCROLL", 0x91},
  {"VK_SHIFT", 0x10},
  {"VK_RETURN", 0x0D},
  {"VK_TAB", 0x09},
  {"VK_SPACE", 0x20},
  {"VK_DOWN", 0x28},
  {"VK_LEFT", 0x25},
  {"VK_RIGHT", 0x27},
  {"VK_UP", 0x26},
  {"VK_END", 0x23},
  {"VK_HOME", 0x24},
  {"VK_NEXT", 0x22},
  {"VK_PRIOR", 0x21},
  {"VK_BACK", 0x08},
  {"VK_CLEAR", 0x0C},
  {"VK_CRSEL", 0xF7},
  {"VK_DELETE", 0x2E},
  {"VK_EREOF", 0xF9},
  {"VK_EXSEL", 0xF8},
  {"VK_INSERT", 0x2D},
  {"VK_ACCEPT", 0x1E},
  {"VK_OEM_ATTN", 0xF0},
  {"VK_APPS", 0x5D},
  {"VK_ESCAPE", 0x1B},
  {"VK_EXECUTE", 0x2B},
  {"VK_OEM_FINISH", 0xF1},
  {"VK_HELP", 0x2F},
  {"VK_PAUSE", 0x13},
  {"VK_PLAY", 0xFA},
  {"VK_SELECT", 0x29},
  {"VK_SNAPSHOT", 0x2C},
  {"VK_SLEEP", 0x5F},
  {"VK_OEM_ATTN", 0xF0},
  {"VK_CONVERT", 0x1C},
  {"VK_FINAL", 0x18},
  {"VK_MODECHANGE", 0x1F},
  {"VK_NONCONVERT", 0x1D},
  {"VK_PROCESSKEY", 0xE5},
  {"VK_HANGUL", 0x15},
  {"VK_HANJA", 0x19},
  {"VK_JUNJA", 0x17},
  {"VK_OEM_AUTO", 0xF3},
  {"VK_OEM_COPY", 0xF2},
  {"VK_KANA", 0x15},
  {"VK_KANJI", 0x19},
  {"VK_OEM_FINISH", 0xF1},
  {"VK_OEM_BACKTAB", 0xF5},
  {"VK_OEM_ENLW", 0xF4},
  {"VK_F1", 0x70},
  {"VK_F2", 0x71},
  {"VK_F3", 0x72},
  {"VK_F4", 0x73},
  {"VK_F5", 0x74},
  {"VK_F6", 0x75},
  {"VK_F7", 0x76},
  {"VK_F8", 0x77},
  {"VK_F9", 0x78},
  {"VK_F10", 0x79},
  {"VK_F11", 0x7A},
  {"VK_F12", 0x7B},
  {"VK_F13", 0x7C},
  {"VK_F14", 0x7D},
  {"VK_F15", 0x7E},
  {"VK_F16", 0x7F},
  {"VK_F17", 0x80},
  {"VK_F18", 0x81},
  {"VK_F19", 0x82},
  {"VK_F20", 0x83},
  {"VK_MEDIA_PLAY_PAUSE", 0xB3},
  {"VK_MEDIA_STOP", 0xB2},
  {"VK_MEDIA_NEXT_TRACK", 0xB0},
  {"VK_MEDIA_PREV_TRACK", 0xB1},
  {"VK_VOLUME_DOWN", 0xAE},
  {"VK_VOLUME_MUTE", 0xAD},
  {"VK_VOLUME_UP", 0xAF},
  {"VK_ZOOM", 0xFB},
  {"VK_LAUNCH_MAIL", 0xB4},
  {"VK_LAUNCH_MEDIA_SELECT", 0xB5},
  {"VK_LAUNCH_APP1", 0xB6},
  {"VK_LAUNCH_APP2", 0xB7},
  {"VK_BROWSER_BACK", 0xA6},
  {"VK_BROWSER_FAVORITES", 0xAB},
  {"VK_BROWSER_FORWARD", 0xA7},
  {"VK_BROWSER_HOME", 0xAC},
  {"VK_BROWSER_REFRESH", 0xA8},
  {"VK_BROWSER_SEARCH", 0xAA},
  {"VK_BROWSER_STOP", 0xA9},
  {"VK_DECIMAL", 0x6E},
  {"VK_MULTIPLY", 0x6A},
  {"VK_ADD", 0x6B},
  {"VK_DIVIDE", 0x6F},
  {"VK_SUBTRACT", 0x6D},
  {"VK_SEPARATOR", 0x6C}
};

// http://www.quadibloc.com/comp/scan.htm
std::unordered_map<std::string, UINT> WindowsScanCodes = {
  {"Alt", 0x38}
};

// I am not sure if this is the best way to do this, but it works for now. On Windows, it
// seems that there is the concept of a "scan code" and a "virtual key code" which roughly
// correspond to the "code" and "key" in the DOM or to the "keycode" and "keysym" in X11.
// The former is a hardware code that represents the physical location of the key on the
// keyboard, while the latter is a logical code that represents the meaning of the key.
// In Kando, we want to use the logical code, but the Windows API seems to not fully
// support all keys here. For example, the "Alt" key is not supported, but the "Menu" key
// is. So here's what we do:
// 1. If the key is a single character, we use VkKeyScan to get the virtual key code and
//    then MapVirtualKey to get the scan code.
// 2. If the key is not a single character, we use the WindowsKeyCodes above table to get
//    the virtual key code and then MapVirtualKey to get the scan code.
// 3. If the key is not in the KEY_CODES table, we search in the SCAN_CODES table for the
//    scan code and use that.
// 4. If the key is not in the SCAN_CODES table, we throw an error.
Napi::Object simulateKey(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsBoolean()) {
    Napi::TypeError::New(env, "String and Boolean expected").ThrowAsJavaScriptException();
  }

  std::string name = info[0].As<Napi::String>().Utf8Value();
  bool down = info[1].As<Napi::Boolean>().Value();
  
  INPUT input{};
  input.type = INPUT_KEYBOARD;
  input.ki.dwFlags =(down ? 0 : KEYEVENTF_KEYUP) | KEYEVENTF_SCANCODE;

  if (name.length() == 1) {
    WORD virtualKeyCode = VkKeyScan(name[0]);
    input.ki.wScan = MapVirtualKey(virtualKeyCode, MAPVK_VK_TO_VSC);
  } else if (WindowsKeyCodes.find(name) != WindowsKeyCodes.end()) {
    input.ki.wScan = MapVirtualKey(WindowsKeyCodes[name], MAPVK_VK_TO_VSC);
  } else if (WindowsScanCodes.find(name) != WindowsScanCodes.end()) {
    input.ki.wScan = WindowsScanCodes[name];
  } else {
    Napi::TypeError::New(env, "Key '" + name + "' not supported!").ThrowAsJavaScriptException();
  }

  UINT uSent = SendInput(1, &input, sizeof(INPUT));
  if (uSent != 1)
  {
      Napi::TypeError::New(env, "Failed to simulate keys!").ThrowAsJavaScriptException();
  } 

  return Napi::Object::New(env);
}

void init(Napi::Env env, Napi::Object exports) {
  exports.Set("simulateKey", Napi::Function::New(env, simulateKey));
}

} // namespace simulate_key
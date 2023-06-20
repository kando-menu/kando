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
  if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsBoolean()) {
    Napi::TypeError::New(env, "Number and Boolean expected").ThrowAsJavaScriptException();
  }

  int  code = info[0].As<Napi::Number>().Int32Value();
  bool down = info[1].As<Napi::Boolean>().Value();

  INPUT input{};
  input.type       = INPUT_KEYBOARD;
  input.ki.dwFlags = (down ? 0 : KEYEVENTF_KEYUP) | KEYEVENTF_SCANCODE;
  input.ki.wScan   = code;

  UINT uSent = SendInput(1, &input, sizeof(INPUT));
  if (uSent != 1) {
    Napi::TypeError::New(env, "Failed to simulate keys!").ThrowAsJavaScriptException();
  }

  return Napi::Object::New(env);
}

void init(Napi::Env env, Napi::Object exports) {
  exports.Set("simulateKey", Napi::Function::New(env, simulateKey));
}

} // namespace simulate_key
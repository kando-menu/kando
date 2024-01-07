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

  if (code > 255) {
    input.ki.dwFlags |= KEYEVENTF_EXTENDEDKEY;
  }

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
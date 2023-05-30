//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#include "active_window.hpp"

#include <windows.h>
#include <winuser.h>

namespace move_pointer {

void movePointer(int x, int y) {
    SetCursorPos(x, y);
}

Napi::Object movePointerWrapped(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
  }

  Napi::Number x = info[0].As<Napi::Number>();
  Napi::Number y = info[1].As<Napi::Number>();

  movePointer(x.Int32Value(), y.Int32Value());

  return Napi::Object::New(env);
}

void init(Napi::Env env, Napi::Object exports) {
  exports.Set("movePointer",
              Napi::Function::New(env, movePointerWrapped));
}

} // namespace move_pointer
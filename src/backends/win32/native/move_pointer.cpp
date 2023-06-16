//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#include "move_pointer.hpp"

#include <windows.h>
#include <winuser.h>

namespace move_pointer {

void movePointer(int dx, int dy) {
  POINT p;
  GetCursorPos(&p);
  SetCursorPos(dx + p.x, dy + p.y);
}

Napi::Object movePointerWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
  }

  Napi::Number dx = info[0].As<Napi::Number>();
  Napi::Number dy = info[1].As<Napi::Number>();

  movePointer(dx.Int32Value(), dy.Int32Value());

  return Napi::Object::New(env);
}

void init(Napi::Env env, Napi::Object exports) {
  exports.Set("movePointer", Napi::Function::New(env, movePointerWrapped));
}

} // namespace move_pointer
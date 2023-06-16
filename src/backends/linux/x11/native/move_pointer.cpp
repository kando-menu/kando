//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#include "move_pointer.hpp"

#include <X11/Xlib.h>
#include <X11/extensions/XTest.h>

#include <iostream>
#include <string>

namespace move_pointer {

// This converts key names to keyvals. See index.ts for more explanation.
void movePointer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "Two Numbers expected").ThrowAsJavaScriptException();
  }

  auto display = XOpenDisplay(nullptr);

  auto dx = info[0].As<Napi::Number>().Int32Value();
  auto dy = info[1].As<Napi::Number>().Int32Value();

  XTestFakeRelativeMotionEvent(display, dx, dy, CurrentTime);

  XCloseDisplay(display);
}

void init(Napi::Env env, Napi::Object exports) {
  exports.Set("movePointer", Napi::Function::New(env, movePointer));
}

} // namespace move_pointer
//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#include "active_window.hpp"

#include <string>

namespace active_window {
bool getActiveWindow(Napi::Object& obj) {

  obj.Set("wmClass", "fooo");
  obj.Set("name", "baar");

  return true;
}

Napi::Value getActiveWindowWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  Napi::Object obj = Napi::Object::New(env);
  if (getActiveWindow(obj)) {
    return obj;
  }

  return env.Null();
}

void init(Napi::Env env, Napi::Object exports) {
  exports.Set("getActiveWindow", Napi::Function::New(env, getActiveWindowWrapped));
}

} // namespace active_window
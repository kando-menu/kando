//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#include "convert_keys.hpp"

#include <X11/Xlib.h>
#include <X11/keysym.h>

#include <iostream>
#include <string>

namespace convert_keys {

// This converts key names to keyvals. See index.ts for more explanation.
Napi::Value convertKeys(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1 || !info[0].IsArray()) {
    Napi::TypeError::New(env, "Array expected").ThrowAsJavaScriptException();
  }

  // Convert to std::vector<std::string>.
  Napi::Array input  = info[0].As<Napi::Array>();
  Napi::Array output = Napi::Array::New(env, input.Length());
  for (size_t i = 0; i < input.Length(); ++i) {
    if (input.Get(i).IsString()) {
      std::string key = input.Get(i).As<Napi::String>().Utf8Value();

      KeySym keysym = XStringToKeysym(key.c_str());

      if (keysym == NoSymbol) {
        Napi::TypeError::New(env, "Unknown key '" + key + "'!")
            .ThrowAsJavaScriptException();
      } else {
        output.Set(i, keysym);
      }

    } else {
      Napi::TypeError::New(env, "Key array must contain only strings!")
          .ThrowAsJavaScriptException();
    }
  }

  return output;
}

void init(Napi::Env env, Napi::Object exports) {
  exports.Set("convertKeys", Napi::Function::New(env, convertKeys));
}

} // namespace convert_keys
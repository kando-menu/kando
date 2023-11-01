//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#include "simulate_key.hpp"

#include "virtual-keyboard-unstable-v1.h"

#include <iostream>
#include <string>

// This is somewhat inspired by the source code of wtype and the hello-wayland example:
// https://github.com/atx/wtype
// https://github.com/emersion/hello-wayland

namespace simulate_key {

static void handle_global(void *data, struct wl_registry *registry,
		uint32_t name, const char *interface, uint32_t version) {
}

static void handle_global_remove(void *data, struct wl_registry *registry,
		uint32_t name) {
}

void simulateKey(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 2 || !info[0].IsNumber() || !info[1].IsBoolean()) {
    Napi::TypeError::New(env, "Number and Boolean expected").ThrowAsJavaScriptException();
  }

  int32_t keycode = info[0].As<Napi::Number>().Int32Value();
  bool    press   = info[1].As<Napi::Boolean>().Value();

  struct wl_display* display = wl_display_connect(nullptr);
	if (display == nullptr) {
		Napi::TypeError::New(env, "Failed to get Wayland display").ThrowAsJavaScriptException();
	}


  static const struct wl_registry_listener registry_listener = {
	.global = handle_global,
	.global_remove = handle_global_remove,
};

  struct wl_registry *registry = wl_display_get_registry(display);
	wl_registry_add_listener(registry, &registry_listener, NULL);
	wl_display_roundtrip(display);
}

void init(Napi::Env env, Napi::Object exports) {
  exports.Set("simulateKey", Napi::Function::New(env, simulateKey));
}

} // namespace simulate_key
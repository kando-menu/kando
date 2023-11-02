//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#include "move_pointer.hpp"

#include "wlr-virtual-pointer-unstable-v1.h"

#include <iostream>
#include <string>

// This is somewhat inspired by the source code of wtype and the hello-wayland example:
// https://github.com/atx/wtype
// https://github.com/emersion/hello-wayland

namespace move_pointer {

struct WaylandData {
  wl_seat*                         seat    = nullptr;
  zwlr_virtual_pointer_manager_v1* manager = nullptr;
  zwlr_virtual_pointer_v1*         pointer = nullptr;
};

void handle_global(void* data, struct wl_registry* registry, uint32_t name,
    const char* interface, uint32_t version) {
  WaylandData* wdata = static_cast<WaylandData*>(data);
  if (!std::strcmp(interface, wl_seat_interface.name)) {
    wdata->seat = static_cast<wl_seat*>(
        wl_registry_bind(registry, name, &wl_seat_interface, version <= 7 ? version : 7));
  } else if (!std::strcmp(interface, zwlr_virtual_pointer_manager_v1_interface.name)) {
    wdata->manager = static_cast<zwlr_virtual_pointer_manager_v1*>(
        wl_registry_bind(registry, name, &zwlr_virtual_pointer_manager_v1_interface, 1));
  }
}

void handle_global_remove(void* data, wl_registry* registry, uint32_t name) {
}

void movePointer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "Two Numbers expected").ThrowAsJavaScriptException();
  }

  auto dx = info[0].As<Napi::Number>().Int32Value();
  auto dy = info[1].As<Napi::Number>().Int32Value();

  std::cout << "Moving pointer by " << dx << ", " << dy << std::endl;

  wl_display* display = wl_display_connect(nullptr);
  if (display == nullptr) {
    Napi::TypeError::New(env, "Failed to get Wayland display")
        .ThrowAsJavaScriptException();
  }

  const wl_registry_listener registry_listener = {
      .global        = handle_global,
      .global_remove = handle_global_remove,
  };

  WaylandData wdata{};

  wl_registry* registry = wl_display_get_registry(display);
  wl_registry_add_listener(registry, &registry_listener, &wdata);
  wl_display_roundtrip(display);
  wl_display_dispatch(display);

  if (!wdata.manager) {
    Napi::TypeError::New(env, "Compositor does not support the virtual pointer protocol!")
        .ThrowAsJavaScriptException();
  }

  if (!wdata.seat) {
    Napi::TypeError::New(env, "No seat found!").ThrowAsJavaScriptException();
  }

  std::cout << "Found seat" << std::endl;

  wdata.pointer =
      zwlr_virtual_pointer_manager_v1_create_virtual_pointer(wdata.manager, wdata.seat);

  std::cout << "Created virtual pointer" << std::endl;

  zwlr_virtual_pointer_v1_motion(wdata.pointer, 0, dx, dy);

  std::cout << "Sent motion event" << std::endl;

  wl_display_roundtrip(display);

  std::cout << "Moved pointer by " << dx << ", " << dy << std::endl;

  zwlr_virtual_pointer_v1_destroy(wdata.pointer);
  wl_seat_release(wdata.seat);
  wl_registry_destroy(registry);
  wl_display_disconnect(display);
}

void init(Napi::Env env, Napi::Object exports) {
  exports.Set("movePointer", Napi::Function::New(env, movePointer));
}

} // namespace move_pointer
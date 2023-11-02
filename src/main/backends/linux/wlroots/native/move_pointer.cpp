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

namespace move_pointer {

/* This struct holds all Wayland objects we need to move the pointer. */
struct WaylandData {
  wl_seat*                         seat    = nullptr;
  zwlr_virtual_pointer_manager_v1* manager = nullptr;
  zwlr_virtual_pointer_v1*         pointer = nullptr;
};

/**
 * This function is called whenever a new global Wayland object is available. We use it to
 * find the seat and the virtual pointer manager.
 */
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

/* We assume that no globals are removed during the (short) runtime of this utility. */
void handle_global_remove(void* data, wl_registry* registry, uint32_t name) {
}

/**
 * This function is called when the movePointer function is called from JavaScript. It
 * expects two numbers which are used for the relative movement of the pointer.
 * It connects to the Wayland display, finds the seat and the virtual pointer manager and
 * creates a virtual pointer device. Then it moves the pointer and destroys the virtual
 * pointer device again.
 * If something goes wrong, it throws a JavaScript exception.
 *
 * @param info The arguments passed to the movePointer function. It should contain two
 *             numbers.
 */
void movePointer(const Napi::CallbackInfo& info) {

  // We need to check the number of arguments and their types. If something is wrong, we
  // throw a JavaScript exception.
  Napi::Env env = info.Env();

  if (info.Length() != 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
    Napi::Error::New(env, "Two Numbers expected!").ThrowAsJavaScriptException();
    return;
  }

  auto dx = info[0].As<Napi::Number>().Int32Value();
  auto dy = info[1].As<Napi::Number>().Int32Value();

  std::cout << "Moving pointer by " << dx << ", " << dy << std::endl;

  // Connect to the Wayland display.
  wl_display* display = wl_display_connect(nullptr);
  if (!display) {
    Napi::Error::New(env, "Failed to get Wayland display!").ThrowAsJavaScriptException();
    return;
  }

  // Retrieve the global Wayland seat and the virtual pointer manager.
  wl_registry_listener registry_listener = {
      .global        = handle_global,
      .global_remove = handle_global_remove,
  };

  WaylandData wdata{};

  wl_registry* registry = wl_display_get_registry(display);
  wl_registry_add_listener(registry, &registry_listener, &wdata);
  wl_display_roundtrip(display);
  wl_display_dispatch(display);

  if (!wdata.manager) {
    Napi::Error::New(env, "No virtual pointer protocol!").ThrowAsJavaScriptException();
    return;
  }

  if (!wdata.seat) {
    Napi::Error::New(env, "No seat found!").ThrowAsJavaScriptException();
    return;
  }

  // Create a virtual pointer device and move the pointer.
  wdata.pointer =
      zwlr_virtual_pointer_manager_v1_create_virtual_pointer(wdata.manager, wdata.seat);

  zwlr_virtual_pointer_v1_motion(wdata.pointer, 0, dx, dy);
  wl_display_roundtrip(display);

  // Clean up.
  zwlr_virtual_pointer_v1_destroy(wdata.pointer);
  wl_seat_release(wdata.seat);
  wl_registry_destroy(registry);
  wl_display_disconnect(display);

  std::cout << "Moved pointer." << std::endl;
}

/**
 * This function is called when the module is loaded in Node.js. It registers the
 * movePointer function.
 */
void init(Napi::Env env, Napi::Object exports) {
  exports.Set("movePointer", Napi::Function::New(env, movePointer));
}

} // namespace move_pointer
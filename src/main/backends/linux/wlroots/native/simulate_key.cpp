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

namespace simulate_key {

/* This struct holds all Wayland objects we need to simulate key presses. */
struct WaylandData {
  wl_seat*                         seat            = nullptr;
  zwp_virtual_keyboard_manager_v1* manager         = nullptr;
  zwp_virtual_keyboard_v1*         virtualKeyboard = nullptr;
  wl_keyboard*                     realKeyboard    = nullptr;
};

/**
 * This function is called whenever a new global Wayland object is available. We use it to
 * find the seat and the virtual keyboard manager.
 */
void handle_global(void* data, struct wl_registry* registry, uint32_t name,
    const char* interface, uint32_t version) {

  WaylandData* wdata = static_cast<WaylandData*>(data);

  if (!std::strcmp(interface, wl_seat_interface.name)) {
    wdata->seat = static_cast<wl_seat*>(
        wl_registry_bind(registry, name, &wl_seat_interface, version <= 7 ? version : 7));

  } else if (!std::strcmp(interface, zwp_virtual_keyboard_manager_v1_interface.name)) {
    wdata->manager = static_cast<zwp_virtual_keyboard_manager_v1*>(
        wl_registry_bind(registry, name, &zwp_virtual_keyboard_manager_v1_interface, 1));
  }
}

/* We assume that no globals are removed during the (short) runtime of this utility. */
void handle_global_remove(void* data, wl_registry* registry, uint32_t name) {
}

void handle_keymap(
    void* data, wl_keyboard* keyboard, uint32_t format, int32_t fd, uint32_t size) {
  WaylandData* wdata = static_cast<WaylandData*>(data);

  zwp_virtual_keyboard_v1_keymap(wdata->virtualKeyboard, format, fd, size);
}

void simulateKey(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 2 || !info[0].IsNumber() || !info[1].IsBoolean()) {
    Napi::TypeError::New(env, "Number and Boolean expected").ThrowAsJavaScriptException();
  }

  int32_t keycode = info[0].As<Napi::Number>().Int32Value();
  bool    press   = info[1].As<Napi::Boolean>().Value();

  // Connect to the Wayland display.
  wl_display* display = wl_display_connect(nullptr);
  if (!display) {
    Napi::Error::New(env, "Failed to get Wayland display!").ThrowAsJavaScriptException();
    return;
  }

  // Retrieve the global Wayland seat and the virtual keyboard manager.
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
    Napi::Error::New(env, "No virtual keyboard protocol!").ThrowAsJavaScriptException();
    return;
  }

  if (!wdata.seat) {
    Napi::Error::New(env, "No seat found!").ThrowAsJavaScriptException();
    return;
  }

  // Create a virtual pointer device and move the pointer.
  wdata.virtualKeyboard =
      zwp_virtual_keyboard_manager_v1_create_virtual_keyboard(wdata.manager, wdata.seat);

  // Send the keymap.
  wl_keyboard_listener keyboard_listener = {
      .keymap      = handle_keymap,
      .enter       = [](void*, wl_keyboard*, uint32_t, wl_surface*, wl_array*) {},
      .leave       = [](void*, wl_keyboard*, uint32_t, wl_surface*) {},
      .key         = [](void*, wl_keyboard*, uint32_t, uint32_t, uint32_t, uint32_t) {},
      .modifiers   = [](void*, wl_keyboard*, uint32_t, uint32_t, uint32_t, uint32_t,
                       uint32_t) {},
      .repeat_info = [](void*, wl_keyboard*, int32_t, int32_t) {},
  };

  wdata.realKeyboard = wl_seat_get_keyboard(wdata.seat);
  wl_keyboard_add_listener(wdata.realKeyboard, &keyboard_listener, &wdata);
  wl_display_roundtrip(display);

  // Finally send the key event.
  zwp_virtual_keyboard_v1_key(wdata.virtualKeyboard, 0, keycode - 8,
      press ? WL_KEYBOARD_KEY_STATE_PRESSED : WL_KEYBOARD_KEY_STATE_RELEASED);
  wl_display_roundtrip(display);

  // Clean up.
  zwp_virtual_keyboard_v1_destroy(wdata.virtualKeyboard);
  wl_keyboard_destroy(wdata.realKeyboard);
  wl_seat_release(wdata.seat);
  wl_registry_destroy(registry);
  wl_display_disconnect(display);
}

void init(Napi::Env env, Napi::Object exports) {
  exports.Set("simulateKey", Napi::Function::New(env, simulateKey));
}

} // namespace simulate_key
//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#include "Native.hpp"

#include <iostream>

//////////////////////////////////////////////////////////////////////////////////////////

Native::Native(Napi::Env env, Napi::Object exports) {
  DefineAddon(
      exports, {
                   InstanceMethod("bindShortcut", &Native::bindShortcut),
                   InstanceMethod("unbindShortcut", &Native::unbindShortcut),
                   InstanceMethod("unbindAllShortcuts", &Native::unbindAllShortcuts),
               });
}

//////////////////////////////////////////////////////////////////////////////////////////

Native::~Native() {

  if (mData.mManager) {
    hyprland_global_shortcuts_manager_v1_destroy(mData.mManager);
  }

  if (mData.mRegistry) {
    wl_registry_destroy(mData.mRegistry);
  }

  if (mData.mDisplay) {
    wl_display_disconnect(mData.mDisplay);
  }

  // Stop polling the Wayland display.
  uv_poll_stop(&mPoller);
  uv_close(reinterpret_cast<uv_handle_t*>(&mPoller), nullptr);
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::init(Napi::Env const& env) {
  if (mData.mDisplay) {
    return;
  }

  // Connect to the Wayland display.
  mData.mDisplay = wl_display_connect(nullptr);
  if (!mData.mDisplay) {
    Napi::Error::New(env, "Failed to get Wayland display!").ThrowAsJavaScriptException();
    return;
  }

  // The 'global' callback will be called whenever a new global Wayland object is
  // available. We use it to find the global shortcuts manager.
  mData.mRegistryListener = {
      .global =
          [](void* userData, wl_registry* registry, uint32_t name, const char* interface,
              uint32_t version) {
            if (!std::strcmp(
                    interface, hyprland_global_shortcuts_manager_v1_interface.name)) {
              Native::WaylandData* data = static_cast<Native::WaylandData*>(userData);
              data->mManager = static_cast<hyprland_global_shortcuts_manager_v1*>(
                  wl_registry_bind(registry, name,
                      &hyprland_global_shortcuts_manager_v1_interface, version));
            }
          },
      .global_remove =
          [](void*, wl_registry*, uint32_t) {
            // We don't care about this.
          },
  };

  mData.mRegistry = wl_display_get_registry(mData.mDisplay);
  wl_registry_add_listener(mData.mRegistry, &mData.mRegistryListener, &mData);
  wl_display_roundtrip(mData.mDisplay);

  // Check if everything worked.
  if (!mData.mManager) {
    Napi::Error::New(env, "No global shortcuts protocol!").ThrowAsJavaScriptException();
    return;
  }

  // This contains the callback functions which will be called when a shortcut is pressed
  // or released. We use it to call the JavaScript function which was passed to the
  // bindShortcut function.
  mData.mShortcutListener = {
      .pressed =
          [](void*, hyprland_global_shortcut_v1* shortcut, uint32_t, uint32_t, uint32_t) {
            Napi::FunctionReference* action = static_cast<Napi::FunctionReference*>(
                hyprland_global_shortcut_v1_get_user_data(shortcut));
            action->Call({});
          },
      .released = [](void*, hyprland_global_shortcut_v1*, uint32_t, uint32_t,
                      uint32_t) {},
  };

  // We have to ensure that the Wayland display is polled regularly in order to receive
  // shortcuts events. We use libuv for this as this is the same library that is used by
  // Node.js.
  int        fd   = wl_display_get_fd(mData.mDisplay);
  uv_loop_t* loop = uv_default_loop();
  uv_poll_init(loop, &mPoller, fd);
  mPoller.data = &mData;
  uv_poll_start(&mPoller, UV_READABLE, [](uv_poll_t* handle, int status, int events) {
    Native::WaylandData* data = static_cast<Native::WaylandData*>(handle->data);
    wl_display_dispatch(data->mDisplay);
  });
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::bindShortcut(const Napi::CallbackInfo& info) {

  // We need to check the number of arguments and their types. If something is wrong, we
  // throw a JavaScript exception.
  Napi::Env env = info.Env();

  if (info.Length() != 1 || !info[0].IsObject() ||
      !isShortcutObject(info[0].As<Napi::Object>())) {
    Napi::Error::New(env, "Shortcut object expected!").ThrowAsJavaScriptException();
    return;
  }

  // Make sure that we are connected to the Wayland display.
  init(env);

  // Get the shortcut data from the JavaScript object. We store the action function in a
  // Napi::Persistent object to make sure that it is not garbage collected.
  std::string id = info[0].As<Napi::Object>().Get("trigger").ToString();
  mShortcuts[id].mAction =
      Napi::Persistent(info[0].As<Napi::Object>().Get("action").As<Napi::Function>());

  // Register the shortcut with the Wayland display.
  auto shortcut = hyprland_global_shortcuts_manager_v1_register_shortcut(
      mData.mManager, id.c_str(), "kando", "Kando", "");

  // Add the callback functions to the shortcut.
  hyprland_global_shortcut_v1_add_listener(shortcut, &mData.mShortcutListener, nullptr);
  hyprland_global_shortcut_v1_set_user_data(shortcut, &mShortcuts[id].mAction);
  wl_display_roundtrip(mData.mDisplay);

  // Store the shortcut in our map so that we can destroy it later.
  mShortcuts[id].mShortcut = shortcut;
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::unbindShortcut(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // We need to check the number of arguments and their types. If something is wrong, we
  // throw a JavaScript exception.
  if (info.Length() != 1 || !info[0].IsObject() ||
      !isShortcutObject(info[0].As<Napi::Object>())) {
    Napi::Error::New(env, "Shortcut object expected!").ThrowAsJavaScriptException();
    return;
  }

  // Make sure that we are connected to the Wayland display.
  init(env);

  std::string id = info[0].As<Napi::Object>().Get("id").ToString();

  auto it = mShortcuts.find(id);
  if (it != mShortcuts.end()) {
    hyprland_global_shortcut_v1_destroy(it->second.mShortcut);
    mShortcuts.erase(it);
  }

  wl_display_roundtrip(mData.mDisplay);
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::unbindAllShortcuts(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // We need to check the number of arguments and their types. If something is wrong, we
  // throw a JavaScript exception.
  if (info.Length() != 0) {
    Napi::TypeError::New(env, "No argument expected").ThrowAsJavaScriptException();
  }

  // Make sure that we are connected to the Wayland display.
  init(env);

  for (auto& it : mShortcuts) {
    hyprland_global_shortcut_v1_destroy(it.second.mShortcut);
  }

  mShortcuts.clear();

  wl_display_roundtrip(mData.mDisplay);
}

//////////////////////////////////////////////////////////////////////////////////////////

bool Native::isShortcutObject(Napi::Object const& obj) const {

  if (!obj.Has("trigger") || !obj.Has("action")) {
    return false;
  }

  if (!obj.Get("trigger").IsString() || !obj.Get("action").IsFunction()) {
    return false;
  }

  return true;
}

//////////////////////////////////////////////////////////////////////////////////////////

// This generates the addon and makes it available to JavaScript.
NODE_API_ADDON(Native)

//////////////////////////////////////////////////////////////////////////////////////////
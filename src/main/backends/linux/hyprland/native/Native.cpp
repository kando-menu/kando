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

namespace {

// This function will be called whenever a new global Wayland object is available. We
// use it to find the seat and the virtual pointer manager.
void handleGlobal(void* userData, wl_registry* registry, uint32_t name,
    const char* interface, uint32_t version) {
  Native::WaylandData* data = static_cast<Native::WaylandData*>(userData);

  // Store the global shortcuts manager.
  if (!std::strcmp(interface, hyprland_global_shortcuts_manager_v1_interface.name)) {
    data->mManager = static_cast<hyprland_global_shortcuts_manager_v1*>(wl_registry_bind(
        registry, name, &hyprland_global_shortcuts_manager_v1_interface, 1));
  }
};

void handlePressed(void*, hyprland_global_shortcut_v1* hyprland_global_shortcut, uint32_t,
    uint32_t, uint32_t) {

  Napi::FunctionReference* action = static_cast<Napi::FunctionReference*>(
      hyprland_global_shortcut_v1_get_user_data(hyprland_global_shortcut));

  action->Call({});
}

void handleReleased(
    void*, hyprland_global_shortcut_v1* shortcut, uint32_t, uint32_t, uint32_t) {
  std::cout << "Released " << std::endl;
}

const hyprland_global_shortcut_v1_listener shortcutListener = {
    .pressed  = handlePressed,
    .released = handleReleased,
};

const wl_registry_listener registryListener = {
    .global        = handleGlobal,
    .global_remove = [](void*, wl_registry*, uint32_t) {},
};

} // namespace

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

  mData.mRegistry = wl_display_get_registry(mData.mDisplay);
  wl_registry_add_listener(mData.mRegistry, &registryListener, &mData);
  wl_display_roundtrip(mData.mDisplay);

  // Check if everything worked.
  if (!mData.mManager) {
    Napi::Error::New(env, "No global shortcuts protocol!").ThrowAsJavaScriptException();
    return;
  }

  // We have to ensure that the Wayland display is polled regularly in order to receive
  // shortcuts events. We use libuv for this as this is the same library that is used by
  // Node.js.
  int fd = wl_display_get_fd(mData.mDisplay);

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

  std::string id          = info[0].As<Napi::Object>().Get("id").ToString();
  std::string description = info[0].As<Napi::Object>().Get("description").ToString();
  mData.mActions[id] =
      Napi::Persistent(info[0].As<Napi::Object>().Get("action").As<Napi::Function>());

  auto shortcut = hyprland_global_shortcuts_manager_v1_register_shortcut(
      mData.mManager, id.c_str(), "kando", description.c_str(), "");

  hyprland_global_shortcut_v1_add_listener(shortcut, &shortcutListener, nullptr);
  hyprland_global_shortcut_v1_set_user_data(shortcut, &mData.mActions[id]);

  wl_display_roundtrip(mData.mDisplay);
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

  std::string id = info[0].As<Napi::Object>().Get("id").ToString();

  std::cout << "Unbinding shortcut " << id << std::endl;

  // Make sure that we are connected to the Wayland display.
  init(env);
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::unbindAllShortcuts(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // We need to check the number of arguments and their types. If something is wrong, we
  // throw a JavaScript exception.
  if (info.Length() != 0) {
    Napi::TypeError::New(env, "No argument expected").ThrowAsJavaScriptException();
  }

  std::cout << "Unbinding all shortcuts" << std::endl;

  // Make sure that we are connected to the Wayland display.
  init(env);
}

//////////////////////////////////////////////////////////////////////////////////////////

bool Native::isShortcutObject(Napi::Object const& obj) const {

  if (!obj.Has("id") || !obj.Has("description") || !obj.Has("accelerator") ||
      !obj.Has("action")) {
    return false;
  }

  if (!obj.Get("id").IsString() || !obj.Get("description").IsString() ||
      !obj.Get("accelerator").IsString() || !obj.Get("action").IsFunction()) {
    return false;
  }

  return true;
}

//////////////////////////////////////////////////////////////////////////////////////////

// This generates the addon and makes it available to JavaScript.
NODE_API_ADDON(Native)

//////////////////////////////////////////////////////////////////////////////////////////
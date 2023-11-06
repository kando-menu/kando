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

void handlePressed(void* data, hyprland_global_shortcut_v1* hyprland_global_shortcut_v1,
    uint32_t tv_sec_hi, uint32_t tv_sec_lo, uint32_t tv_nsec) {
  std::cout << "Pressed " << std::endl;
}

void handleReleased(void* data, hyprland_global_shortcut_v1* hyprland_global_shortcut_v1,
    uint32_t tv_sec_hi, uint32_t tv_sec_lo, uint32_t tv_nsec) {
  std::cout << "Released " << std::endl;
}

const hyprland_global_shortcut_v1_listener shortcut_listener = {
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

  wl_display_roundtrip(mData.mDisplay);
  auto shortcut = hyprland_global_shortcuts_manager_v1_register_shortcut(
      mData.mManager, id.c_str(), "kando", description.c_str(), "");

  wl_display_roundtrip(mData.mDisplay);
  hyprland_global_shortcut_v1_add_listener(shortcut, &shortcut_listener, &mData);

  wl_display_roundtrip(mData.mDisplay);

  std::cout << "Done" << std::endl;
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
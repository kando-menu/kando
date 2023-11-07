//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#ifndef NATIVE_HPP
#define NATIVE_HPP

#include "hyprland-global-shortcuts-v1.h"

#include <napi.h>
#include <unordered_map>
#include <uv.h>

/**
 * This native addon provides a way to register global shortcuts on Hyprland. It uses
 * the hyprland-global-shortcuts-v1 Wayland protocol for this.
 */
class Native : public Napi::Addon<Native> {
 public:
  Native(Napi::Env env, Napi::Object exports);
  virtual ~Native();

 protected:
  /**
   * This establishes a connection to the Wayland display and initializes all the members
   * of mData. It will be called when any of the JavaScript methods is called for the
   * first time.
   */
  virtual void init(Napi::Env const& env);

 private:
  /**
   * This function is called when the bindShortcut function is called from JavaScript.
   *
   * @param info The arguments passed to the bindShortcut function. It should contain a
   *             Shortcut object as defined in the base Backend interface.
   */
  void bindShortcut(const Napi::CallbackInfo& info);

  /**
   * This function is called when the unbindShortcut function is called from JavaScript.
   *
   * @param info The arguments passed to the unbindShortcut function. It should contain a
   *             Shortcut object as defined in the base Backend interface.
   */
  void unbindShortcut(const Napi::CallbackInfo& info);

  /**
   * This function is called when the unbindAllShortcuts function is called from
   * JavaScript.
   *
   * @param info The arguments passed to the unbindAllShortcuts function. It should be
   *             empty.
   */
  void unbindAllShortcuts(const Napi::CallbackInfo& info);

  bool isShortcutObject(Napi::Object const& obj) const;

  /**
   * This struct contains all the data required to communicate with the Wayland display.
   */
  struct WaylandData {
    wl_display*          mDisplay  = nullptr;
    wl_registry*         mRegistry = nullptr;
    wl_registry_listener mRegistryListener{};

    hyprland_global_shortcuts_manager_v1* mManager = nullptr;
    hyprland_global_shortcut_v1_listener  mShortcutListener{};
  };

  /**
   * This struct contains all the data required to handle a single shortcut.
   */
  struct ShortcutData {
    hyprland_global_shortcut_v1* mShortcut;
    Napi::FunctionReference      mAction;
  };

  WaylandData                                   mData{};
  std::unordered_map<std::string, ShortcutData> mShortcuts;

  // This is used to listen for Wayland events in a non-blocking way.
  uv_poll_t mPoller{};
};

#endif // NATIVE_HPP
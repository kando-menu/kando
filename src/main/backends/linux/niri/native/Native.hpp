//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Louis Dalibard <ontake@ontake.dev>
// SPDX-License-Identifier: MIT

#ifndef NATIVE_HPP
#define NATIVE_HPP

#include "wlr-layer-shell-unstable-v1.h"
#include "xdg-shell.h"

#include <napi.h>

/**
 * This native addon provides a way to get the pointer's position and work area size without relying on IPCs by spawning an wlr_layer_shell overlay surface
 * It uses the wlr-layer-shell-v1 Wayland protocol for this.
 */
class Native : public Napi::Addon<Native> {
 public:
  Native(Napi::Env env, Napi::Object exports);
  virtual ~Native();

  /**
   * This struct contains all the data required to communicate with the Wayland display.
   */
  struct WaylandData {
    wl_display*            mDisplay      = nullptr;
    wl_registry*           mRegistry     = nullptr;
    wl_compositor*         mCompositor   = nullptr;
    wl_seat*               mSeat         = nullptr;
    wl_pointer*            mPointer      = nullptr;
    zwlr_layer_shell_v1*   mLayerShell   = nullptr;
    zwlr_layer_surface_v1* mLayerSurface = nullptr;
    wl_surface*            mSurface      = nullptr;
    wl_shm*                mShm          = nullptr;

    wl_buffer* buffer = nullptr; // Color buffer for debugging

    // Pointer position communication
    double pointerX = 0;
    double pointerY = 0;

    // work area size communication
    double workAreaW = 0;
    double workAreaH = 0;

    // Track whether a pointer event has been received (used for blocking wait)
    bool pointerEventReceived = false;

    // Registry listener
    wl_registry_listener mRegistryListener{};
  };

 protected:
  /**
   * This establishes a connection to the Wayland display and initializes all the members
   * of mData. It will be called when any of the JavaScript methods is called for the
   * first time.
   */
  virtual void init(Napi::Env const& env);

 private:
  /**
   * This function gets the pointer's location and work area size by spawning a wlr layer shell surface,
   * waiting for the event, then cleaning up.
   */
  Napi::Value getPointerPositionAndWorkAreaSize(const Napi::CallbackInfo& info);

  void createSurfaceAndPointer();
  void destroySurfaceAndPointer();

  WaylandData mData{};
};

#endif // NATIVE_HPP

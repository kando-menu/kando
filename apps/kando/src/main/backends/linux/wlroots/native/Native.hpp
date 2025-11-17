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

#include "virtual-keyboard-unstable-v1.h"
#include "wlr-layer-shell-unstable-v1.h"
#include "wlr-virtual-pointer-unstable-v1.h"
#include "xdg-shell.h"

#include <napi.h>
#include <xkbcommon/xkbcommon.h>

/**
 * This class allows moving the mouse pointer and simulating key presses using the
 * virtual-pointer and virtual-keyboard Wayland protocols. It also provides a method for
 * getting the current mouse position and work area size using the wlr-layer-shell
 * protocol. See index.ts for more information regarding the exposed functions.
 *
 * The sending of key events is a little bit more complicated than I would like it to be.
 * As far as I understand, the virtual-keyboard protocol requires that the client (we)
 * keeps track of the current modifier state. This means, we have to somehow check which
 * scan codes map to which modifier keys and keep track of which modifiers are currently
 * pressed. This is done using the xkbcommon library using the keymap we can get from the
 * real keyboard.
 *
 * The getting of the pointer's position and work area size is only supported on Wayland
 * compositors implementing the wlr-layer-shell protocol. Also, it requires that the
 * compositor automatically sends a pointer-enter event when the surface is created.
 * It seems that for instance Niri does this, but Hyprland does not. Hence, on Hyprland,
 * the method will block until the user moves the pointer.
 */
class Native : public Napi::Addon<Native> {
 public:
  Native(Napi::Env env, Napi::Object exports);
  virtual ~Native();

 protected:
  /**
   * This establishes a connection to the Wayland display and initializes all the members
   * of mData. It will be called when movePointer() and simulateKey() is called for the
   * first time.
   */
  virtual void init(Napi::Env const& env);

 private:
  /**
   * This function is called when the movePointer function is called from JavaScript. It
   * expects two numbers which are used for the relative movement of the pointer.
   * If something goes wrong, it throws a JavaScript exception.
   *
   * @param info The arguments passed to the movePointer function. It should contain two
   *             numbers.
   */
  void movePointer(const Napi::CallbackInfo& info);

  /**
   * This function is called when the simulateKey function is called from JavaScript. It
   * expects a number which is used as the scan code of the key to be pressed and a
   * boolean which indicates whether the key should be pressed or released.
   * If something goes wrong, it throws a JavaScript exception.
   *
   * @param info The arguments passed to the simulateKey function. It should contain a
   *             number and a boolean.
   */
  void simulateKey(const Napi::CallbackInfo& info);

  /**
   * This function gets the pointer's location and work area size by spawning a wlr layer
   * shell surface, waiting for the event, then cleaning up.
   *
   * @param info The arguments passed to the getPointerPositionAndWorkAreaSize function.
   *             It does not expect any arguments.
   * @return A JavaScript object containing the pointer's x and y coordinates and the
   *         work area width and height.
   */
  Napi::Value getPointerPositionAndWorkAreaSize(const Napi::CallbackInfo& info);

  /**
   * Creates the Wayland surface and initializes pointer tracking.
   *
   * This function sets up the surface using the bound Wayland interfaces
   * and prepares to receive pointer input events.
   */
  void createSurfaceAndPointer();

  /**
   * Destroys the Wayland surface and cleans up pointer resources.
   *
   * This function tears down the created surface and releases any
   * associated Wayland resources used for pointer handling.
   */
  void destroySurfaceAndPointer();

  struct WaylandData {
    wl_display*    mDisplay    = nullptr;
    wl_registry*   mRegistry   = nullptr;
    wl_compositor* mCompositor = nullptr;
    wl_seat*       mSeat       = nullptr;

    wl_registry_listener mRegistryListener{};

    zwlr_virtual_pointer_manager_v1* mPointerManager = nullptr;
    zwlr_virtual_pointer_v1*         mVirtualPointer = nullptr;

    zwp_virtual_keyboard_manager_v1* mKeyboardManager = nullptr;
    zwp_virtual_keyboard_v1*         mVirtualKeyboard = nullptr;

    xkb_context* mXkbContext = xkb_context_new(XKB_CONTEXT_NO_FLAGS);
    xkb_keymap*  mXkbKeymap  = nullptr;
    xkb_state*   mXkbState   = nullptr;

    wl_pointer*            mPointer      = nullptr;
    zwlr_layer_shell_v1*   mLayerShell   = nullptr;
    zwlr_layer_surface_v1* mLayerSurface = nullptr;
    wl_surface*            mSurface      = nullptr;
    wl_shm*                mShm          = nullptr;
    wl_buffer*             mPixelBuffer  = nullptr;

    double mPointerX       = 0;
    double mPointerY       = 0;
    double mWorkAreaWidth  = 0;
    double mWorkAreaHeight = 0;

    // Track whether a pointer event has been received (used for blocking wait).
    bool mPointerEventReceived = false;
  };

  WaylandData mData{};
};

#endif // NATIVE_HPP

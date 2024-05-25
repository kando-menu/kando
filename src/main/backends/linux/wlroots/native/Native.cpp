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
#include <sys/mman.h>
#include <unistd.h>

//////////////////////////////////////////////////////////////////////////////////////////

Native::Native(Napi::Env env, Napi::Object exports) {
  DefineAddon(exports, {
                           InstanceMethod("movePointer", &Native::movePointer),
                           InstanceMethod("simulateKey", &Native::simulateKey),
                       });
}

//////////////////////////////////////////////////////////////////////////////////////////

Native::~Native() {
  if (mData.mPointer) {
    zwlr_virtual_pointer_v1_destroy(mData.mPointer);
  }

  if (mData.mKeyboard) {
    zwp_virtual_keyboard_v1_destroy(mData.mKeyboard);
  }

  if (mData.mSeat) {
    wl_seat_release(mData.mSeat);
  }

  if (mData.mRegistry) {
    wl_registry_destroy(mData.mRegistry);
  }

  if (mData.mDisplay) {
    wl_display_disconnect(mData.mDisplay);
  }

  if (mData.mXkbContext) {
    xkb_context_unref(mData.mXkbContext);
  }

  if (mData.mXkbKeymap) {
    xkb_keymap_unref(mData.mXkbKeymap);
  }

  if (mData.mXkbState) {
    xkb_state_unref(mData.mXkbState);
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

  // This function will be called whenever a new global Wayland object is available. We
  // use it to find the seat and the virtual pointer manager.
  auto handleGlobal = [](void* userData, wl_registry* registry, uint32_t name,
                          const char* interface, uint32_t version) {
    WaylandData* data = static_cast<WaylandData*>(userData);

    // Store a reference to the seat.
    if (!std::strcmp(interface, wl_seat_interface.name)) {
      data->mSeat = static_cast<wl_seat*>(wl_registry_bind(
          registry, name, &wl_seat_interface, version <= 7 ? version : 7));
    }

    // Store a reference to the virtual pointer manager.
    if (!std::strcmp(interface, zwlr_virtual_pointer_manager_v1_interface.name)) {
      data->mPointerManager =
          static_cast<zwlr_virtual_pointer_manager_v1*>(wl_registry_bind(
              registry, name, &zwlr_virtual_pointer_manager_v1_interface, 1));
    }

    // If the virtual pointer manager and the seat are available, create a virtual pointer
    // device.
    if (!data->mPointer && data->mPointerManager && data->mSeat) {
      data->mPointer = zwlr_virtual_pointer_manager_v1_create_virtual_pointer(
          data->mPointerManager, data->mSeat);
    }

    // Store a reference to the virtual keyboard manager.
    if (!std::strcmp(interface, zwp_virtual_keyboard_manager_v1_interface.name)) {
      data->mKeyboardManager =
          static_cast<zwp_virtual_keyboard_manager_v1*>(wl_registry_bind(
              registry, name, &zwp_virtual_keyboard_manager_v1_interface, 1));
    }

    // If the virtual keyboard manager and the seat are available, create a virtual
    // keyboard device.
    if (!data->mKeyboard && data->mKeyboardManager && data->mSeat) {
      data->mKeyboard = zwp_virtual_keyboard_manager_v1_create_virtual_keyboard(
          data->mKeyboardManager, data->mSeat);

      // AFICS, we have to keep track of the current pressed modifier keys ourselves. We
      // can do this using the xkbcommon library. For this, we need to get the keymap from
      // the real keyboard.
      // The code below retrieves the keymap from the real keyboard and creates a
      // corresponding xkb_state object and also forwards the keymap to the virtual
      // keyboard.
      wl_keyboard_listener keyboardListener = {
          .keymap =
              [](void* userData, wl_keyboard* keyboard, uint32_t format, int32_t fd,
                  uint32_t size) {
                // Map the keymap file into memory.
                auto mappedKeymap =
                    static_cast<char*>(mmap(NULL, size, PROT_READ, MAP_SHARED, fd, 0));

                if (mappedKeymap == MAP_FAILED) {
                  close(fd);
                  std::cerr << "Unable to mmap keymap!" << std::endl;
                  return;
                }

                if (format != WL_KEYBOARD_KEYMAP_FORMAT_XKB_V1) {
                  munmap(mappedKeymap, size);
                  close(fd);
                  std::cerr << "Got invalid keymap format!" << std::endl;
                  return;
                }

                // Create the xkb_state object for this keymap.
                WaylandData* data = static_cast<WaylandData*>(userData);
                data->mXkbKeymap  = xkb_keymap_new_from_string(data->mXkbContext,
                     mappedKeymap, XKB_KEYMAP_FORMAT_TEXT_V1, XKB_KEYMAP_COMPILE_NO_FLAGS);
                data->mXkbState   = xkb_state_new(data->mXkbKeymap);

                munmap(mappedKeymap, size);

                // Forward the keymap to the virtual keyboard.
                zwp_virtual_keyboard_v1_keymap(data->mKeyboard, format, fd, size);
              },
          // The other callbacks are not needed.
          .enter     = [](void*, wl_keyboard*, uint32_t, wl_surface*, wl_array*) {},
          .leave     = [](void*, wl_keyboard*, uint32_t, wl_surface*) {},
          .key       = [](void*, wl_keyboard*, uint32_t, uint32_t, uint32_t, uint32_t) {},
          .modifiers = [](void*, wl_keyboard*, uint32_t, uint32_t, uint32_t, uint32_t,
                           uint32_t) {},
          .repeat_info = [](void*, wl_keyboard*, int32_t, int32_t) {},
      };

      // Get the real keyboard and add the keyboard listener to it. The roundtrip below
      // will call the keymap callback above. Finally, we destroy the real keyboard again.
      auto realKeyboard = wl_seat_get_keyboard(data->mSeat);
      wl_keyboard_add_listener(realKeyboard, &keyboardListener, data);
      wl_display_roundtrip(data->mDisplay);
      wl_keyboard_destroy(realKeyboard);
    }
  };

  // We register the above lambda as a listener for global objects. The roundtrip below
  // will call the lambda for all currently available global objects.
  mData.mRegistryListener = {
      .global        = handleGlobal,
      .global_remove = [](void*, wl_registry*, uint32_t) {},
  };

  mData.mRegistry = wl_display_get_registry(mData.mDisplay);
  wl_registry_add_listener(mData.mRegistry, &mData.mRegistryListener, &mData);
  wl_display_roundtrip(mData.mDisplay);
  wl_display_dispatch(mData.mDisplay);

  // Check if everything worked.
  if (!mData.mSeat) {
    Napi::Error::New(env, "No seat found!").ThrowAsJavaScriptException();
    return;
  }

  if (!mData.mPointer) {
    Napi::Error::New(env, "No virtual pointer protocol!").ThrowAsJavaScriptException();
    return;
  }

  if (!mData.mKeyboard) {
    Napi::Error::New(env, "No virtual keyboard protocol!").ThrowAsJavaScriptException();
    return;
  }
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::movePointer(const Napi::CallbackInfo& info) {

  // We need to check the number of arguments and their types. If something is wrong, we
  // throw a JavaScript exception.
  Napi::Env env = info.Env();

  if (info.Length() != 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
    Napi::Error::New(env, "Two Numbers expected!").ThrowAsJavaScriptException();
    return;
  }

  int32_t dx = info[0].As<Napi::Number>().Int32Value();
  int32_t dy = info[1].As<Napi::Number>().Int32Value();

  // Make sure that we are connected to the Wayland display.
  init(env);

  // Send the relative pointer motion event.
  zwlr_virtual_pointer_v1_motion(
      mData.mPointer, 0, wl_fixed_from_int(dx), wl_fixed_from_int(dy));
  zwlr_virtual_pointer_v1_frame(mData.mPointer);
  wl_display_roundtrip(mData.mDisplay);
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::simulateKey(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // We need to check the number of arguments and their types. If something is wrong, we
  // throw a JavaScript exception.
  if (info.Length() != 2 || !info[0].IsNumber() || !info[1].IsBoolean()) {
    Napi::TypeError::New(env, "Number and Boolean expected").ThrowAsJavaScriptException();
  }

  int32_t keycode = info[0].As<Napi::Number>().Int32Value();
  bool    press   = info[1].As<Napi::Boolean>().Value();

  // Make sure that we are connected to the Wayland display.
  init(env);

  // Update the modifier state.
  xkb_state_component changedMods =
      xkb_state_update_key(mData.mXkbState, keycode, press ? XKB_KEY_DOWN : XKB_KEY_UP);

  // If the modifier state changed, we send a modifier event.
  if (changedMods) {
    zwp_virtual_keyboard_v1_modifiers(mData.mKeyboard,
        xkb_state_serialize_mods(mData.mXkbState, XKB_STATE_MODS_DEPRESSED),
        xkb_state_serialize_mods(mData.mXkbState, XKB_STATE_MODS_LATCHED),
        xkb_state_serialize_mods(mData.mXkbState, XKB_STATE_MODS_LOCKED),
        xkb_state_serialize_layout(mData.mXkbState, XKB_STATE_LAYOUT_EFFECTIVE));
  }

  // Finally send the key event itself.
  zwp_virtual_keyboard_v1_key(mData.mKeyboard, 0, keycode - 8,
      press ? WL_KEYBOARD_KEY_STATE_PRESSED : WL_KEYBOARD_KEY_STATE_RELEASED);

  // Make sure that the event is sent.
  wl_display_roundtrip(mData.mDisplay);
}

//////////////////////////////////////////////////////////////////////////////////////////

// This generates the addon and makes it available to JavaScript.
NODE_API_ADDON(Native)

//////////////////////////////////////////////////////////////////////////////////////////
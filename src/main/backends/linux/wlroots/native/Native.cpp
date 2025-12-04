//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#include "Native.hpp"

#include <cstring>
#include <fcntl.h>
#include <iostream>
#include <poll.h>
#include <sys/mman.h>
#include <unistd.h>

//////////////////////////////////////////////////////////////////////////////////////////

namespace {

// Create an anonymous shared memory file descriptor for the debug color buffer.
int createSharedMemoryFile() {
  const char* name = "/kando-shm-buffer";
  int         fd   = shm_open(name, O_RDWR | O_CREAT | O_EXCL, 0600);
  if (fd >= 0) {
    shm_unlink(name);
    return fd;
  }

  // Fallback: create a tmpfile
  fd = memfd_create("kando-shm-buffer", 0);
  return fd;
}

// Create wl_shm pool and buffer with given size, filled with solid color.
wl_buffer* createPixelBuffer(wl_shm* shm, int width, int height, uint32_t color) {
  const int stride = width * 4;
  const int size   = stride * height;

  int fd = createSharedMemoryFile();
  if (fd < 0) {
    std::cerr << "Failed to create shm fd\n";
    return nullptr;
  }

  if (ftruncate(fd, size) < 0) {
    std::cerr << "Failed to set shm size\n";
    close(fd);
    return nullptr;
  }

  void* data = mmap(nullptr, size, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
  if (data == MAP_FAILED) {
    std::cerr << "Failed to mmap shm\n";
    close(fd);
    return nullptr;
  }

  // Fill buffer with the given color (ARGB in 32-bit little endian)
  uint32_t* pixels = (uint32_t*)data;
  for (int i = 0; i < width * height; ++i) {
    pixels[i] = color;
  }

  wl_shm_pool* pool = wl_shm_create_pool(shm, fd, size);
  wl_buffer*   buffer =
      wl_shm_pool_create_buffer(pool, 0, width, height, stride, WL_SHM_FORMAT_ARGB8888);
  wl_shm_pool_destroy(pool);
  munmap(data, size);
  close(fd);

  return buffer;
}
} // namespace

//////////////////////////////////////////////////////////////////////////////////////////

Native::Native(Napi::Env env, Napi::Object exports) {
  DefineAddon(exports, {
                           InstanceMethod("movePointer", &Native::movePointer),
                           InstanceMethod("simulateKey", &Native::simulateKey),
                           InstanceMethod("getPointerPositionAndWorkAreaSize",
                               &Native::getPointerPositionAndWorkAreaSize),
                       });
}

//////////////////////////////////////////////////////////////////////////////////////////

Native::~Native() {
  if (mData.mVirtualPointer) {
    zwlr_virtual_pointer_v1_destroy(mData.mVirtualPointer);
  }

  if (mData.mVirtualKeyboard) {
    zwp_virtual_keyboard_v1_destroy(mData.mVirtualKeyboard);
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

  if (mData.mPixelBuffer) {
    wl_buffer_destroy(mData.mPixelBuffer);
  }

  if (mData.mPointer) {
    wl_pointer_destroy(mData.mPointer);
  }

  if (mData.mLayerSurface) {
    zwlr_layer_surface_v1_destroy(mData.mLayerSurface);
  }

  if (mData.mSurface) {
    wl_surface_destroy(mData.mSurface);
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

    if (strcmp(interface, wl_compositor_interface.name) == 0) {
      data->mCompositor = static_cast<wl_compositor*>(
          wl_registry_bind(registry, name, &wl_compositor_interface,
              4)); // this has to be v4 (this is the version Niri uses)
    } else if (strcmp(interface, wl_seat_interface.name) == 0) {
      data->mSeat =
          static_cast<wl_seat*>(wl_registry_bind(registry, name, &wl_seat_interface,
              4)); // this has to be v4 (this is the version Niri uses)
    } else if (strcmp(interface, zwlr_layer_shell_v1_interface.name) == 0) {
      data->mLayerShell = static_cast<zwlr_layer_shell_v1*>(
          wl_registry_bind(registry, name, &zwlr_layer_shell_v1_interface,
              4)); // this has to be v4 (this is the version Niri uses)
    } else if (strcmp(interface, wl_shm_interface.name) == 0) {
      data->mShm =
          static_cast<wl_shm*>(wl_registry_bind(registry, name, &wl_shm_interface, 1));
    }

    // Store a reference to the virtual pointer manager.
    if (!std::strcmp(interface, zwlr_virtual_pointer_manager_v1_interface.name)) {
      data->mPointerManager =
          static_cast<zwlr_virtual_pointer_manager_v1*>(wl_registry_bind(
              registry, name, &zwlr_virtual_pointer_manager_v1_interface, 1));
    }

    // If the virtual pointer manager and the seat are available, create a virtual pointer
    // device.
    if (!data->mVirtualPointer && data->mPointerManager && data->mSeat) {
      data->mVirtualPointer = zwlr_virtual_pointer_manager_v1_create_virtual_pointer(
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
    if (!data->mVirtualKeyboard && data->mKeyboardManager && data->mSeat) {
      data->mVirtualKeyboard = zwp_virtual_keyboard_manager_v1_create_virtual_keyboard(
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
                zwp_virtual_keyboard_v1_keymap(data->mVirtualKeyboard, format, fd, size);
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
  wl_display_dispatch_pending(mData.mDisplay);
  wl_display_flush(mData.mDisplay);

  // Check if everything worked.
  if (!mData.mSeat) {
    Napi::Error::New(env, "No seat found!").ThrowAsJavaScriptException();
    return;
  }

  if (!mData.mVirtualPointer) {
    Napi::Error::New(env, "No virtual pointer protocol!").ThrowAsJavaScriptException();
    return;
  }

  if (!mData.mVirtualKeyboard) {
    Napi::Error::New(env, "No virtual keyboard protocol!").ThrowAsJavaScriptException();
    return;
  }

  if (!mData.mCompositor) {
    Napi::Error::New(env, "Failed to bind wl_compositor interface.")
        .ThrowAsJavaScriptException();
    return;
  }
  if (!mData.mLayerShell) {
    Napi::Error::New(env, "Failed to bind zwlr_layer_shell_v1 interface.")
        .ThrowAsJavaScriptException();
    return;
  }
  if (!mData.mSeat) {
    Napi::Error::New(env, "Failed to bind wl_seat interface.")
        .ThrowAsJavaScriptException();
    return;
  }
  if (!mData.mShm) {
    Napi::Error::New(env, "Failed to bind wl_shm interface.")
        .ThrowAsJavaScriptException();
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
      mData.mVirtualPointer, 0, wl_fixed_from_int(dx), wl_fixed_from_int(dy));
  zwlr_virtual_pointer_v1_frame(mData.mVirtualPointer);
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
    zwp_virtual_keyboard_v1_modifiers(mData.mVirtualKeyboard,
        xkb_state_serialize_mods(mData.mXkbState, XKB_STATE_MODS_DEPRESSED),
        xkb_state_serialize_mods(mData.mXkbState, XKB_STATE_MODS_LATCHED),
        xkb_state_serialize_mods(mData.mXkbState, XKB_STATE_MODS_LOCKED),
        xkb_state_serialize_layout(mData.mXkbState, XKB_STATE_LAYOUT_EFFECTIVE));
  }

  // Finally send the key event itself.
  zwp_virtual_keyboard_v1_key(mData.mVirtualKeyboard, 0, keycode - 8,
      press ? WL_KEYBOARD_KEY_STATE_PRESSED : WL_KEYBOARD_KEY_STATE_RELEASED);

  // Make sure that the event is sent.
  wl_display_roundtrip(mData.mDisplay);
}

//////////////////////////////////////////////////////////////////////////////////////////

Napi::Value Native::getPointerPositionAndWorkAreaSize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  // Ensure Wayland is initialized
  if (!mData.mDisplay) {
    init(env);
    if (!mData.mDisplay)
      return env.Null();
  }

  // Create surface and pointer listener
  createSurfaceAndPointer();
  if (!mData.mSurface || !mData.mPointer) {
    destroySurfaceAndPointer();
    return env.Null();
  }

  int fd                      = wl_display_get_fd(mData.mDisplay);
  mData.mPointerEventReceived = false;

  int timeoutMs = 500;
  using clock = std::chrono::steady_clock;
  auto start = clock::now();
  bool mPointerGetTimedOut = false;
  while (!mData.mPointerEventReceived) {
    // Process any pending events first
    wl_display_dispatch_pending(mData.mDisplay);

    // Check if timeout already expired
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(clock::now() - start).count();
    if (elapsed > timeoutMs) {
      mPointerGetTimedOut = true;
      wl_display_flush(mData.mDisplay);
      break;
    }

    // Prepare to read new events
    if (wl_display_prepare_read(mData.mDisplay) != 0) {
      // In case of error, flush and continue
      wl_display_flush(mData.mDisplay);
      continue;
    }

    // Flush requests to compositor
    wl_display_flush(mData.mDisplay);

    // Wait for events on the Wayland display fd
    int remaining = timeoutMs - elapsed;
    pollfd pfd = {.fd = fd, .events = POLLIN};
    int    ret = poll(&pfd, 1, remaining); // block until event or timeout

    if (ret > 0) {
      // Read and dispatch events
      wl_display_read_events(mData.mDisplay);
      wl_display_dispatch_pending(mData.mDisplay);
    } else if (ret == -1) {
      // Poll error, break or handle as needed
      std::cerr << "Poll error in getPointer\n";
      break;
    } else {
      mPointerGetTimedOut = true;
      wl_display_cancel_read(mData.mDisplay);
      wl_display_flush(mData.mDisplay);
      break;
    }
  }

  // Return the pointer coordinates and work area geometry
  Napi::Object result = Napi::Object::New(env);
  result.Set("pointerX", Napi::Number::New(env, mData.mPointerX));
  result.Set("pointerY", Napi::Number::New(env, mData.mPointerY));
  result.Set("pointerGetTimedOut", Napi::Boolean::New(env,mPointerGetTimedOut));
  result.Set("workAreaWidth", Napi::Number::New(env, mData.mWorkAreaWidth));
  result.Set("workAreaHeight", Napi::Number::New(env, mData.mWorkAreaHeight));

  // Clean up Wayland resources
  destroySurfaceAndPointer();
  return result;
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::createSurfaceAndPointer() {
  if (mData.mSurface) {
    return; // already created
  }

  mData.mSurface = wl_compositor_create_surface(mData.mCompositor);
  if (!mData.mSurface) {
    std::cerr << "Failed to create Wayland surface!\n";
    return;
  }

  static const zwlr_layer_surface_v1_listener surfaceListener = {
      .configure =
          [](void* data, zwlr_layer_surface_v1* surface, uint32_t serial, uint32_t width,
              uint32_t height) {
            auto* d = static_cast<Native::WaylandData*>(data);

            // Ack configure so compositor knows we handled it
            zwlr_layer_surface_v1_ack_configure(surface, serial);

            // Only recreate the buffer if the work area therefore the needed size changes
            if (d->mWorkAreaWidth != width || d->mWorkAreaHeight != height) {
              d->mWorkAreaWidth  = width;
              d->mWorkAreaHeight = height;

              // Create or update the buffer with requested size
              if (d->mPixelBuffer) {
                wl_buffer_destroy(d->mPixelBuffer);
                d->mPixelBuffer = nullptr;
              }

              // ARGB Color Buffer (useful for debugging, I'll set to transparent but it
              // doesn't hurt to keep it here just in case for now)
              constexpr uint32_t fillColor = 0x00000000;

              d->mPixelBuffer = createPixelBuffer(d->mShm, width, height, fillColor);
            }
            if (d->mPixelBuffer) {
              wl_surface_attach(d->mSurface, d->mPixelBuffer, 0, 0);
              wl_surface_damage(d->mSurface, 0, 0, width, height);
              wl_surface_commit(d->mSurface);
            } else {
              std::cerr << "Failed to create buffer\n";
            }
          },
      .closed =
          [](void* data, zwlr_layer_surface_v1* surface) {
            std::cerr << "Layer surface closed by compositor\n";
          },
  };

  mData.mLayerSurface =
      zwlr_layer_shell_v1_get_layer_surface(mData.mLayerShell, mData.mSurface, nullptr,
          ZWLR_LAYER_SHELL_V1_LAYER_OVERLAY, "kando-pointer-surface");
  zwlr_layer_surface_v1_add_listener(mData.mLayerSurface, &surfaceListener, &mData);
  zwlr_layer_surface_v1_set_size(mData.mLayerSurface, 0, 0);
  zwlr_layer_surface_v1_set_anchor(mData.mLayerSurface,
      ZWLR_LAYER_SURFACE_V1_ANCHOR_TOP | ZWLR_LAYER_SURFACE_V1_ANCHOR_BOTTOM |
          ZWLR_LAYER_SURFACE_V1_ANCHOR_LEFT | ZWLR_LAYER_SURFACE_V1_ANCHOR_RIGHT);

  wl_surface_commit(mData.mSurface);
  wl_display_roundtrip(mData.mDisplay);
  mData.mPointer = wl_seat_get_pointer(mData.mSeat);

  static const wl_pointer_listener pointerListener = {
      .enter =
          [](void* data, wl_pointer*, uint32_t, wl_surface*, wl_fixed_t x, wl_fixed_t y) {
            auto* d                  = static_cast<Native::WaylandData*>(data);
            d->mPointerX             = wl_fixed_to_double(x);
            d->mPointerY             = wl_fixed_to_double(y);
            d->mPointerEventReceived = true;
          },
      .leave = [](void*, wl_pointer*, uint32_t, wl_surface*) {},
      .motion =
          [](void* data, wl_pointer*, uint32_t, wl_fixed_t x, wl_fixed_t y) {
            auto* d                  = static_cast<Native::WaylandData*>(data);
            d->mPointerX             = wl_fixed_to_double(x);
            d->mPointerY             = wl_fixed_to_double(y);
            d->mPointerEventReceived = true;
          },
      .button        = nullptr,
      .axis          = nullptr,
      .frame         = nullptr,
      .axis_source   = nullptr,
      .axis_stop     = nullptr,
      .axis_discrete = nullptr,
      .axis_value120 = nullptr,
  };

  wl_pointer_add_listener(mData.mPointer, &pointerListener, &mData);
  mData.mPointerEventReceived = false;
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::destroySurfaceAndPointer() {
  if (mData.mPointer) {
    wl_pointer_destroy(mData.mPointer);
    mData.mPointer = nullptr;
  }

  if (mData.mLayerSurface) {
    zwlr_layer_surface_v1_destroy(mData.mLayerSurface);
    mData.mLayerSurface = nullptr;
  }

  if (mData.mSurface) {
    wl_surface_commit(mData.mSurface);
    wl_display_flush(mData.mDisplay);
    wl_surface_destroy(mData.mSurface);
    mData.mSurface = nullptr;
  }

  mData.mPointerEventReceived = false;
}

//////////////////////////////////////////////////////////////////////////////////////////

// This generates the addon and makes it available to JavaScript.
NODE_API_ADDON(Native)

//////////////////////////////////////////////////////////////////////////////////////////

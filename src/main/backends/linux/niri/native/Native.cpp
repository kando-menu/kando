//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Louis Dalibard <ontake@ontake.dev>
// SPDX-License-Identifier: MIT

#include "Native.hpp"

#include <cstring>
#include <fcntl.h>
#include <iostream>
#include <poll.h>
#include <sys/mman.h>
#include <unistd.h>

//////////////////////////////////////////////////////////////////////////////////////////

// Create an anonymous shared memory file descriptor for the debug color buffer (this can
// be removed for production)
static int create_shm_file() {
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

// Create wl_shm pool and buffer with given size, filled with solid color
static wl_buffer* create_buffer(wl_shm* shm, int width, int height, uint32_t color) {
  const int stride = width * 4;
  const int size   = stride * height;

  int fd = create_shm_file();
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

//////////////////////////////////////////////////////////////////////////////////////////

static void handle_layer_surface_configure(void* data, zwlr_layer_surface_v1* surface,
    uint32_t serial, uint32_t width, uint32_t height) {
  auto* d = static_cast<Native::WaylandData*>(data);

  // Ack configure so compositor knows we handled it
  zwlr_layer_surface_v1_ack_configure(surface, serial);

  d->workAreaW = width;
  d->workAreaH = height;

  // Create or update the buffer with requested size
  if (d->buffer) {
    wl_buffer_destroy(d->buffer);
    d->buffer = nullptr;
  }

  // ARGB Color Buffer (useful for debugging, I'll set to transparent but it doesn't hurt
  // to keep it here just in case for now)
  constexpr uint32_t fillColor = 0x00000000;

  d->buffer = create_buffer(d->mShm, width, height, fillColor);

  if (d->buffer) {
    wl_surface_attach(d->mSurface, d->buffer, 0, 0);
    wl_surface_damage(d->mSurface, 0, 0, width, height);
    wl_surface_commit(d->mSurface);
  } else {
    std::cerr << "Failed to create buffer\n";
  }
}

static void handle_layer_surface_closed(void* data, zwlr_layer_surface_v1* surface) {
  std::cerr << "Layer surface closed by compositor\n";
}

static const zwlr_layer_surface_v1_listener layer_surface_listener = {
    .configure = handle_layer_surface_configure,
    .closed    = handle_layer_surface_closed,
};

//////////////////////////////////////////////////////////////////////////////////////////

Native::Native(Napi::Env env, Napi::Object exports) {
  DefineAddon(exports, {
                           InstanceMethod("getPointerPositionAndWorkAreaSize", &Native::getPointerPositionAndWorkAreaSize),
                       });
}

//////////////////////////////////////////////////////////////////////////////////////////

Native::~Native() {
  if (mData.buffer) {
    wl_buffer_destroy(mData.buffer);
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

  mData.mDisplay = wl_display_connect(nullptr);
  if (!mData.mDisplay) {
    Napi::Error::New(env, "Failed to get Wayland display!").ThrowAsJavaScriptException();
    return;
  }

  mData.mRegistry = wl_display_get_registry(mData.mDisplay);

  mData.mRegistryListener = {
      .global =
          [](void* data, wl_registry* registry, uint32_t name, const char* interface,
              uint32_t version) {
            auto* d = static_cast<Native::WaylandData*>(data);

            if (strcmp(interface, wl_compositor_interface.name) == 0) {
              d->mCompositor = static_cast<wl_compositor*>(
                  wl_registry_bind(registry, name, &wl_compositor_interface,
                      4)); // this has to be v4 (this is the version Niri uses)
            } else if (strcmp(interface, wl_seat_interface.name) == 0) {
              d->mSeat = static_cast<wl_seat*>(
                  wl_registry_bind(registry, name, &wl_seat_interface,
                      4)); // this has to be v4 (this is the version Niri uses)
            } else if (strcmp(interface, zwlr_layer_shell_v1_interface.name) == 0) {
              d->mLayerShell = static_cast<zwlr_layer_shell_v1*>(
                  wl_registry_bind(registry, name, &zwlr_layer_shell_v1_interface,
                      4)); // this has to be v4 (this is the version Niri uses)
            } else if (strcmp(interface, wl_shm_interface.name) == 0) {
              d->mShm = static_cast<wl_shm*>(
                  wl_registry_bind(registry, name, &wl_shm_interface, 1));
            }
          },
      .global_remove = [](void*, wl_registry*, uint32_t) {},
  };

  wl_registry_add_listener(mData.mRegistry, &mData.mRegistryListener, &mData);
  wl_display_roundtrip(mData.mDisplay);

  if (!mData.mCompositor || !mData.mLayerShell || !mData.mSeat || !mData.mShm) {
    Napi::Error::New(env, "Failed to bind required Wayland interfaces.")
        .ThrowAsJavaScriptException();
    return;
  }
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

  mData.mLayerSurface =
      zwlr_layer_shell_v1_get_layer_surface(mData.mLayerShell, mData.mSurface, nullptr,
          ZWLR_LAYER_SHELL_V1_LAYER_OVERLAY, "kando-pointer-surface");
  zwlr_layer_surface_v1_add_listener(
      mData.mLayerSurface, &layer_surface_listener, &mData);
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
            auto* d                 = static_cast<Native::WaylandData*>(data);
            d->pointerX             = wl_fixed_to_double(x);
            d->pointerY             = wl_fixed_to_double(y);
            d->pointerEventReceived = true;
          },
      .leave = [](void*, wl_pointer*, uint32_t, wl_surface*) {},
      .motion =
          [](void* data, wl_pointer*, uint32_t, wl_fixed_t x, wl_fixed_t y) {
            auto* d                 = static_cast<Native::WaylandData*>(data);
            d->pointerX             = wl_fixed_to_double(x);
            d->pointerY             = wl_fixed_to_double(y);
            d->pointerEventReceived = true;
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
  mData.pointerEventReceived = false;
}

//////////////////////////////////////////////////////////////////////////////////////////
void Native::destroySurfaceAndPointer() {
  if (mData.buffer) {
    wl_buffer_destroy(mData.buffer);
    mData.buffer = nullptr;
  }
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
  mData.pointerEventReceived = false;
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

  int fd                     = wl_display_get_fd(mData.mDisplay);
  mData.pointerEventReceived = false;

  while (!mData.pointerEventReceived) {
    // Process any pending events first
    wl_display_dispatch_pending(mData.mDisplay);

    // Prepare to read new events
    if (wl_display_prepare_read(mData.mDisplay) != 0) {
      // In case of error, flush and continue
      wl_display_flush(mData.mDisplay);
      continue;
    }

    // Flush requests to compositor
    wl_display_flush(mData.mDisplay);

    // Wait for events on the Wayland display fd
    pollfd pfd = {.fd = fd, .events = POLLIN};
    int    ret = poll(&pfd, 1, -1); // block indefinitely until event

    if (ret > 0) {
      // Read and dispatch events
      wl_display_read_events(mData.mDisplay);
      wl_display_dispatch_pending(mData.mDisplay);
    } else if (ret == -1) {
      // Poll error, break or handle as needed
      std::cerr << "Poll error in getPointer\n";
      break;
    }
  }

  // Return the pointer coordinates and work area geometry
  Napi::Object result = Napi::Object::New(env);
  result.Set("x", Napi::Number::New(env, mData.pointerX));
  result.Set("y", Napi::Number::New(env, mData.pointerY));
  result.Set("workareaW", Napi::Number::New(env, mData.workAreaW));
  result.Set("workareaH", Napi::Number::New(env, mData.workAreaH));

  // Clean up Wayland resources
  destroySurfaceAndPointer();
  return result;
}

//////////////////////////////////////////////////////////////////////////////////////////

// This generates the addon and makes it available to JavaScript.
NODE_API_ADDON(Native)

//////////////////////////////////////////////////////////////////////////////////////////

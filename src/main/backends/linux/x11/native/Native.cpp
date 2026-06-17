//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#include "Native.hpp"

#include <X11/Xlib.h>
#include <X11/Xatom.h>
#include <X11/Xresource.h>
#include <X11/extensions/XTest.h>
#include <X11/keysym.h>

#include <cmath>
#include <iostream>
#include <string>

//////////////////////////////////////////////////////////////////////////////////////////

Native::Native(Napi::Env env, Napi::Object exports) {
  DefineAddon(exports, {
                           InstanceMethod("movePointer", &Native::movePointer),
                           InstanceMethod("simulateKey", &Native::simulateKey),
                           InstanceMethod("getWMInfo", &Native::getWMInfo),
                           InstanceMethod("getOpenWindows", &Native::getOpenWindows),
                           InstanceMethod("focusWindow", &Native::focusWindow),
                       });
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::movePointer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "Two Numbers expected").ThrowAsJavaScriptException();
  }

  auto display = XOpenDisplay(nullptr);

  auto dx = info[0].As<Napi::Number>().Int32Value();
  auto dy = info[1].As<Napi::Number>().Int32Value();

  XTestFakeRelativeMotionEvent(display, dx, dy, CurrentTime);

  XCloseDisplay(display);
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::simulateKey(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 2 || !info[0].IsNumber() || !info[1].IsBoolean()) {
    Napi::TypeError::New(env, "Number and Boolean expected").ThrowAsJavaScriptException();
  }

  auto    display = XOpenDisplay(nullptr);
  KeyCode keycode = info[0].As<Napi::Number>().Int32Value();
  bool    press   = info[1].As<Napi::Boolean>().Value();

  XTestFakeKeyEvent(display, keycode, press, CurrentTime);

  XCloseDisplay(display);
}

//////////////////////////////////////////////////////////////////////////////////////////

// This is based on https://github.com/yvesh/active-windows

namespace {

unsigned char* getStringProperty(
    Display* display, Window window, std::string const& name) {
  Atom           actual_type, filter_atom;
  int            actual_format, status;
  unsigned long  nitems, bytes_after;
  unsigned char* prop;

  filter_atom = XInternAtom(display, name.c_str(), 1);
  status = XGetWindowProperty(display, window, filter_atom, 0, 1000, 0, AnyPropertyType,
      &actual_type, &actual_format, &nitems, &bytes_after, &prop);

  if (status != Success) {
    return 0;
  }

  return prop;
}

unsigned long getLongProperty(Display* display, Window window, std::string const& name) {
  unsigned char* prop = getStringProperty(display, window, name);

  if (prop == 0) {
    return 0;
  }

  unsigned long long_property =
      prop[0] + (prop[1] << 8) + (prop[2] << 16) + (prop[3] << 24);
  return long_property;
}

bool getWindowAppAndName(
    Display* display, Window window, std::string& appName, std::string& windowName) {
  char* wm_class = reinterpret_cast<char*>(getStringProperty(display, window, "WM_CLASS"));
  if (!wm_class || wm_class[0] == '\0') {
    return false;
  }

  unsigned char* net_wm_name = getStringProperty(display, window, "_NET_WM_NAME");
  if (net_wm_name != nullptr) {
    windowName = reinterpret_cast<const char*>(net_wm_name);
  } else {
    unsigned char* wm_name_prop = getStringProperty(display, window, "WM_NAME");
    if (wm_name_prop != nullptr) {
      windowName = reinterpret_cast<const char*>(wm_name_prop);
    }
  }

  if (windowName.empty()) {
    return false;
  }

  appName = wm_class;
  return true;
}

} // namespace

//////////////////////////////////////////////////////////////////////////////////////////

Napi::Value Native::getWMInfo(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  Napi::Object obj = Napi::Object::New(env);

  Display* display = XOpenDisplay(nullptr);
  int      screen  = XDefaultScreen(display);
  Window   root    = RootWindow(display, screen);

  if (root) {
    Window window = getLongProperty(display, root, "_NET_ACTIVE_WINDOW");

    if (window) {
      std::string appName;
      std::string windowName;
      if (getWindowAppAndName(display, window, appName, windowName)) {
        obj.Set("app", appName);
        obj.Set("window", windowName);
      }
    }
  }

  // Get pointer location.
  int          root_x, root_y, win_x, win_y;
  unsigned int mask;
  Window       child;
  XQueryPointer(display, root, &child, &child, &root_x, &root_y, &win_x, &win_y, &mask);

  // Get the DPI scaling factor
  double scaling_factor  = 1.0;
  char*  resource_string = XResourceManagerString(display);

  if (resource_string) {
    XrmDatabase db = XrmGetStringDatabase(resource_string);

    char*    type;
    XrmValue value;

    if (XrmGetResource(db, "Xft.dpi", "Xft.Dpi", &type, &value)) {
      double dpi     = atof(value.addr);
      scaling_factor = dpi / 96.0; // Assuming 96 DPI as the baseline for 1.0 scaling
    }

    XrmDestroyDatabase(db);
  }

  obj.Set("pointerX", 1.0 * root_x / scaling_factor);
  obj.Set("pointerY", 1.0 * root_y / scaling_factor);

  XCloseDisplay(display);

  return obj;
}

//////////////////////////////////////////////////////////////////////////////////////////

Napi::Value Native::getOpenWindows(const Napi::CallbackInfo& info) {
  Napi::Env   env    = info.Env();
  Napi::Array result = Napi::Array::New(env);

  Display* display = XOpenDisplay(nullptr);
  if (!display) {
    return result;
  }

  int    screen = XDefaultScreen(display);
  Window root   = RootWindow(display, screen);

  Atom          actual_type;
  int           actual_format;
  unsigned long nitems, bytes_after;
  unsigned char* data = nullptr;

  Atom net_client_list = XInternAtom(display, "_NET_CLIENT_LIST", False);
  int  status          = XGetWindowProperty(display, root, net_client_list, 0, ~0L, False,
      XA_WINDOW, &actual_type, &actual_format, &nitems, &bytes_after, &data);

  if (status == Success && data) {
    Window*  windows = reinterpret_cast<Window*>(data);
    uint32_t index   = 0;

    for (unsigned long i = 0; i < nitems; i++) {
      Window win = windows[i];

      std::string appName;
      std::string windowName;
      if (getWindowAppAndName(display, win, appName, windowName)) {
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("app", appName);
        obj.Set("window", windowName);
        result.Set(index++, obj);
      }
    }

    XFree(data);
  }

  XCloseDisplay(display);

  return result;
}

//////////////////////////////////////////////////////////////////////////////////////////

void Native::focusWindow(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 2 || !info[0].IsString() || !info[1].IsString()) {
    Napi::TypeError::New(env, "Two strings expected").ThrowAsJavaScriptException();
    return;
  }

  std::string targetWindowName = info[0].As<Napi::String>().Utf8Value();
  std::string targetAppName    = info[1].As<Napi::String>().Utf8Value();

  Display* display = XOpenDisplay(nullptr);
  if (!display) {
    return;
  }

  int    screen = XDefaultScreen(display);
  Window root   = RootWindow(display, screen);

  Atom          actual_type;
  int           actual_format;
  unsigned long nitems, bytes_after;
  unsigned char* data = nullptr;

  Atom net_client_list = XInternAtom(display, "_NET_CLIENT_LIST", False);
  int  status          = XGetWindowProperty(display, root, net_client_list, 0, ~0L, False,
      XA_WINDOW, &actual_type, &actual_format, &nitems, &bytes_after, &data);

  if (status == Success && data) {
    Window* windows = reinterpret_cast<Window*>(data);

    for (unsigned long i = 0; i < nitems; i++) {
      Window win = windows[i];

      std::string appName;
      std::string windowName;
      if (getWindowAppAndName(display, win, appName, windowName) &&
          targetAppName == appName && targetWindowName == windowName) {
        // Switch to the window's workspace first so the WM moves to it rather
        // than just showing an activation notification.
        unsigned long desktop = getLongProperty(display, win, "_NET_WM_DESKTOP");

        // _NET_WM_DESKTOP value 0xFFFFFFFF means "all desktops" – no switch needed.
        if (desktop != 0xFFFFFFFF) {
          XEvent desktopEvent                    = {};
          desktopEvent.type                      = ClientMessage;
          desktopEvent.xclient.window            = root;
          desktopEvent.xclient.message_type      = XInternAtom(display, "_NET_CURRENT_DESKTOP", False);
          desktopEvent.xclient.format            = 32;
          desktopEvent.xclient.data.l[0]         = static_cast<long>(desktop);
          desktopEvent.xclient.data.l[1]         = CurrentTime;

          XSendEvent(display, root, False,
              SubstructureNotifyMask | SubstructureRedirectMask, &desktopEvent);
        }

        // Now activate the window using the standard EWMH _NET_ACTIVE_WINDOW message.
        XEvent event                    = {};
        event.type                      = ClientMessage;
        event.xclient.window            = win;
        event.xclient.message_type      = XInternAtom(display, "_NET_ACTIVE_WINDOW", False);
        event.xclient.format            = 32;
        event.xclient.data.l[0]         = 1; // source indication: 1 = application
        event.xclient.data.l[1]         = CurrentTime;
        event.xclient.data.l[2]         = 0; // currently active window (none)

        XSendEvent(display, root, False,
            SubstructureNotifyMask | SubstructureRedirectMask, &event);
        XFlush(display);
        break;
      }
    }

    XFree(data);
  }

  XCloseDisplay(display);
}

//////////////////////////////////////////////////////////////////////////////////////////

// This generates the addon and makes it available to JavaScript.
NODE_API_ADDON(Native)

//////////////////////////////////////////////////////////////////////////////////////////

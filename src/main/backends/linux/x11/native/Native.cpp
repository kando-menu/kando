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
#include <X11/extensions/XTest.h>
#include <X11/keysym.h>

#include <iostream>
#include <string>

//////////////////////////////////////////////////////////////////////////////////////////

Native::Native(Napi::Env env, Napi::Object exports) {
  DefineAddon(exports, {
                           InstanceMethod("movePointer", &Native::movePointer),
                           InstanceMethod("simulateKey", &Native::simulateKey),
                           InstanceMethod("getActiveWindow", &Native::getActiveWindow),
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

} // namespace

//////////////////////////////////////////////////////////////////////////////////////////

Napi::Value Native::getActiveWindow(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  Napi::Object obj = Napi::Object::New(env);

  Display* display = XOpenDisplay(nullptr);
  int      screen  = XDefaultScreen(display);
  Window   window  = RootWindow(display, screen);

  if (!window) {
    return env.Null();
  }

  window = getLongProperty(display, window, "_NET_ACTIVE_WINDOW");

  if (!window) {
    return env.Null();
  }

  char* wm_class =
      reinterpret_cast<char*>(getStringProperty(display, window, "WM_CLASS"));

  // Workaround for null values
  unsigned char* net_wm_name = getStringProperty(display, window, "_NET_WM_NAME");

  const char* wm_name = "";

  if (net_wm_name != NULL) {
    wm_name =
        reinterpret_cast<const char*>(getStringProperty(display, window, "_NET_WM_NAME"));
  }

  obj.Set("app", wm_class);
  obj.Set("name", wm_name);

  XCloseDisplay(display);

  return obj;
}

//////////////////////////////////////////////////////////////////////////////////////////

// This generates the addon and makes it available to JavaScript.
NODE_API_ADDON(Native)

//////////////////////////////////////////////////////////////////////////////////////////

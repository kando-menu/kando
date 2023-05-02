//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do, the truly       //
//     . <   _|   .  | ____| |  | (   |    amazing cross-platform marking menu.         //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#include "active_window.hpp"

#include <X11/Xlib.h>

#include <string>

// Based on https://github.com/yvesh/active-windows

extern "C" {
// SEE xprop
#define MAXSTR 1000
unsigned long window;
unsigned char* prop;
Display* display;

unsigned char* get_string_property(char* property_name) {
  Atom actual_type, filter_atom;
  int actual_format, status;
  unsigned long nitems, bytes_after;

  filter_atom = XInternAtom(display, property_name, True);
  status =
    XGetWindowProperty(display, window, filter_atom, 0, MAXSTR, False, AnyPropertyType,
                       &actual_type, &actual_format, &nitems, &bytes_after, &prop);

  if (status != Success) {
    return 0;
  }

  return prop;
}

unsigned long get_long_property(char* property_name) {
  unsigned char* prop = get_string_property(property_name);

  if (prop == 0) {
    return 0;
  }

  unsigned long long_property =
    prop[0] + (prop[1] << 8) + (prop[2] << 16) + (prop[3] << 24);
  return long_property;
}
}

namespace active_window {
bool getActiveWindow(Napi::Object& obj) {
  display    = XOpenDisplay(nullptr);
  int screen = XDefaultScreen(display);
  window     = RootWindow(display, screen);

  if (!window) {
    return false;
  }

  window = get_long_property("_NET_ACTIVE_WINDOW");

  if (!window) {
    return false;
  }

  char* wm_class = reinterpret_cast<char*>(get_string_property("WM_CLASS"));

  // Workaround for null values
  unsigned char* net_wm_name = get_string_property("_NET_WM_NAME");

  char* wm_name = "";

  if (net_wm_name != NULL) {
    wm_name = reinterpret_cast<char*>(get_string_property("_NET_WM_NAME"));
  }

  obj.Set("wmClass", wm_class);
  obj.Set("name", wm_name);

  XCloseDisplay(display);

  return true;
}

Napi::Value getActiveWindowWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  Napi::Object obj = Napi::Object::New(env);
  if (getActiveWindow(obj)) {
    return obj;
  }

  return env.Null();
}

Napi::Object init(Napi::Env env, Napi::Object exports) {
  exports.Set("getActiveWindow", Napi::Function::New(env, getActiveWindowWrapped));

  return exports;
}

}  // namespace active_window
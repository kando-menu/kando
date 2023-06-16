//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#include "simulate_key.hpp"

#include <X11/Xlib.h>
#include <X11/extensions/XTest.h>
#include <X11/keysym.h>

#include <iostream>
#include <string>

namespace simulate_key {

// This converts key names to keyvals. See index.ts for more explanation.
void simulateKey(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 2 || !info[0].IsNumber() || !info[1].IsBoolean()) {
    Napi::TypeError::New(env, "Number and Boolean expected").ThrowAsJavaScriptException();
  }

  auto    display = XOpenDisplay(nullptr);
  KeySym  keysym  = info[0].As<Napi::Number>().Int32Value();
  KeyCode keycode = XKeysymToKeycode(display, keysym);
  bool    press   = info[1].As<Napi::Boolean>().Value();

  XTestFakeKeyEvent(display, keycode, press, CurrentTime);

  // std::cout << "Simulating key " << keysym << " with keycode " << keycode << " and
  // press "
  //           << press << std::endl;

  // Window root = DefaultRootWindow(display);
  // Window focus;
  // int    revert_to;
  // XGetInputFocus(display, &focus, &revert_to);

  // XKeyEvent event;
  // event.display = display;
  // event.window  = focus;
  // event.root    = root;
  // event.time    = CurrentTime;
  // event.keycode = keycode;
  // event.type    = press ? KeyPress : KeyRelease;
  // XSendEvent(display, focus, True, KeyPressMask, (XEvent*)&event);

  XCloseDisplay(display);
}

void init(Napi::Env env, Napi::Object exports) {
  exports.Set("simulateKey", Napi::Function::New(env, simulateKey));
}

} // namespace simulate_key
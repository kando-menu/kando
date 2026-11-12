//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

#ifndef MOUSE_HOOK_HPP
#define MOUSE_HOOK_HPP

#include <napi.h>

#include <windows.h>

#include <array>
#include <mutex>
#include <string>
#include <thread>

/**
 * This class implements "mouse-hold triggers": A global low-level mouse hook watches
 * the configured mouse buttons. If such a button is held down for a certain time without
 * moving the pointer much, a 'press' event is sent to JavaScript. When the button is
 * released afterwards, a 'release' event is sent.
 *
 * While the button is held, the original button events are swallowed so that the
 * application below the pointer does not see them. If the button is released before the
 * hold time is over (or if the pointer moves too much), the swallowed events are replayed
 * so that normal clicks and drags still work everywhere.
 *
 * All timing is done on the hook thread because the decision whether an event should be
 * swallowed has to be made synchronously.
 */
class MouseHook {
 public:
  /** The buttons which can be used as triggers. The order must match kButtonNames. */
  enum Button { eRight = 0, eMiddle, eX1, eX2, eButtonCount };

  /** Starts the hook thread. Does nothing if it is already running. */
  static void start(Napi::Env env, Napi::Function callback);

  /** Stops the hook thread and releases the JavaScript callback. */
  static void stop();

  /**
   * Sets the buttons which are monitored.
   *
   * @param enabled          For each button, whether it acts as a trigger.
   * @param holdTimeMs       How long a button has to be held before the menu opens.
   * @param moveTolerancePx  If the pointer moves further than this while waiting for the
   *                         hold time, the press is treated as a normal drag.
   */
  static void setTriggers(
      std::array<bool, eButtonCount> enabled, unsigned holdTimeMs, int moveTolerancePx);

  /** Converts 'Right', 'Middle', 'X1', or 'X2' to a button. Returns -1 if unknown. */
  static int buttonFromName(const std::string& name);
};

#endif // MOUSE_HOOK_HPP

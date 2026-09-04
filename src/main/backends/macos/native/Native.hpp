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

#include <ApplicationServices/ApplicationServices.h>
#include <napi.h>

#include <atomic>
#include <mutex>
#include <string>
#include <unordered_set>
#include <vector>

struct SystemShortcutBinding {
  std::string            shortcut;
  CGKeyCode              keyCode;
  uint32_t               modifierMask;
  std::vector<CGKeyCode> sideModifiers;
};

/**
 * This class allows moving the mouse pointer and simulating key presses on macOS. It uses
 * the core graphics framework for this.
 *
 * For simulation of key presses, we have to keep track of the current modifier mask. This
 * is done by the mCurrentModifierMask member variable.
 */
class Native : public Napi::Addon<Native> {
 public:
  Native(Napi::Env env, Napi::Object exports);
  virtual ~Native();

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

  /** Returns whether a side-specific physical modifier key is currently pressed. */
  Napi::Value isModifierPressed(const Napi::CallbackInfo& info);

  /** Starts forwarding and suppressing all keyboard events. */
  Napi::Value startKeyboardCapture(const Napi::CallbackInfo& info);

  /** Stops forwarding and suppressing keyboard events. */
  void stopKeyboardCapture(const Napi::CallbackInfo& info);

  /** Replaces shortcuts which should be handled by the native event tap. */
  Napi::Value bindSystemShortcuts(const Napi::CallbackInfo& info);

  /** Tracks physical modifier key transitions reported by the macOS event tap. */
  static CGEventRef modifierEventTapCallback(CGEventTapProxy proxy,
      CGEventType type, CGEventRef event, void* userInfo);

  /**
   * This function is called when the getActiveWindow function is called from JavaScript.
   * It returns the app and class of the currently active window.
   *
   * @param info The arguments passed to the getActiveWindow function. It should contain
   *            no arguments.
   */
  Napi::Value getActiveWindow(const Napi::CallbackInfo& info);

  /**
   * This function is called when the getOpenWindows function is called from JavaScript.
   * It returns an array of objects, each with an 'app' and a 'window' property,
   * representing all currently open windows.
   *
   * @param info The arguments passed to the getOpenWindows function. It should contain
   *             no arguments.
   */
  Napi::Value getOpenWindows(const Napi::CallbackInfo& info);

  /**
   * This function is called when the focusWindow function is called from JavaScript.
   * It focuses the window with the given window title and app name.
   *
   * @param info The arguments passed to the focusWindow function. It should contain
   *             two strings: the window title and the app name.
   */
  void focusWindow(const Napi::CallbackInfo& info);

  /**
   * This function returns a list of all installed applications.
   *
   * @param info The arguments passed to the listInstalledApplications function. It should
   * contain no arguments.
   */
  Napi::Value listInstalledApplications(const Napi::CallbackInfo& info);

  // We have to keep track of the current modifier mask to be able to simulate key
  // presses.
  uint32_t mLeftModifierMask  = 0;
  uint32_t mRightModifierMask = 0;

  /** An event tap used to track modifiers and optionally capture keyboard input. */
  CFMachPortRef     mModifierEventTap       = nullptr;
  CFRunLoopSourceRef mModifierEventTapSource = nullptr;

  /** Whether the event tap was created as an active filter. */
  bool mCanSuppressKeyboardEvents = false;

  /** Whether keyboard events are currently forwarded to JavaScript and suppressed. */
  std::atomic<bool> mKeyboardCaptureEnabled{false};

  /** JavaScript callback receiving captured key code and key state pairs. */
  Napi::ThreadSafeFunction mKeyboardCaptureCallback;

  /** Keys pressed during capture whose releases must also be suppressed. */
  std::mutex                    mSuppressedKeysMutex;
  std::unordered_set<CGKeyCode> mSuppressedKeys;

  /** Shortcuts which Electron could not register with the operating system. */
  std::mutex                         mSystemShortcutsMutex;
  std::vector<SystemShortcutBinding> mSystemShortcuts;

  /** JavaScript callback invoked when a native system shortcut is pressed. */
  std::atomic<bool>       mSystemShortcutCallbackEnabled{false};
  Napi::ThreadSafeFunction mSystemShortcutCallback;

  /** Shortcut key releases which must not be delivered to the system. */
  std::unordered_set<CGKeyCode> mSuppressedShortcutKeys;

  /** Bit mask containing the currently pressed physical modifier keys. */
  std::atomic<uint32_t> mPressedModifierKeys{0};
};

#endif // NATIVE_HPP

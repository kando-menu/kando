//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

export type Native = {
  /**
   * This uses Win32 API calls to get the name and the class of the currently focused
   * application window, as well as the current pointer position.
   */
  getWMInfo(): { app: string; window: string; pointerX: number; pointerY: number };

  /**
   * Returns an array of all currently open windows, each with an 'app' (executable name)
   * and a 'window' (window title) property.
   */
  getOpenWindows(): Array<{ app: string; window: string }>;

  /**
   * Focuses the window with the given title and app name.
   *
   * @param windowName The window title.
   * @param appName The executable name of the app.
   */
  focusWindow(windowName: string, appName: string): void;

  /**
   * This simulates a mouse movement.
   *
   * @param dx The horizontal movement in pixels.
   * @param dy The vertical movement in pixels.
   */
  movePointer(dx: number, dy: number): void;

  /**
   * This simulates a key press or release.
   *
   * @param keycode The Win32 key code of the key to simulate.
   * @param down If true, a key press is simulated. Otherwise, a key release is simulated.
   */
  simulateKey(keycode: number, down: boolean): void;

  /**
   * This fixes the acrylic effect on Windows after the window has been resized. See here:
   * https://github.com/electron/electron/issues/42393
   *
   * @param hwnd The window handle.
   */
  fixAcrylicEffect(hwnd: number): void;

  /**
   * This lists all installed applications.
   *
   * @returns An array of objects containing the application's ID, name, and
   *   base64-encoded icon.
   */
  listInstalledApplications(): {
    id: string;
    name: string;
    base64Icon: string;
  }[];

  /**
   * This installs a global low-level mouse hook which is used for mouse-hold triggers.
   * Configure the monitored buttons with setMouseTriggers().
   *
   * @param callback Called with 'press' when a trigger button was held long enough, and
   *   with 'release' when it is released afterwards. The second argument is the button
   *   name: 'Right', 'Middle', 'X1', or 'X2'.
   */
  startMouseHook(callback: (event: 'press' | 'release', button: string) => void): void;

  /** This removes the global mouse hook again. */
  stopMouseHook(): void;

  /**
   * Configures which mouse buttons act as mouse-hold triggers.
   *
   * @param buttons The buttons to monitor: any of 'Right', 'Middle', 'X1', 'X2'.
   * @param holdTimeMs How long a button has to be held before 'press' is reported.
   * @param moveTolerancePx If the pointer moves further than this while waiting, the
   *   press is passed on to the application as a normal drag.
   */
  setMouseTriggers(buttons: string[], holdTimeMs: number, moveTolerancePx: number): void;
};

const native: Native = require('./../../../../../build/Release/NativeWin32.node');

export { native };

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
   * This uses XLib calls to get the name and the class of the currently focused
   * application window, as well as the current pointer position.
   */
  getWMInfo(): { app: string; window: string; pointerX: number; pointerY: number };

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
   * @param keycode The X11 scan code to simulate.
   * @param down If true, a key press is simulated. Otherwise, a key release is simulated.
   */
  simulateKey(keycode: number, down: boolean): void;

  /**
   * Returns an array of all currently open windows, each with an 'app' (WM_CLASS instance
   * name) and a 'window' (_NET_WM_NAME title) property.
   */
  getOpenWindows(): Array<{ app: string; window: string }>;

  /**
   * Focuses the window with the given title and app name by sending a _NET_ACTIVE_WINDOW
   * client message to the root window.
   *
   * @param windowName The _NET_WM_NAME title of the window to focus.
   * @param appName The WM_CLASS instance name of the window to focus.
   */
  focusWindow(windowName: string, appName: string): void;
};

const native: Native = require('./../../../../../../build/Release/NativeX11.node');

export { native };

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

export interface Native {
  /**
   * This uses Win32 API calls to get the name and the class of the currently focused
   * application window.
   */
  getActiveWindow(): { app: string; name: string };

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
}

const native: Native = require('./../../../../../build/Release/NativeWin32.node');

export { native };

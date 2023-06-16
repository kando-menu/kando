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
   * This uses XLib calls to get the name and the class of the currently focused
   * application window. This only works on X11.
   */
  getActiveWindow(): { wmClass: string; name: string };

  /**
   * This converts a list of key names to their corresponding keyvals (or keysyms as they
   * are called in X11). This also works on Wayland.
   *
   * @param keys A list of key names, as described here:
   *   https://linux.die.net/man/3/xstringtokeysym
   */
  convertKeys(keys: string[]): number[];

  /**
   * This simulates a key press or release.
   *
   * @param keysym The keyval (or keysym) to simulate. This is the return value of
   *   convertKeys().
   * @param down If true, a key press is simulated. Otherwise, a key release is simulated.
   */
  simulateKey(keysym: number, down: boolean): void;
}

const native: Native = require('./../../../../../build/Release/NativeX11.node');

export { native };

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { native } from './native';
import { LinuxBackend } from '../backend';
import { KeySequence } from '../../../../common';
import { mapKeys } from '../../../../common/key-codes';

/**
 * This is a partial implementation of the Backend interface for wlroots-based Wayland
 * compositors. It can be used as a base class for other wlroots-based backends. It
 * provides the following functionality:
 *
 * - Moving the mouse pointer using the wlr-virtual-pointer-unstable-v1 protocol.
 * - Sending key input using the virtual-keyboard-unstable-v1 protocol.
 */
export abstract class WLRBackend extends LinuxBackend {
  /**
   * Moves the pointer by the given amount using the native module which uses the
   * wlr-virtual-pointer-unstable-v1 Wayland protocol.
   *
   * @param dx The amount of horizontal movement.
   * @param dy The amount of vertical movement.
   */
  public async movePointer(dx: number, dy: number) {
    try {
      native.movePointer(dx, dy);
    } catch (e) {
      console.error('Failed to move mouse pointer: ' + e.message);
    }
  }

  /**
   * This simulates a key sequence by sending the keys to the currently focused window
   * using the virtual-keyboard-unstable-v1 Wayland protocol. If one of the given keys in
   * the sequence is not known, an exception will be thrown.
   *
   * @param shortcut The keys to simulate.
   */
  public async simulateKeys(keys: KeySequence) {
    // We first need to convert the given DOM key names to X11 key codes. If a key code is
    // not found, this throws an error.
    const keyCodes = mapKeys(keys, 'linux');

    // Now simulate the key presses. We wait a couple of milliseconds if the key has a
    // delay specified.
    for (let i = 0; i < keyCodes.length; i++) {
      if (keys[i].delay > 0) {
        await new Promise((resolve) => {
          setTimeout(resolve, keys[i].delay);
        });
      }

      native.simulateKey(keyCodes[i], keys[i].down);
    }
  }

  /**
   * This gets the pointer's position and work area size. Derived backends may use this in
   * their getWMInfo() implementations.
   *
   * This is only supported on Wayland compositors implementing the wlr-layer-shell
   * protocol. Also, it requires that the compositor automatically sends a pointer-enter
   * event when the surface is created. It seems that for instance Niri does this, but
   * Hyprland does not. Hence, on Hyprland, the method would block until the user moves
   * the pointer.
   */
  protected getPointerPositionAndWorkAreaSize() {
    const data = native.getPointerPositionAndWorkAreaSize();
    if (data.pointerGetTimedOut) {
      console.error('Pointer get timed out');
    }
    return data;
  }
}

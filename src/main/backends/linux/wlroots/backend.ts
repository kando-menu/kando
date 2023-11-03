//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { native } from './native';
import { Backend, Shortcut } from '../../backend';
import { IKeySequence } from '../../../../common';
import { LinuxKeyCodes } from '../keys';

/**
 * This is a partial implementation of the Backend interface for wlroots-based Wayland
 * compositors. It can be used as a base class for other wlroots-based backends. It
 * provides the following functionality:
 *
 * - Get the active window's name and class using the
 *   wlr-foreign-toplevel-management-unstable-v1 protocol.
 * - Move the mouse pointer using the wlr-virtual-pointer-unstable-v1 protocol.
 * - Send key input using the virtual-keyboard-unstable-v1 protocol.
 */
export class WLRBackend implements Backend {
  /**
   * Override this if another type is more suitable for your desktop environment.
   * https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions
   *
   * 'splash' seems to be a good choice for Hyprland.
   *
   * @returns 'splash'
   */
  public getWindowType() {
    return 'normal';
  }

  /** This is called when the backend is created. Currently, this this does nothing. */
  public async init() {}

  /**
   * This uses the Wlr-foreign-toplevel-management-unstable-v1 Wayland protocol to get the
   * name and class of the currently focused window.
   *
   * ATTENTION: This does not return the pointer position. This is because there is no
   * Wayland protocol to get the pointer position. This has to be implemented in a
   * compositor-specific derived backend.
   *
   * @returns The name and class of the currently focused window.
   */
  public async getWMInfo() {
    const window = native.getActiveWindow();

    return {
      windowName: window ? window.name : '',
      windowClass: window ? window.wmClass : '',
      pointerX: 0,
      pointerY: 0,
    };
  }

  /**
   * Moves the pointer by the given amount using the native module.
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
   * using the XTest X11 extension. If one of the given keys in the sequence is not known,
   * an exception will be thrown.
   *
   * @param shortcut The keys to simulate.
   */
  public async simulateKeys(keys: IKeySequence) {
    // We first need to convert the given DOM key names to X11 key codes. If a key code is
    // not found, we throw an error.
    const keyCodes = keys.map((key) => {
      const code = LinuxKeyCodes.get(key.name);

      if (code === undefined) {
        throw new Error(`Unknown key: ${key.name}`);
      }

      return code;
    });

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
   * This has to be implemented by a derived class. There is no compositer-agnostic way to
   * handle shortcuts.
   *
   * @param shortcut The shortcut to simulate.
   * @returns A promise which resolves when the shortcut has been simulated.
   */
  public async bindShortcut(shortcut: Shortcut) {
    throw new Error('Not implemented.');
  }

  /**
   * This has to be implemented by a derived class. There is no compositer-agnostic way to
   * handle shortcuts.
   *
   * @param shortcut The shortcut to unbind.
   */
  public async unbindShortcut(shortcut: Shortcut) {
    throw new Error('Not implemented.');
  }

  /**
   * This has to be implemented by a derived class. There is no compositer-agnostic way to
   * handle shortcuts.
   */
  public async unbindAllShortcuts() {
    throw new Error('Not implemented.');
  }
}

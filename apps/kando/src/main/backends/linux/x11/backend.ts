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
import { screen } from 'electron';

/**
 * This backend uses the XTest extension via native C++ code to simulate key presses and
 * mouse movements. It also uses the X11 library to get the currently focused window.
 *
 * This backend is the default on X11-based Linux desktops. It should work on most desktop
 * environments, but you could also create derived backends for your specific desktop
 * environments if needed.
 */
export class X11Backend extends LinuxBackend {
  /**
   * Override this if another type is more suitable for your desktop environment.
   * https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions
   */
  public getBackendInfo() {
    return {
      name: 'X11',
      menuWindowType: 'dock',
      supportsShortcuts: true,
      shouldUseTransparentSettingsWindow: false,
    };
  }

  /** This is called when the backend is created. Currently, this this does nothing on X11. */
  public async init() {}

  /** We only need to unbind all shortcuts when the backend is destroyed. */
  public async deinit(): Promise<void> {
    await this.bindShortcuts([]);
  }

  /**
   * This uses the X11 library to get the name and app of the currently focused window. In
   * addition, it returns the current pointer position.
   *
   * @returns The name and app of the currently focused window as well as the current
   *   pointer position.
   */
  public async getWMInfo() {
    // Starting with Electron 29, the cursorScreenPoint() method is unreliable on X11. It
    // returns the a position where the pointer has been a couple of milliseconds ago.
    // Therefore, we use the native module to get the pointer position.
    // const pointer = screen.getCursorScreenPoint();

    const info = native.getWMInfo();

    // For some reason, this makes the method much faster. For now, I have no idea why.
    process.nextTick(() => {});

    return {
      windowName: info.window || '',
      appName: info.app || '',
      pointerX: info.pointerX || 0,
      pointerY: info.pointerY || 0,
      workArea: screen.getDisplayNearestPoint({
        x: info.pointerX || 0,
        y: info.pointerY || 0,
      }).workArea,
    };
  }

  /**
   * Moves the pointer by the given amount using the native module.
   *
   * @param dx The amount of horizontal movement.
   * @param dy The amount of vertical movement.
   */
  public async movePointer(dx: number, dy: number) {
    native.movePointer(dx, dy);
  }

  /**
   * This simulates a key sequence by sending the keys to the currently focused window
   * using the XTest X11 extension. If one of the given keys in the sequence is not known,
   * an exception will be thrown.
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
}

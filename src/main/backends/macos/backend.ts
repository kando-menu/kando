//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { native } from './native';
import { screen, app } from 'electron';
import { Backend } from '../backend';
import { IKeySequence } from '../../../common';
import { mapKeys } from '../../../common/key-codes';

export class MacosBackend extends Backend {
  /**
   * On macOS, the window type is set to 'panel'. This makes sure that the window is
   * always on top of other windows and that it is shown on all workspaces.
   */
  public getBackendInfo() {
    return {
      name: 'macOS',
      menuWindowType: 'normal',
      supportsShortcuts: true,
      shouldUseTransparentSettingsWindow: true,
    };
  }

  /** On macOS, we use this to hide the dock icon. */
  public async init() {
    // Is there a way to hide the dock icon on macOS initially? If we hide it here, it
    // will be shown for a short moment when the app is started.
    app.dock.hide();
  }

  /** We only need to unbind all shortcuts when the backend is destroyed. */
  public async deinit(): Promise<void> {
    await this.bindShortcuts([]);
  }

  /**
   * @returns The name and class of the currently focused window as well as the current
   *   pointer position.
   */
  public async getWMInfo() {
    const pointer = screen.getCursorScreenPoint();
    const { name, app } = native.getActiveWindow();

    // For some reason, this makes the method much faster. For now, I have no idea why.
    process.nextTick(() => {});

    return {
      windowName: name,
      appName: app,
      pointerX: pointer.x,
      pointerY: pointer.y,
      workArea: screen.getDisplayNearestPoint({
        x: pointer.x,
        y: pointer.y,
      }).workArea,
    };
  }

  /**
   * Moves the pointer by the given amount.
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
   * If one of the given keys in the sequence is not known, an exception will be thrown.
   *
   * @param shortcut The keys to simulate.
   */
  public async simulateKeys(keys: IKeySequence) {
    // We first need to convert the given DOM key names to Apple key codes.  If a key code is
    // not found, this throws an error.
    const keyCodes = mapKeys(keys, 'macos');

    // Now simulate the key presses. We wait a couple of milliseconds if the key has a
    // delay specified.
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].delay > 0) {
        await new Promise((resolve) => {
          setTimeout(resolve, keys[i].delay);
        });
      }

      native.simulateKey(keyCodes[i], keys[i].down);
    }
  }
}

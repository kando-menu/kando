//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import os from 'node:os';
import { screen } from 'electron';
import { native } from './native';
import { Backend } from '../backend';
import { IKeySequence } from '../../../common';
import { mapKeys } from '../../../common/key-codes';

/**
 * This backend is used on Windows. It uses the native Win32 API to simulate key presses
 * and mouse movements. It also uses the Win32 API to get the currently focused window.
 */
export class WindowsBackend extends Backend {
  /**
   * On Windows, the 'toolbar' window type is used. This is actually the only window type
   * supported by Electron on Windows.
   */
  public getBackendInfo() {
    // Vibrancy is only supported on Windows 11 22H2 (build 22621) or higher.
    const release = os.release().split('.');
    const major = parseInt(release[0]);
    const minor = parseInt(release[1]);
    const build = parseInt(release[2]);

    const transparencySupported = major === 10 && minor === 0 && build >= 22621;

    return {
      name: 'Windows',
      menuWindowType: 'toolbar',
      supportsShortcuts: true,
      shouldUseTransparentSettingsWindow: transparencySupported,
    };
  }

  /**
   * This is called when the backend is created. Currently, this this does nothing on
   * Windows.
   */
  public async init() {}

  /** We only need to unbind all shortcuts when the backend is destroyed. */
  public async deinit(): Promise<void> {
    await this.bindShortcuts([]);
  }

  /**
   * This uses the Win23 API to get the name and app of the currently focused window. In
   * addition, it uses Electron's screen module to get the current pointer position.
   *
   * @returns The name and app of the currently focused window as well as the current
   *   pointer position.
   */
  public async getWMInfo() {
    const window = native.getActiveWindow();
    const pointer = screen.getCursorScreenPoint();

    // For some reason, this makes the method much faster. For now, I have no idea why.
    process.nextTick(() => {});

    return {
      windowName: window.name,
      appName: window.app,
      pointerX: pointer.x,
      pointerY: pointer.y,
      workArea: screen.getDisplayNearestPoint({
        x: pointer.x,
        y: pointer.y,
      }).workArea,
    };
  }

  /**
   * Moves the pointer by the given amount using the Win32 API.
   *
   * @param dx The amount of horizontal movement.
   * @param dy The amount of vertical movement.
   */
  public async movePointer(dx: number, dy: number) {
    native.movePointer(dx, dy);
  }

  /**
   * This simulates a key sequence using the Windows API. If one of the given keys in the
   * sequence is not known, an exception will be thrown.
   *
   * @param keys The keys to simulate.
   */
  public async simulateKeys(keys: IKeySequence) {
    // We first need to convert the given DOM key names to Win32 key codes. If a key code is
    // not found, this throws an error.
    const keyCodes = mapKeys(keys, 'windows');

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

  /**
   * This fixes the acrylic effect on Windows after the window has been maximized. See
   * here: https://github.com/electron/electron/issues/42393
   *
   * @param hwnd The window handle.
   */
  public async fixAcrylicEffect(hwnd: number) {
    native.fixAcrylicEffect(hwnd);
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { screen, globalShortcut } from 'electron';
import { exec } from 'node:child_process';
import { native } from './native';
import { Backend } from '../../backend';

/**
 * This backend uses the xdotool command line tool to simulate key presses and mouse
 * movements. It also uses the X11 library to get the currently focused window.
 *
 * This backend is the default on X11-based Linux desktops. It should work on most desktop
 * environments, but you could also create derived backends for your specific desktop
 * environments if needed.
 */
export class X11Backend implements Backend {
  /**
   * Override this if another type is more suitable for your desktop environment.
   * https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions
   *
   * @returns 'dock'
   */
  public getWindowType() {
    return 'dock';
  }

  /**
   * This is called when the backend is created. Currently, this this does nothing on X11.
   */
  public async init() {}

  /**
   * This uses the X11 library to get the name and class of the currently focused window.
   * In addition, it uses Electron's screen module to get the current pointer position.
   *
   * @returns The name and class of the currently focused window as well as the current
   *   pointer position.
   */
  public async getWMInfo() {
    const window = native.getActiveWindow();
    const pointer = screen.getCursorScreenPoint();
    return {
      windowName: window.name,
      windowClass: window.wmClass,
      pointerX: pointer.x,
      pointerY: pointer.y,
    };
  }

  /**
   * Moves the pointer by the given amount using xdotool.
   *
   * @param dx The amount of horizontal movement.
   * @param dy The amount of vertical movement.
   */
  public async movePointer(dx: number, dy: number) {
    exec(`xdotool mousemove_relative ${dx} ${dy}`);
  }

  /**
   * This simulates a shortcut by sending the keys to the currently focused window using
   * xdotool.
   *
   * @param shortcut The shortcut to simulate.
   * @todo: Add information about the string format of the shortcut.
   */
  public async simulateShortcut(shortcut: string) {
    return new Promise<void>((resolve, reject) => {
      exec(`xdotool key ${shortcut}`, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * This binds a shortcut to a callback function. The callback function is called when
   * the shortcut is pressed. On X11, this uses Electron's globalShortcut module.
   *
   * @param shortcut The shortcut to simulate.
   * @returns A promise which resolves when the shortcut has been simulated.
   * @todo: Add information about the string format of the shortcut.
   */
  public async bindShortcut(shortcut: string, callback: () => void) {
    if (!globalShortcut.register(shortcut, callback)) {
      throw new Error('Shortcut is already in use.');
    }
  }

  /**
   * This unbinds a previously bound shortcut.
   *
   * @param shortcut The shortcut to unbind.
   */
  public async unbindShortcut(shortcut: string) {
    globalShortcut.unregister(shortcut);
  }

  /**
   * This unbinds all previously bound shortcuts.
   */
  public async unbindAllShortcuts() {
    globalShortcut.unregisterAll();
  }
}

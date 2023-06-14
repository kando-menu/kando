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
import { Backend, Shortcut } from '../backend';

/**
 * This backend is used on Windows. It uses the native Win32 API to simulate key presses
 * and mouse movements. It also uses the Win32 API to get the currently focused window.
 */
export class Win32Backend implements Backend {
  /**
   * On Windows, the 'toolbar' window type is used. This is actually the only window type
   * supported by Electron on Windows.
   *
   * @returns 'toolbar'
   */
  public getWindowType() {
    return 'toolbar';
  }

  /**
   * This is called when the backend is created. Currently, this this does nothing on
   * Windows.
   */
  public async init() {}

  /**
   * This uses the Win23 API to get the name and class of the currently focused window. In
   * addition, it uses Electron's screen module to get the current pointer position.
   *
   * @returns The name and class of the currently focused window as well as the current
   *   pointer position.
   */
  public async getWMInfo() {
    const window = native.getActiveWindow();
    const pointer = screen.getCursorScreenPoint();

    // For some reason, this makes the method much faster. For now, I have no idea why.
    process.nextTick(() => {});

    return {
      windowName: window.name,
      windowClass: window.wmClass,
      pointerX: pointer.x,
      pointerY: pointer.y,
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
   * This simulates a shortcut using a powershell command.
   *
   * @param shortcut The shortcut to simulate.
   * @todo: Add information about the string format of the shortcut.
   */
  public async simulateShortcut(shortcut: string) {
    return new Promise<void>((resolve, reject) => {
      try {
        shortcut = this.toPowershellAccelerator(shortcut);
      } catch (err) {
        reject(err);
        return;
      }

      exec(
        `powershell -command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('${shortcut}')"`,
        (err: Error) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * This binds a shortcut. The action callback is called when the shortcut is pressed. On
   * Windows, this uses Electron's globalShortcut module.
   *
   * @param shortcut The shortcut to bind.
   * @returns A promise which resolves when the shortcut has been simulated.
   */
  public async bindShortcut(shortcut: Shortcut) {
    if (!globalShortcut.register(shortcut.accelerator, shortcut.action)) {
      throw new Error('Shortcut is already in use.');
    }
  }

  /**
   * This unbinds a previously bound shortcut.
   *
   * @param shortcut The shortcut to unbind.
   */
  public async unbindShortcut(shortcut: Shortcut) {
    globalShortcut.unregister(shortcut.accelerator);
  }

  /**
   * This unbinds all previously bound shortcuts.
   */
  public async unbindAllShortcuts() {
    globalShortcut.unregisterAll();
  }

  /**
   * This converts a shortcut from the format used by Electron to the format used by
   * PowerShell.
   *
   * @param shortcut The shortcut to translate.
   * @returns The translated shortcut.
   * @todo: Add information about the string format of the shortcut.
   */
  private toPowershellAccelerator(shortcut: string) {
    if (shortcut.includes('Option')) {
      throw new Error('Shortcuts including Option are not yet supported on Windows.');
    }

    if (shortcut.includes('AltGr')) {
      throw new Error('Shortcuts including AltGr are not yet supported on Windows.');
    }

    if (shortcut.includes('Meta')) {
      throw new Error('Shortcuts including Meta are not yet supported on Windows.');
    }

    if (shortcut.includes('Super')) {
      throw new Error('Shortcuts including Super are not yet supported on Windows.');
    }

    shortcut = shortcut.replace('^', '{^}');
    shortcut = shortcut.replace('%', '{%}');
    shortcut = shortcut.replace('CommandOrControl+', '^');
    shortcut = shortcut.replace('CmdOrCtrl+', '^');
    shortcut = shortcut.replace('Command+', '^');
    shortcut = shortcut.replace('Control+', '^');
    shortcut = shortcut.replace('Cmd+', '^');
    shortcut = shortcut.replace('Ctrl+', '^');
    shortcut = shortcut.replace('Alt+', '%');
    shortcut = shortcut.replace('Shift+', '+');
    shortcut = shortcut.replace('Tab', '{tab}');

    return shortcut;
  }
}

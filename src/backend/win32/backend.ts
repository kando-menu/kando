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
import { Backend } from '../backend';

export class Win32Backend implements Backend {
  constructor() {
    console.log('Win32 backend created.');
  }

  // This is called when the backend is created. Currently, this this does nothing on
  // Windows.
  public async init() {}

  // Returns the current pointer position. For now, it does not return the modifiers.
  public async getPointer() {
    const pos = screen.getCursorScreenPoint();
    return { x: pos.x, y: pos.y, mods: 0 };
  }

  // Returns the name and class of the currently focused window.
  public async getFocusedWindow() {
    const w = native.getActiveWindow();
    console.log(w);
    return w;
  }

  // This simulates a shortcut by sending the keys to the currently focused window.
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

  // This binds a shortcut to a callback. The callback is called when the shortcut is pressed.
  public async bindShortcut(shortcut: string, callback: () => void) {
    if (!globalShortcut.register(shortcut, callback)) {
      throw new Error('Shortcut is already in use.');
    }
  }

  // This unbinds a shortcut.
  public async unbindShortcut(shortcut: string) {
    globalShortcut.unregister(shortcut);
  }

  // This unbinds all shortcuts.
  public async unbindAllShortcuts() {
    globalShortcut.unregisterAll();
  }

  // This converts a shortcut from the format used by Electron to the format used by
  // PowerShell.
  private toPowershellAccelerator(shortcut: string) {
    if (shortcut.includes('Option')) {
      throw new Error('Shortcuts including Option are not yet supported on GNOME.');
    }

    if (shortcut.includes('AltGr')) {
      throw new Error('Shortcuts including AltGr are not yet supported on GNOME.');
    }

    if (shortcut.includes('Meta')) {
      throw new Error('Shortcuts including Meta are not yet supported on GNOME.');
    }

    if (shortcut.includes('Super')) {
      throw new Error('Shortcuts including Super are not yet supported on GNOME.');
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

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

export class X11Backend implements Backend {
  constructor() {
    console.log('X11 backend created.');
  }

  // This is called when the backend is created. Currently, this this does nothing on X11.
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
      exec(`xdotool key ${shortcut}`, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // This binds a shortcut to a callback function. The callback function is called
  // when the shortcut is pressed.
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
}

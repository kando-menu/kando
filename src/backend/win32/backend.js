//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do,                 //
//     . <   _|   .  | ____| |  | (   |    the open-source cross-platform pie menu.     //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

const electron = require('electron');
const {exec}   = require('node:child_process');
const native   = require('./native');

export default class Backend {
  constructor() {
    console.log('Win32 backend created');
  }

  async init() {}

  async getPointer() {
    let pos = electron.screen.getCursorScreenPoint();
    return {x: pos.x, y: pos.y, mods: 0};
  }

  async getFocusedWindow() {
    const w = native.getActiveWindow();
    console.log(w);
    return w;
  }

  async simulateShortcut(shortcut) {
    return new Promise((resolve, reject) => {
      try {
        shortcut = this._toPowershellAccelerator(shortcut);
      } catch (err) {
        reject(err);
        return;
      }

      exec(
        `powershell -command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('${
          shortcut}')"`,
        err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });
  }

  async bindShortcut(shortcut, callback) {
    if (!electron.globalShortcut.register(shortcut, callback)) {
      throw new Error('Shortcut is already in use.');
    }
  }

  async unbindShortcut(shortcut) {
    electron.globalShortcut.unregister(shortcut);
  }

  async unbindAllShortcuts() {
    electron.globalShortcut.unregisterAll();
  }

  _toPowershellAccelerator(shortcut) {
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
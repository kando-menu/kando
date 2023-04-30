//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do, the truly       //
//     . <   _|   .  | ____| |  | (   |    amazing cross-platform marking menu.         //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

const electron = require('electron');
const {exec}   = require('node:child_process');

export default class Backend {
  constructor() {
    console.log('Win32 backend created');
  }

  connect() {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  getPointer() {
    return new Promise(resolve => {
      let pos = electron.screen.getCursorScreenPoint();
      resolve({x: pos.x, y: pos.y, mods: 0});
    });
  }

  getFocusedWindow() {
    return new Promise((resolve, reject) => {
      exec(`dir`, (err, stdout) => {
        if (err) {
          reject(err);
          return;
        }

        // ...
        //   resolve({name: title, wmClass: wmClass});
        resolve({name: 'title', wmClass: 'wmClass'});
      });
    });
  }

  simulateShortcut(shortcut) {
    return new Promise((resolve, reject) => {
      try {
        shortcut = this._toPowershellAccelerator(shortcut);
      } catch (err) {
        reject(err);
        return;
      }

      exec(`powershell -command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('${shortcut}')"`, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  bindShortcut(shortcut, callback) {
    return new Promise((resolve, reject) => {
      if (electron.globalShortcut.register(shortcut, callback)) {
        resolve();
      } else {
        reject('Shortcut is already in use.');
      }
    });
  }

  unbindShortcut(shortcut) {
    return new Promise(resolve => {
      electron.globalShortcut.unregister(shortcut);
      resolve();
    });
  }

  unbindAllShortcuts() {
    return new Promise(resolve => {
      electron.globalShortcut.unregisterAll();
      resolve();
    });
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
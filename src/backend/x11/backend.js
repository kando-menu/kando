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
    console.log('X11 backend created.');
  }

  // This is called when the backend is created. Currently, this this does nothing on X11.
  async init() {}

  // Returns the current pointer position. For now, it does not return the modifiers.
  async getPointer() {
    const pos = electron.screen.getCursorScreenPoint();
    return {x: pos.x, y: pos.y, mods: 0};
  }

  // Returns the name and class of the currently focused window.
  async getFocusedWindow() {
    const w = native.getActiveWindow();
    console.log(w);
    return w;
  }

  // This simulates a shortcut by sending the keys to the currently focused window.
  async simulateShortcut(shortcut) {
    return new Promise((resolve, reject) => {
      exec(`xdotool key ${shortcut}`, err => {
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
  async bindShortcut(shortcut, callback) {
    if (!electron.globalShortcut.register(shortcut, callback)) {
      throw new Error('Shortcut is already in use.');
    }
  }

  // This unbinds a shortcut.
  async unbindShortcut(shortcut) {
    electron.globalShortcut.unregister(shortcut);
  }

  // This unbinds all shortcuts.
  async unbindAllShortcuts() {
    electron.globalShortcut.unregisterAll();
  }
}
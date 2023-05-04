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
const native   = require('./native');

export default class Backend {
  constructor() {
    console.log('X11 backend created');
  }

  async init() {}

  async getPointer() {
    const pos = electron.screen.getCursorScreenPoint();
    return {x: pos.x, y: pos.y, mods: 0};
  }

  async getFocusedWindow() {
    const w = native.getActiveWindow();
    console.log(w);
    return w;
  }

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
}
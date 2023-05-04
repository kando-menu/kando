//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do, the truly       //
//     . <   _|   .  | ____| |  | (   |    amazing cross-platform marking menu.         //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

const DBus = require('dbus-final');

export default class Backend {
  constructor() {
    console.log('GNOME backend created');

    this._callbacks = {};
  }

  async init() {
    if (this._interface) {
      return;
    }

    const bus = DBus.sessionBus();

    const obj = await bus.getProxyObject('org.gnome.Shell',
                                         '/org/gnome/shell/extensions/KenDoIntegration');

    this._interface = obj.getInterface('org.gnome.Shell.Extensions.KenDoIntegration');

    this._interface.on('ShortcutPressed', shortcut => {
      this._callbacks[shortcut]();
    });
  }

  async getPointer() {
    const [x, y, mods] = await this._interface.GetPointer();
    return {x: x, y: y, mods: mods};
  }

  async getFocusedWindow() {
    const [name, wmClass] = await this._interface.GetFocusedWindow();
    return {name: name, wmClass: wmClass};
  }

  async simulateShortcut(shortcut) {
    shortcut = this._toGdkAccelerator(shortcut);

    const success = await this._interface.SimulateShortcut(shortcut);

    if (!success) {
      throw new Error('Failed to simulate shortcut.');
    }
  }

  async bindShortcut(shortcut, callback) {
    shortcut = this._toGdkAccelerator(shortcut);

    const success = await this._interface.BindShortcut(shortcut);

    if (!success) {
      throw new Error('Shortcut is already in use.');
    }

    this._callbacks[shortcut] = callback;
  }

  async unbindShortcut(shortcut) {
    shortcut = this._toGdkAccelerator(shortcut);

    const success = await this._interface.UnbindShortcut(shortcut);

    if (!success) {
      throw new Error('Shortcut was not bound.');
    }
  }

  async unbindAllShortcuts() {
    await this._interface.UnbindAllShortcuts();
  }

  _toGdkAccelerator(shortcut) {
    if (shortcut.includes('Option')) {
      throw new Error('Shortcuts including Option are not yet supported on GNOME.');
    }

    if (shortcut.includes('AltGr')) {
      throw new Error('Shortcuts including AltGr are not yet supported on GNOME.');
    }

    shortcut = shortcut.replace('CommandOrControl+', '<Ctrl>');
    shortcut = shortcut.replace('CmdOrCtrl+', '<Ctrl>');
    shortcut = shortcut.replace('Command+', '<Ctrl>');
    shortcut = shortcut.replace('Control+', '<Ctrl>');
    shortcut = shortcut.replace('Cmd+', '<Ctrl>');
    shortcut = shortcut.replace('Ctrl+', '<Ctrl>');
    shortcut = shortcut.replace('Alt+', '<Alt>');
    shortcut = shortcut.replace('Shift+', '<Shift>');
    shortcut = shortcut.replace('Meta+', '<Meta>');
    shortcut = shortcut.replace('Super+', '<Super>');

    return shortcut;
  }
}
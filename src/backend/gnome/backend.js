//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do,                 //
//     . <   _|   .  | ____| |  | (   |    the open-source cross-platform pie menu.     //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

const DBus = require('dbus-final');

export default class Backend {
  constructor() {
    console.log('GNOME backend created.');

    this._callbacks = {};
  }

  // Initializes the backend. This method must be called before any other method is
  // called. It connects to the DBus interface of the Ken-Do GNOME Shell integration
  // extension.
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

  // Returns the current pointer position and the currently pressed modifier keys.
  async getPointer() {
    const [x, y, mods] = await this._interface.GetPointer();
    return {x: x, y: y, mods: mods};
  }

  // Returns the name and the WM_CLASS of the currently focused window.
  async getFocusedWindow() {
    const [name, wmClass] = await this._interface.GetFocusedWindow();
    return {name: name, wmClass: wmClass};
  }

  // Simulates a keyboard shortcut.
  async simulateShortcut(shortcut) {
    shortcut = this._toGdkAccelerator(shortcut);

    const success = await this._interface.SimulateShortcut(shortcut);

    if (!success) {
      throw new Error('Failed to simulate shortcut.');
    }
  }

  // Binds a callback to a keyboard shortcut. The callback is called whenever the
  // shortcut is pressed.
  async bindShortcut(shortcut, callback) {
    shortcut = this._toGdkAccelerator(shortcut);

    const success = await this._interface.BindShortcut(shortcut);

    if (!success) {
      throw new Error('Shortcut is already in use.');
    }

    this._callbacks[shortcut] = callback;
  }

  // Unbinds a keyboard shortcut.
  async unbindShortcut(shortcut) {
    shortcut = this._toGdkAccelerator(shortcut);

    const success = await this._interface.UnbindShortcut(shortcut);

    if (!success) {
      throw new Error('Shortcut was not bound.');
    }
  }

  // Unbinds all keyboard shortcuts.
  async unbindAllShortcuts() {
    await this._interface.UnbindAllShortcuts();
  }

  // Translates a shortcut from the Electron format to the GDK format.
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
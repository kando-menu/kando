//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do,                 //
//     . <   _|   .  | ____| |  | (   |    the open-source cross-platform pie menu.     //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import DBus from 'dbus-final';
import { Backend } from '../backend';

export class GnomeBackend implements Backend {
  private callbacks: { [shortcut: string]: () => void } = {};
  private interface: DBus.ClientInterface | undefined;

  constructor() {
    console.log('GNOME backend created.');
  }

  // Initializes the backend. This method must be called before any other method is
  // called. It connects to the DBus interface of the Ken-Do GNOME Shell integration
  // extension.
  public async init() {
    if (this.interface) {
      return;
    }

    const bus = DBus.sessionBus();

    const obj = await bus.getProxyObject(
      'org.gnome.Shell',
      '/org/gnome/shell/extensions/KenDoIntegration'
    );

    this.interface = obj.getInterface('org.gnome.Shell.Extensions.KenDoIntegration');

    this.interface.on('ShortcutPressed', (shortcut: string) => {
      this.callbacks[shortcut]();
    });
  }

  // Returns the current pointer position and the currently pressed modifier keys.
  public async getPointer() {
    const [x, y, mods] = await this.interface.GetPointer();
    return { x: x, y: y, mods: mods };
  }

  // Returns the name and the WM_CLASS of the currently focused window.
  public async getFocusedWindow() {
    const [name, wmClass] = await this.interface.GetFocusedWindow();
    return { name: name, wmClass: wmClass };
  }

  // Simulates a keyboard shortcut.
  public async simulateShortcut(shortcut: string) {
    shortcut = this.toGdkAccelerator(shortcut);

    const success = await this.interface.SimulateShortcut(shortcut);

    if (!success) {
      throw new Error('Failed to simulate shortcut.');
    }
  }

  // Binds a callback to a keyboard shortcut. The callback is called whenever the
  // shortcut is pressed.
  public async bindShortcut(shortcut: string, callback: () => void) {
    shortcut = this.toGdkAccelerator(shortcut);

    const success = await this.interface.BindShortcut(shortcut);

    if (!success) {
      throw new Error('Shortcut is already in use.');
    }

    this.callbacks[shortcut] = callback;
  }

  // Unbinds a keyboard shortcut.
  public async unbindShortcut(shortcut: string) {
    shortcut = this.toGdkAccelerator(shortcut);

    const success = await this.interface.UnbindShortcut(shortcut);

    if (!success) {
      throw new Error('Shortcut was not bound.');
    }
  }

  // Unbinds all keyboard shortcuts.
  public async unbindAllShortcuts() {
    await this.interface.UnbindAllShortcuts();
  }

  // Translates a shortcut from the Electron format to the GDK format.
  private toGdkAccelerator(shortcut: string) {
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

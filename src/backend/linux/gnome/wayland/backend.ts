//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import DBus from 'dbus-final';
import { Backend } from '../../../backend';

/**
 * This backend uses the DBus interface of the Kando GNOME Shell integration extension to
 * interact with the system. As such, it only works on GNOME Shell with the Kando
 * extension installed. It would also work on X11, but the generic X11 backend is
 * preferred on X11 as it does not require any extensions.
 */
export class GnomeBackend implements Backend {
  // This maps GDK accelerator strings to the registered shortcuts.
  private callbacks: { [shortcut: string]: () => void } = {};

  // This is the DBus interface of the Kando GNOME Shell integration extension.
  private interface: DBus.ClientInterface;

  /**
   * Creates a new GNOME backend.
   */
  constructor() {
    console.log('GNOME backend created.');
  }

  /**
   * On GNOME Shell, we use a dock window. This creates a floating window which is always
   * on top of all other windows. It even stays visible during workspace switching.
   *
   * @returns 'dock'
   */
  public getWindowType() {
    return 'dock';
  }

  /**
   * Initializes the backend. It connects to the DBus interface of the Kando GNOME Shell
   * integration extension.
   */
  public async init() {
    if (this.interface) {
      return;
    }

    const bus = DBus.sessionBus();

    const obj = await bus.getProxyObject(
      'org.gnome.Shell',
      '/org/gnome/shell/extensions/KandoIntegration'
    );

    this.interface = obj.getInterface('org.gnome.Shell.Extensions.KandoIntegration');

    this.interface.on('ShortcutPressed', (shortcut: string) => {
      this.callbacks[shortcut]();
    });
  }

  /**
   * Returns the current pointer position and the currently pressed modifier keys.
   */
  public async getPointer() {
    const [x, y, mods] = await this.interface.GetPointer();
    return { x: x, y: y, mods: mods };
  }

  /**
   * Moves the pointer to the given position.
   *
   * @param x The x coordinate to move the pointer to.
   * @param y The y coordinate to move the pointer to.
   */
  public async movePointer(x: number, y: number) {
    await this.interface.MovePointer(x, y);
  }

  /**
   * This uses the DBus interface of the Kando GNOME Shell integration extension to
   * retrieve the name and class of the currently focused window.
   *
   * @returns The name and class of the currently focused window.
   */
  public async getFocusedWindow() {
    const [name, wmClass] = await this.interface.GetFocusedWindow();
    return { name: name, wmClass: wmClass };
  }

  /**
   * Simulates a keyboard shortcut.
   *
   * @param shortcut The shortcut to simulate.
   * @todo: Add information about the string format of the shortcut.
   */
  public async simulateShortcut(shortcut: string) {
    shortcut = this.toGdkAccelerator(shortcut);

    const success = await this.interface.SimulateShortcut(shortcut);

    if (!success) {
      throw new Error('Failed to simulate shortcut.');
    }
  }

  /**
   * Binds a callback to a keyboard shortcut. The callback is called whenever the shortcut
   * is pressed.
   *
   * @param shortcut The shortcut to simulate.
   * @returns A promise which resolves when the shortcut has been simulated.
   * @todo: Add information about the string format of the shortcut.
   */
  public async bindShortcut(shortcut: string, callback: () => void) {
    shortcut = this.toGdkAccelerator(shortcut);

    const success = await this.interface.BindShortcut(shortcut);

    if (!success) {
      throw new Error('Shortcut is already in use.');
    }

    this.callbacks[shortcut] = callback;
  }

  /**
   * This unbinds a previously bound shortcut.
   *
   * @param shortcut The shortcut to unbind.
   */
  public async unbindShortcut(shortcut: string) {
    shortcut = this.toGdkAccelerator(shortcut);

    const success = await this.interface.UnbindShortcut(shortcut);

    if (!success) {
      throw new Error('Shortcut was not bound.');
    }
  }

  /**
   * This unbinds all previously bound shortcuts.
   */
  public async unbindAllShortcuts() {
    await this.interface.UnbindAllShortcuts();
  }

  /**
   * Translates a shortcut from the Electron format to the GDK format.
   *
   * @param shortcut The shortcut to translate.
   * @returns The translated shortcut.
   * @todo: Add information about the string format of the shortcut.
   */
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

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import DBus from 'dbus-final';
import { Backend, Shortcut } from '../../../backend';

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

    this.interface.on('ShortcutPressed', (accelerator: string) => {
      this.callbacks[accelerator]();
    });
  }

  /**
   * This uses the DBus interface of the Kando GNOME Shell integration extension to get
   * the name and class of the currently focused window as well as the current pointer
   * position.
   *
   * @returns The name and class of the currently focused window as well as the current
   *   pointer position.
   */
  public async getWMInfo() {
    const info = await this.interface.GetWMInfo();
    return {
      windowName: info[0],
      windowClass: info[1],
      pointerX: info[2],
      pointerY: info[3],
    };
  }

  /**
   * Moves the pointer by the given amount.
   *
   * @param dx The amount of horizontal movement.
   * @param dy The amount of vertical movement.
   */
  public async movePointer(dx: number, dy: number) {
    await this.interface.MovePointer(dx, dy);
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
   * This binds a shortcut. The action callback is called when the shortcut is pressed. On
   * GNOME Wayland, this uses the DBus interface of the Kando GNOME Shell integration.
   *
   * @param shortcut The shortcut to simulate.
   * @returns A promise which resolves when the shortcut has been simulated.
   */
  public async bindShortcut(shortcut: Shortcut) {
    const accelerator = this.toGdkAccelerator(shortcut.accelerator);

    const success = await this.interface.BindShortcut(accelerator);

    if (!success) {
      throw new Error('Shortcut is already in use.');
    }

    this.callbacks[accelerator] = shortcut.action;
  }

  /**
   * This unbinds a previously bound shortcut.
   *
   * @param shortcut The shortcut to unbind.
   */
  public async unbindShortcut(shortcut: Shortcut) {
    const accelerator = this.toGdkAccelerator(shortcut.accelerator);

    const success = await this.interface.UnbindShortcut(accelerator);

    delete this.callbacks[accelerator];

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

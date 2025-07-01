//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';
import DBus from 'dbus-final';

import { Backend } from '../../../backend';
import { IKeySequence } from '../../../../../common';
import { mapKeys } from '../../../../../common/key-codes';
import { screen } from 'electron';

/**
 * This backend uses the DBus interface of the Kando GNOME Shell integration extension to
 * interact with the system. As such, it only works on GNOME Shell with the Kando
 * extension installed. It would also work on X11, but the generic X11 backend is
 * preferred on X11 as it does not require any extensions.
 */
export class GnomeBackend extends Backend {
  /**
   * This maps GDK shortcut strings to the registered shortcuts. This is required because
   * we want to emit the 'shortcutPressed' event with the original shortcut string, but
   * the DBus interface of the Kando GNOME Shell integration extension only accepts GDK
   * shortcuts.
   */
  private shortcutMap: { [gdkShortcut: string]: string } = {};

  /** This is the DBus interface of the Kando GNOME Shell integration extension. */
  private interface: DBus.ClientInterface;

  /**
   * Dock On GNOME Shell, we use a dock window. This creates a floating window which is
   * always on top of all other windows. It even stays visible during workspace
   * switching.
   */
  public getBackendInfo() {
    return {
      name: 'GNOME Wayland',
      menuWindowType: 'dock',
      supportsShortcuts: true,
      shouldUseTransparentSettingsWindow: false,
    };
  }

  /**
   * Initializes the backend. It connects to the DBus interface of the Kando GNOME Shell
   * integration extension.
   */
  public async init() {
    if (this.interface) {
      return;
    }

    try {
      const bus = DBus.sessionBus();

      const obj = await bus.getProxyObject(
        'org.gnome.Shell',
        '/org/gnome/shell/extensions/KandoIntegration'
      );

      this.interface = obj.getInterface('org.gnome.Shell.Extensions.KandoIntegration');
      this.interface.on('ShortcutPressed', (gdkShortcut: string) => {
        this.onShortcutPressed(this.shortcutMap[gdkShortcut]);
      });

      // There shouldn't be any shortcuts bound yet, but the GNOME Shell extension will
      // remember the shortcuts that were. If Kando crashed, some might still be bound.
      await this.interface.UnbindAllShortcuts();
    } catch (e) {
      throw new Error(
        i18next.t('backends.gnome.error', {
          link: 'https://extensions.gnome.org/extension/7068/kando-integration/',
          interpolation: { escapeValue: false },
        })
      );
    }
  }

  /** We only need to unbind all shortcuts when the backend is destroyed. */
  public async deinit(): Promise<void> {
    await this.bindShortcuts([]);
  }

  /**
   * This uses the DBus interface of the Kando GNOME Shell integration extension to get
   * the name and app of the currently focused window as well as the current pointer
   * position.
   *
   * @returns The name and app of the currently focused window as well as the current
   *   pointer position.
   */
  public async getWMInfo() {
    const info = await this.interface.GetWMInfo();
    return {
      windowName: info[0],
      appName: info[1],
      pointerX: info[2],
      pointerY: info[3],
      workArea: screen.getDisplayNearestPoint({
        x: info[2],
        y: info[3],
      }).workArea,
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
   * Simulates a sequence of key presses using the GNOME Shell extension. If one of the
   * given keys in the sequence is not known, an exception will be thrown.
   *
   * @param shortcut The keys to simulate.
   */
  public async simulateKeys(keys: IKeySequence) {
    // We first need to convert the given DOM key names to X11 key codes. If a key code is
    // not found, this throws an error.
    const keyCodes = mapKeys(keys, 'linux');

    // Now we create a list of tuples, each containing the information required for one
    // key event.
    const translatedKeys = [];
    for (let i = 0; i < keyCodes.length; ++i) {
      translatedKeys.push([keyCodes[i], keys[i].down, keys[i].delay]);
    }

    await this.interface.SimulateKeys(translatedKeys);
  }

  /**
   * On GNOME Wayland, the globalShortcuts module from Electron does not work. Instead, we
   * use the DBus interface of the Kando GNOME Shell integration extension to bind and
   * unbind shortcuts.
   *
   * @param shortcuts The shortcuts that should be bound now.
   * @param previouslyBound The shortcuts that were bound before this call.
   * @returns A promise which resolves when the shortcuts have been bound.
   */
  protected override async bindShortcutsImpl(
    shortcuts: string[],
    previouslyBound: string[]
  ) {
    // Use a shortcut if we unbind all shortcuts :)
    if (shortcuts.length === 0) {
      await this.interface.UnbindAllShortcuts();
      return;
    }

    const shortcutsToUnbind = previouslyBound.filter((s) => !shortcuts.includes(s));
    const shortcutsToBind = shortcuts.filter((s) => !previouslyBound.includes(s));

    // Unbind the obsolete shortcuts.
    for (const shortcut of shortcutsToUnbind) {
      await this.interface.UnbindShortcut(this.toGdkShortcut(shortcut));
    }

    // Bind the new shortcuts.
    let success = true;
    for (const shortcut of shortcutsToBind) {
      if (!(await this.interface.BindShortcut(this.toGdkShortcut(shortcut)))) {
        success = false;
      }
    }

    // If any of the shortcuts could not be bound, we throw an error.
    if (!success) {
      throw new Error('Invalid shortcut or it is already in use.');
    }
  }

  /**
   * Translates a shortcut from the Electron format to the GDK format. The Electron format
   * is described here: https://www.electronjs.org/docs/latest/api/shortcut Gdk uses the
   * key names from this file (simply without the GDK_KEY_ prefix):
   * https://gitlab.gnome.org/GNOME/gtk/-/blob/main/gdk/gdkkeysyms.h
   *
   * @param shortcut The shortcut to translate.
   * @returns The translated shortcut.
   * @todo: Add information about the string format of the shortcut.
   */
  private toGdkShortcut(shortcut: string) {
    if (shortcut.includes('Option')) {
      throw new Error('Shortcuts including Option are not yet supported on GNOME.');
    }

    if (shortcut.includes('AltGr')) {
      throw new Error('Shortcuts including AltGr are not yet supported on GNOME.');
    }

    // Split the shortcut into its parts.
    const parts = shortcut.split('+');

    const replacements = new Map([
      ['CommandOrControl', '<Ctrl>'],
      ['CmdOrCtrl', '<Ctrl>'],
      ['Command', '<Ctrl>'],
      ['Control', '<Ctrl>'],
      ['Cmd', '<Ctrl>'],
      ['Ctrl', '<Ctrl>'],
      ['Alt', '<Alt>'],
      ['Shift', '<Shift>'],
      ['Meta', '<Super>'],
      ['Super', '<Super>'],
      [')', 'parenright'],
      ['!', 'exclam'],
      ['@', 'at'],
      ['#', 'numbersign'],
      ['$', 'dollar'],
      ['%', 'percent'],
      ['^', 'asciicircum'],
      ['&', 'ampersand'],
      ['*', 'asterisk'],
      ['(', 'parenleft'],
      [':', 'colon'],
      [';', 'semicolon'],
      ["'", 'apostrophe'],
      ['=', 'equal'],
      ['<', 'less'],
      [',', 'comma'],
      ['_', 'underscore'],
      ['-', 'minus'],
      ['>', 'greater'],
      ['.', 'period'],
      ['?', 'question'],
      ['/', 'slash'],
      ['~', 'asciitilde'],
      ['`', 'grave'],
      ['{', 'braceleft'],
      [']', 'bracketright'],
      ['[', 'bracketleft'],
      ['|', 'bar'],
      ['\\', 'backslash'],
      ['}', 'braceright'],
      ['"', 'quotedbl'],
      ['Capslock', 'Caps_lock'],
      ['Numlock', 'Num_lock'],
      ['Scrolllock', 'Scroll_lock'],
      ['Enter', 'Return'],
      ['PageUp', 'Page_Up'],
      ['PageDown', 'PageDo_wn'],
      ['Esc', 'Escape'],
      ['VolumeUp', 'AudioRaiseVolume'],
      ['VolumeDown', 'AudioLowerVolume'],
      ['VolumeMute', 'AudioMute'],
      ['MediaNextTrack', 'AudioNext'],
      ['MediaPreviousTrack', 'AudioPrev'],
      ['MediaStop', 'AudioStop'],
      ['MediaPlayPause', 'AudioPause'],
      ['PrintScreen', 'Print'],
      ['num0', 'KP_0'],
      ['num1', 'KP_1'],
      ['num2', 'KP_2'],
      ['num3', 'KP_3'],
      ['num4', 'KP_4'],
      ['num5', 'KP_5'],
      ['num6', 'KP_6'],
      ['num7', 'KP_7'],
      ['num8', 'KP_8'],
      ['num9', 'KP_9'],
      ['numdec', 'KP_Decimal'],
      ['numadd', 'KP_Add'],
      ['numsub', 'KP_Subtract'],
      ['nummult', 'KP_Multiply'],
      ['numdiv', 'KP_Divide'],
    ]);

    const gdkShortcut = parts.map((part) => replacements.get(part) || part).join('');
    this.shortcutMap[gdkShortcut] = shortcut;
    return gdkShortcut;
  }
}

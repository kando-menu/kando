//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import Handlebars from 'handlebars';
import { EventEmitter } from 'events';

/**
 * This class displays a text input field with a button next to it which allows the user
 * to select a key combination. The user can either type the key combination directly into
 * the input field or press the button to enter a mode where the next key presses are
 * interpreted as the key combination. If the key combination is entered manually, the
 * input is validated and the user is informed by a red border around the input field if
 * the key combination is invalid.
 *
 * @fires changed - When the user selects a valid key combination. The event contains the
 *   new key combination as an argument.
 */
export class ShortcutPicker extends EventEmitter {
  /** The input field for directly editong the shortcut. */
  private shortcutInput: HTMLInputElement = null;

  /**
   * Creates a new IconPicker and appends it to the given container.
   *
   * @param container - The container to which the icon picker will be appended.
   */
  constructor(container: HTMLElement) {
    super();

    const template = Handlebars.compile(
      require('./templates/shortcut-picker.hbs').default
    );
    container.innerHTML = template({
      placeholder: 'Not Bound',
    });

    // Validate the input field when the user types something.
    this.shortcutInput = container.querySelector('input');
    this.shortcutInput.addEventListener('input', () => {
      if (this.isValidShortcut(this.shortcutInput.value)) {
        this.shortcutInput.classList.remove('invalid');
        this.shortcutInput.value = this.normalizeShortcut(this.shortcutInput.value);
        this.emit('changed', this.shortcutInput.value);
      } else {
        this.shortcutInput.classList.add('invalid');
      }
    });

    const shortcutButton = container.querySelector('button');
  }

  public setShortcut(shortcut: string) {
    this.shortcutInput.value = shortcut;
  }

  /**
   * This method checks if the given shortcut is valid. A shortcut is valid if it follows
   * the rules outlined in https://www.electronjs.org/docs/latest/api/accelerator. In
   * addition, this method is case-insensitive and the shortcut may be empty.
   *
   * @param shortcut The shortcut to validate
   * @returns True if the shortcut is valid, false otherwise.
   */
  private isValidShortcut(shortcut: string): boolean {
    // If the shortcut is empty, it is valid.
    if (shortcut === '') {
      return true;
    }

    // First we remove any whitespace and transform the shortcut to lowercase.
    shortcut = shortcut.replace(/\s/g, '').toLowerCase();

    // Make sure the shortcut does not start or end with a '+'.
    if (shortcut.startsWith('+') || shortcut.endsWith('+')) {
      return false;
    }

    // Split the shortcut into its parts.
    const parts = shortcut.split('+');

    const isModifier =
      /^(command|cmd|control|ctrl|commandorcontrol|cmdorctrl|alt|option|altgr|shift|super|meta)$/;
    const isKey =
      /^([0-9a-z)!@#$%^&*(:;+=<,_\->.?/~`{\][|\\}"']|f1*[1-9]|f10|f2[0-4]|plus|space|tab|capslock|numlock|scrolllock|backspace|delete|insert|return|enter|up|down|left|right|home|end|pageup|pagedown|escape|esc|volumeup|volumedown|volumemute|medianexttrack|mediaprevioustrack|mediastop|mediaplaypause|printscreen|num(?:[0-9]|dec|add|sub|mult|div))$/;

    // A valid shortcut must contain exactly one key and can contain any number of
    // modifiers.
    let hasKey = false;
    for (const part of parts) {
      if (isKey.test(part)) {
        if (hasKey) {
          return false;
        }
        hasKey = true;
      } else if (!isModifier.test(part)) {
        return false;
      }
    }

    return hasKey;
  }

  /**
   * This method normalizes the given shortcut. It removes all whitespace and transforms
   * the shortcut to proper CamelCase. Again, we follow this list of valid keys:
   * https://www.electronjs.org/docs/latest/api/accelerator
   *
   * @param shortcut The shortcut to normalize it should be a valid shortcut.
   * @returns The normalized shortcut.
   */
  private normalizeShortcut(shortcut: string): string {
    // We first remove any whitespace and transform the shortcut to lowercase.
    shortcut = shortcut.replace(/\s/g, '').toLowerCase();

    // We then selectively capitalize the parts of the shortcut. The first character of
    // each part is capitalized.
    const parts = shortcut.split('+');
    parts.forEach((part, index) => {
      parts[index] = part.charAt(0).toUpperCase() + part.slice(1);
    });

    // Then there are a few names which contain multiple capital letters.
    const multipleCapitals = new Map([
      ['Commandorcontrol', 'CommandOrControl'],
      ['Cmdorctrl', 'CmdOrCtrl'],
      ['Altgr', 'AltGr'],
      ['Pageup', 'PageUp'],
      ['Pagedown', 'PageDown'],
      ['Volumedown', 'VolumeDown'],
      ['Volumeup', 'VolumeUp'],
      ['Volumemute', 'VolumeMute'],
      ['Medianexttrack', 'MediaNextTrack'],
      ['Mediaprevioustrack', 'MediaPreviousTrack'],
      ['Mediastop', 'MediaStop'],
      ['Mediaplaypause', 'MediaPlayPause'],
      ['Printscreen', 'PrintScreen'],
    ]);

    parts.forEach((part, index) => {
      if (multipleCapitals.has(part)) {
        parts[index] = multipleCapitals.get(part);
      }
    });

    return parts.join('+');
  }
}

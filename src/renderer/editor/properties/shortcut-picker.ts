//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { TextPicker } from './text-picker';

/**
 * This class displays a text input field with a button next to it which allows the user
 * to select a keyboard shortcut for opening a menu. The user can either type the keyboard
 * shortcut directly into the input field or press the button to enter a mode where the
 * next key presses are interpreted as the keyboard shortcut.
 *
 * There is also the HotkeyPicker which is similar to this class. See its documentation
 * for more information.
 *
 * The shortcut selected by this class is validated against the globalShortcut module of
 * Electron. See https://www.electronjs.org/docs/latest/api/accelerator for more
 * information.
 */
export class ShortcutPicker extends TextPicker {
  /**
   * This maps from key codes to key names. Key codes represent physical keys on the
   * keyboard, key names represent the characters which are generated when the specific
   * key is pressed. The latter depends on the current keyboard layout.
   *
   * This is used to get the names of of shifted keys. For instance, if the user presses
   * Shift+1, we usually get '!'. We want to display 'Shift+1' instead.
   */
  private keymap = new Map<string, string>();

  /**
   * Creates a new ShortcutPicker. You must call getContainer() of the parent class to get
   * the container which contains the picker.
   */
  constructor() {
    super({
      label: i18next.t('properties.shortcut-picker.label'),
      hint: i18next.t('properties.shortcut-picker.hint'),
      lines: 1,
      placeholder: i18next.t('properties.common.not-bound'),
      recordingPlaceholder: i18next.t('properties.shortcut-picker.recording'),
      enableRecording: true,
      resetOnBlur: true,
    });

    // Retrieve the keymap from the system.
    // @ts-expect-error The navigator is indeed available in Electron
    window.navigator.keyboard.getLayoutMap().then((keymap) => {
      this.keymap = keymap;
    });
  }

  /**
   * This method normalizes the given shortcut. It removes all whitespace and transforms
   * the shortcut to proper CamelCase. Again, we follow this list of valid keys:
   * https://www.electronjs.org/docs/latest/api/accelerator
   *
   * @param shortcut The shortcut to normalize.
   * @returns The normalized shortcut.
   */
  protected override normalizeInput(shortcut: string): string {
    // We first remove any whitespace and transform the shortcut to lowercase.
    shortcut = shortcut.replace(/\s/g, '').toLowerCase();

    // We then selectively capitalize the parts of the shortcut. The first character of
    // each part is capitalized, except for the num* keys.
    let parts = shortcut.split('+');
    parts.forEach((part, index) => {
      if (part.startsWith('num')) {
        parts[index] = part;
      } else {
        parts[index] = part.charAt(0).toUpperCase() + part.slice(1);
      }
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

    parts = parts.map((part) => multipleCapitals.get(part) || part);

    // There are also some shorthands we want to resolve.
    const shorthands = new Map([
      ['Ctrl', 'Control'],
      ['Cmd', 'Command'],
      ['Esc', 'Escape'],
    ]);

    parts = parts.map((part) => shorthands.get(part) || part);

    return parts.join('+');
  }

  /**
   * This method checks if the given shortcut is valid. A shortcut is valid if it follows
   * the rules outlined in https://www.electronjs.org/docs/latest/api/accelerator. An
   * empty shortcut is also considered valid.
   *
   * @param shortcut The normalized shortcut to validate.
   * @returns True if the shortcut is valid, false otherwise.
   */
  protected override isValid(shortcut: string): boolean {
    // If the shortcut is empty, it is valid.
    if (shortcut === '') {
      return true;
    }

    // Make sure the shortcut does not start or end with a '+'.
    if (shortcut.startsWith('+') || shortcut.endsWith('+')) {
      return false;
    }

    // Split the shortcut into its parts.
    const parts = shortcut.split('+');

    // A valid shortcut must contain exactly one key and can contain any number of
    // modifiers.
    let hasKey = false;
    for (const part of parts) {
      if (this.isValidKey(part)) {
        if (hasKey) {
          return false;
        }
        hasKey = true;
      } else if (!this.isValidModifier(part)) {
        return false;
      }
    }

    return hasKey;
  }

  /**
   * This method appends a key according to the given KeyboardEvent to the input field.
   * The method returns true if the shortcut is complete.
   *
   * The key is determined by the KeyboardEvent.code property and the modifier state. The
   * shortcut is formatted according to the rules outlined in
   * https://www.electronjs.org/docs/latest/api/accelerator.
   *
   * @param event The KeyboardEvent to get the shortcut for.
   * @returns False
   */
  protected override recordInput(event: KeyboardEvent): boolean {
    // Ignore key up events.
    if (event.type === 'keyup') {
      return false;
    }

    const parts = this.input.value.split('+').filter((part) => part !== '');

    const push = (part: string) => {
      if (!parts.includes(part)) {
        parts.push(part);
      }
    };

    if (event.ctrlKey) {
      push('Control');
    }

    if (event.shiftKey) {
      push('Shift');
    }

    if (event.altKey) {
      push('Alt');
    }

    if (event.metaKey) {
      push('Meta');
    }

    let key = this.keymap.get(event.code) || event.key;

    // Some DOM names differ from the names used by Electron. We need to map them.
    const nameMap = new Map([
      ['+', 'Plus'],
      [' ', 'Space'],
      ['Enter', 'Return'],
      ['ArrowUp', 'Up'],
      ['ArrowDown', 'Down'],
      ['ArrowLeft', 'Left'],
      ['ArrowRight', 'Right'],
    ]);

    key = nameMap.get(key) || key;

    // Fix the case of the key.
    key = this.normalizeInput(key);

    // We can explicitly bind to numpad keys. We check location property to determine
    // if the key is on the numpad.
    if (event.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) {
      const nameMap = new Map([
        ['0', 'num0'],
        ['1', 'num1'],
        ['2', 'num2'],
        ['3', 'num3'],
        ['4', 'num4'],
        ['5', 'num5'],
        ['6', 'num6'],
        ['7', 'num7'],
        ['8', 'num8'],
        ['9', 'num9'],
        [',', 'numdec'],
        ['+', 'numadd'],
        ['-', 'numsub'],
        ['*', 'nummult'],
        ['/', 'numdiv'],
      ]);

      key = nameMap.get(key) || key;
    }

    const isComplete = this.isValidKey(key);

    if (isComplete) {
      parts.push(key);
    }

    this.input.value = parts.join('+');

    return isComplete;
  }

  /**
   * This method checks if the given modifier is valid. A modifier is valid if it is one
   * of the strings listed in https://www.electronjs.org/docs/latest/api/accelerator.
   *
   * @param modifier The modifier to validate.
   * @returns True if the modifier is valid, false otherwise.
   */
  private isValidModifier(modifier: string): boolean {
    const isModifier =
      /^(Command|Cmd|Control|Ctrl|CommandOrControl|CmdOrCtrl|Alt|Option|AltGr|Shift|Super|Meta)$/;
    return isModifier.test(modifier);
  }

  /**
   * This method checks if the given key is valid. A key is valid if it is one of the
   * strings listed in https://www.electronjs.org/docs/latest/api/accelerator.
   *
   * @param key The key to validate.
   * @returns True if the key is valid, false otherwise.
   */
  private isValidKey(key: string): boolean {
    const isKey =
      /^([0-9A-Z)!@#$%^&*(:;+=<,_\->.?/~`{\][|\\}"']|F1*[1-9]|F10|F2[0-4]|Plus|Space|Tab|Capslock|Numlock|Scrolllock|Backspace|Delete|Insert|Return|Enter|Up|Down|Left|Right|Home|End|PageUp|PageDown|Escape|Esc|VolumeUp|VolumeDown|VolumeMute|MediaNextTrack|MediaPreviousTrack|MediaStop|MediaPlayPause|PrintScreen|num(?:[0-9]|dec|add|sub|mult|div))$/;
    return isKey.test(key);
  }
}

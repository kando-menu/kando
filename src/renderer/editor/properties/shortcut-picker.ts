//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';

/**
 * This class displays a text input field with a button next to it which allows the user
 * to select a key combination. The user can either type the key combination directly into
 * the input field or press the button to enter a mode where the next key presses are
 * interpreted as the key combination. If the key combination is entered manually, the
 * input is validated and the user is informed by a red border around the input field if
 * the key combination is invalid.
 *
 * For now, the key combinations is validated against the globalShortcut module of
 * Electron. See https://www.electronjs.org/docs/latest/api/accelerator for more
 * information.
 *
 * @fires changed - When the user selects a valid key combination. The event contains the
 *   new key combination as an argument.
 */
export class ShortcutPicker extends EventEmitter {
  /** The input field for directly editing the shortcut. */
  private shortcutInput: HTMLInputElement = null;

  /**
   * This maps from key codes to key names. Key codes represent physical keys on the
   * keyboard, key names represent the characters which are generated when the specific
   * key is pressed. The latter depends on the current keyboard layout.
   */
  private keymap = new Map<string, string>();

  /**
   * Creates a new ShortcutPicker and appends it to the given container.
   *
   * @param container - The container to which the icon picker will be appended.
   */
  constructor(container: HTMLElement) {
    super();

    // Retrieve the keymap from the system.
    // @ts-expect-error The navigator is indeed available in Electron
    window.navigator.keyboard.getLayoutMap().then((keymap) => {
      this.keymap = keymap;
    });

    // Render the template.
    const template = require('./templates/shortcut-picker.hbs');
    container.innerHTML = template({
      placeholder: 'Not Bound',
      withButton: true,
    });

    // Validate the input field when the user types something. If the input is valid, we
    // emit a 'changed' event.
    this.shortcutInput = container.querySelector('input');
    this.shortcutInput.addEventListener('input', () => {
      const shortcut = this.normalizeShortcut(this.shortcutInput.value);
      if (this.isValidShortcut(shortcut)) {
        this.shortcutInput.classList.remove('invalid');
        this.shortcutInput.value = shortcut;
        this.emit('changed', this.shortcutInput.value);
      } else {
        this.shortcutInput.classList.add('invalid');
      }
    });

    // When the user clicks the button, we enter a mode where the next key presses are
    // interpreted as the key combination. The mode is aborted when...
    // ... the user clicks anywhere on the screen
    // ... the user entered a valid key combination
    const shortcutButton = container.querySelector('button');
    shortcutButton.addEventListener('click', (event) => {
      event.stopPropagation();

      // Unbind all shortcuts. This is necessary because else the user could not enter
      // shortcuts which are already bound.
      window.api.inhibitShortcuts();

      const originalShortcut = this.shortcutInput.value;
      this.shortcutInput.placeholder = 'Press a shortcut...';
      this.shortcutInput.value = '';
      this.shortcutInput.classList.add('glowing');

      // eslint-disable-next-line prefer-const
      let clickHandler: (ev: MouseEvent) => void;

      // eslint-disable-next-line prefer-const
      let keyHandler: (ev: KeyboardEvent) => void;

      // Reverts the input field to its original state.
      const reset = () => {
        this.shortcutInput.placeholder = 'Not Bound';
        this.shortcutInput.classList.remove('glowing');
        window.removeEventListener('click', clickHandler);
        window.removeEventListener('keydown', keyHandler, true);
        window.removeEventListener('keyup', keyHandler, true);

        // Rebind all shortcuts.
        window.api.uninhibitShortcuts();
      };

      // Reset the input field to the original state when the user clicks anywhere on
      // the screen.
      clickHandler = (event: MouseEvent) => {
        event.stopPropagation();
        this.shortcutInput.value = originalShortcut;
        reset();
      };

      // Update the input field when the user presses a key. If the key is a valid part
      // of a shortcut, we update the input field accordingly. If the shortcut is
      // complete, we reset the input field to its original state and emit a 'changed'
      // event.
      keyHandler = (event: KeyboardEvent) => {
        event.stopPropagation();
        event.preventDefault();

        const [shortcut, isComplete] = this.getShortcut(event);

        // Update the input field with the current shortcut, even if it is not yet complete.
        if (shortcut != undefined) {
          this.shortcutInput.value = shortcut;
        }

        // If the shortcut is complete, we reset the input field to its original state
        // and emit a 'changed' event.
        if (isComplete) {
          reset();
          this.shortcutInput.classList.remove('invalid');
          this.emit('changed', this.shortcutInput.value);
        }
      };

      window.addEventListener('click', clickHandler);
      window.addEventListener('keydown', keyHandler, true);
      window.addEventListener('keyup', keyHandler, true);
    });
  }

  /**
   * This method sets the shortcut of the picker. The shortcut is normalized and validated
   * before it is set. If the shortcut is invalid, the input field is marked as invalid.
   *
   * @param shortcut The shortcut to set.
   */
  public setValue(shortcut: string) {
    shortcut = this.normalizeShortcut(shortcut);
    this.shortcutInput.value = shortcut;
    if (this.isValidShortcut(shortcut)) {
      this.shortcutInput.classList.remove('invalid');
    } else {
      this.shortcutInput.classList.add('invalid');
    }
  }

  /**
   * This method checks if the given shortcut is valid. A shortcut is valid if it follows
   * the rules outlined in https://www.electronjs.org/docs/latest/api/accelerator. An
   * empty shortcut is also considered valid.
   *
   * @param shortcut The normalized shortcut to validate
   * @returns True if the shortcut is valid, false otherwise.
   */
  private isValidShortcut(shortcut: string): boolean {
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
   * This method normalizes the given shortcut. It removes all whitespace and transforms
   * the shortcut to proper CamelCase. Again, we follow this list of valid keys:
   * https://www.electronjs.org/docs/latest/api/accelerator
   *
   * @param shortcut The shortcut to normalize.
   * @returns The normalized shortcut.
   */
  private normalizeShortcut(shortcut: string): string {
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
   * This method returns the shortcut for the given KeyboardEvent. The shortcut is
   * returned as a string and a boolean. The boolean is true if the shortcut is complete
   * and false otherwise. A shortcut is complete if it contains exactly one key and any
   * number of modifiers.
   *
   * The key is determined by the KeyboardEvent.code property and the modifier state. The
   * shortcut is formatted according to the rules outlined in
   * https://www.electronjs.org/docs/latest/api/accelerator.
   *
   * @param event The KeyboardEvent to get the shortcut for.
   * @returns The shortcut and a boolean indicating if the shortcut is complete.
   */
  private getShortcut(event: KeyboardEvent): [string, boolean] {
    const parts = [];

    if (event.ctrlKey) {
      parts.push('Control');
    }

    if (event.shiftKey) {
      parts.push('Shift');
    }

    if (event.altKey) {
      parts.push('Alt');
    }

    if (event.metaKey) {
      parts.push('Meta');
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
    key = this.normalizeShortcut(key);

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

    return [parts.join('+'), isComplete];
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

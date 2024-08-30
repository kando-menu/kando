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
import { fixKeyCodeCase, isKnownKeyCode } from '../../../common/key-codes';

/**
 * This class displays a text input field with a button next to it which allows the user
 * to select a hotkey which shall be simulated by Kando. The user can either type the
 * hotkey directly into the input field or press the button to enter a mode where the next
 * key presses are interpreted as hotkey.
 *
 * The hotkey selected with this picker may seem similar to the shortcuts selected by the
 * ShortcutPicker. However, there is a key difference: shortcuts use _key names_ which are
 * affected by the keyboard layout. Hotkeys use _key codes_ which are independent of the
 * keyboard layout. Pressing a shortcut like "Control+Z" may require different keys
 * depending on the keyboard layout. The hotkey "Control+Z" on the other hand will invoke
 * pressing the physical key "Z" which may be labeled differently on different keyboards
 * for example "Y" on a German keyboard.
 *
 * @fires change - When the user selects a valid hotkey. The event contains the new hotkey
 *   as an argument.
 */
export class HotkeyPicker extends TextPicker {
  /**
   * Creates a new HotkeyPicker and appends it to the given container. You must call
   * getContainer() of the parent class to get the container which contains the picker.
   */
  constructor() {
    super({
      label: i18next.t('properties.hotkey-picker.label'),
      hint: i18next.t('properties.hotkey-picker.hint'),
      lines: 1,
      placeholder: i18next.t('properties.common.not-bound'),
      recordingPlaceholder: i18next.t('properties.hotkey-picker.recording'),
      enableRecording: true,
      resetOnBlur: false,
    });
  }

  /**
   * This method normalizes the given hotkey. It removes all whitespace and transforms the
   * hotkey to proper CamelCase. All components of the hotkey are matched against the
   * available key codes in common/key-codes.ts.
   *
   * @param hotkey The hotkey to normalize.
   * @returns The normalized hotkey.
   */
  protected override normalizeInput(hotkey: string): string {
    // We first remove any whitespace and transform the hotkey to lowercase.
    hotkey = hotkey.replace(/\s/g, '').toLowerCase();

    // We then split the hotkey into its parts and normalize each part.
    let parts = hotkey.split('+');
    parts = parts.map(fixKeyCodeCase);

    return parts.join('+');
  }

  /**
   * This method checks if the given hotkey is valid. A hotkey is valid if it contains
   * exactly one key and any number of modifier keys. The key and modifier keys must be
   * valid key codes as defined in common/key-codes.ts.
   *
   * @param hotkey The normalized hotkey to validate.
   * @returns True if the hotkey is valid, false otherwise.
   */
  protected override isValid(hotkey: string): boolean {
    // If the hotkey is empty, it is valid.
    if (hotkey === '') {
      return true;
    }

    // Make sure the hotkey does not start or end with a '+'.
    if (hotkey.startsWith('+') || hotkey.endsWith('+')) {
      return false;
    }

    // Split the hotkey into its parts.
    const parts = hotkey.split('+');

    // A valid hotkey must contain exactly one key and can contain any number of
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
   * This method appends the key code of the given KeyboardEvent to the input field. If
   * the input field contains a valid hotkey after appending the key code, the method
   * returns true to indicate that the hotkey is complete.
   *
   * @param event The KeyboardEvent to get the hotkey for.
   * @returns True if the hotkey is complete, false otherwise.
   */
  protected override recordInput(event: KeyboardEvent): boolean {
    // Ignore key up events.
    if (event.type === 'keyup') {
      return false;
    }

    const parts = this.input.value.split('+').filter((part) => part !== '');

    // Only add the key code if it is not in the list already.
    if (parts.includes(event.code)) {
      return false;
    }

    parts.push(event.code);

    this.input.value = parts.join('+');

    return this.isValid(this.input.value);
  }

  /**
   * This method checks if the given modifier is valid. A modifier is valid if it is one
   * of the modifier keys of the key codes listed in common/key-codes.ts.
   *
   * @param modifier The modifier to validate.
   * @returns True if the modifier is valid, false otherwise.
   */
  private isValidModifier(modifier: string): boolean {
    const isModifier =
      /^(AltLeft|AltRight|ControlLeft|ControlRight|MetaLeft|MetaRight|ShiftLeft|ShiftRight)$/;
    return isModifier.test(modifier);
  }

  /**
   * This method checks if the given key is valid. A key is valid if it is one of the key
   * codes listed in common/key-codes.ts and is not a modifier key.
   *
   * @param key The key to validate.
   * @returns True if the key is valid, false otherwise.
   */
  private isValidKey(key: string): boolean {
    return isKnownKeyCode(key) && !this.isValidModifier(key);
  }
}

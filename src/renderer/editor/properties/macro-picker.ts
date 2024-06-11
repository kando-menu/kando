//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { TextPicker } from './text-picker';
import { fixKeyCodeCase, isKnownKeyCode } from '../../../common/key-codes';

/**
 * This class displays a text input field with a button next to it which allows the user
 * to record a keyboard macro which shall be simulated by Kando. The user can either type
 * the macro directly into the input field or press the button to enter a mode where the
 * next key presses are recorded.
 *
 * @fires change - When the user selects a valid macro. The event contains the new macro
 *   as an argument.
 */
export class MacroPicker extends TextPicker {
  /**
   * Creates a new MacroPicker and appends it to the given container. You must call
   * getContainer() of the parent class to get the container which contains the picker.
   */
  constructor() {
    super({
      label: 'Macro',
      hint: 'This will be simulated.',
      lines: 5,
      placeholder: 'Not Bound',
      recordingPlaceholder: 'Press the keys...',
      enableRecording: true,
      resetOnBlur: false,
    });
  }

  /**
   * This method normalizes the given macro. It removes all whitespace and transforms the
   * macro to proper CamelCase. All components of the macro are matched against the
   * available key codes in common/key-codes.ts. Each
   *
   * @param macro The macro to normalize.
   * @returns The normalized macro.
   */
  protected override normalizeInput(macro: string): string {
    // We first remove any whitespace and transform the macro to lowercase.
    macro = macro.replace(/\s/g, '').toLowerCase();

    // We then split the macro into its parts and normalize each part. The key part is
    // transformed to proper CamelCase, while the event part is transformed to lowercase.
    let parts = macro.split('+');
    parts = parts.map((part) => {
      const [key, event] = part.split(':');
      if (event) {
        return `${fixKeyCodeCase(key)}:${event.toLowerCase()}`;
      }

      return fixKeyCodeCase(key);
    });

    return parts.join('+');
  }

  /**
   * This method checks if the given macro is valid. A macro is valid if it contains only
   * valid key codes, each suffixed with eith :up or :down.
   *
   * @param macro The normalized macro to validate.
   * @returns True if the macro is valid, false otherwise.
   */
  protected override isValid(macro: string): boolean {
    // If the macro is empty, it is valid.
    if (macro === '') {
      return true;
    }

    // Make sure the macro does not start or end with a '+'.
    if (macro.startsWith('+') || macro.endsWith('+')) {
      return false;
    }

    // Split the macro into its parts.
    const parts = macro.split('+');

    // Check if each part is composed of a valid key code and a valid event.
    return parts.every((part) => {
      const [key, event] = part.split(':');
      if (!event) {
        return false;
      }
      return isKnownKeyCode(key) && (event === 'up' || event === 'down');
    });
  }

  /**
   * This method appends the key code of the given KeyboardEvent to the input field. Macro
   * recording continues until the input field losses focus, so the method never returns
   * true.
   *
   * @param event The KeyboardEvent to get the macro for.
   * @returns False
   */
  protected override recordInput(event: KeyboardEvent): boolean {
    if (this.input.value !== '') {
      this.input.value += '+';
    }

    if (event.type === 'keyup') {
      this.input.value += event.code + ':up';
    } else if (event.type === 'keydown') {
      this.input.value += event.code + ':down';
    }

    return false;
  }
}

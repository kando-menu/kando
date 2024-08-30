//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';
import JSON5 from 'json5';

import { TextPicker } from './text-picker';
import { fixKeyCodeCase, isKnownKeyCode } from '../../../common/key-codes';
import { IMacroEvent } from '../../../common/item-types/macro-item-type';

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
      label: '',
      hint: '',
      lines: 5,
      placeholder: i18next.t('properties.macro-picker.placeholder'),
      recordingPlaceholder: i18next.t('properties.macro-picker.recording'),
      enableRecording: true,
      resetOnBlur: false,
    });
  }

  /**
   * This method normalizes the given macro. It properly formats the JSON input and turns
   * the key codes to proper CamelCase. All key codes are matched against the available
   * key codes in common/key-codes.ts.
   *
   * @param input The input to normalize.
   * @returns The normalized macro.
   */
  protected override normalizeInput(input: string): string {
    let macro;

    // Try to parse the input as JSON. If this fails, return the input as is.
    try {
      macro = JSON5.parse('[' + input + ']');
    } catch (error) {
      return input;
    }

    // Each element must be an object with a type and a key.
    macro.forEach((event: IMacroEvent) => {
      if (event.key) {
        event.key = fixKeyCodeCase(event.key);
      }

      // If a delay is given, it must be a number.
      if (event.delay && typeof event.delay === 'string') {
        event.delay = parseInt(event.delay);
      }

      // The type must be spelled either 'keyDown' or 'keyUp'. We fix the case here.
      if (event.type && typeof event.type === 'string') {
        if (event.type.toLowerCase() === 'keydown') {
          event.type = 'keyDown';
        } else if (event.type.toLowerCase() === 'keyup') {
          event.type = 'keyUp';
        }
      }
    });

    return this.beautyPrint(JSON5.stringify(macro, null, 1));
  }

  /**
   * This method checks if the given macro is valid. A macro is valid if it is an array of
   * IMacroEvent objects. Each IMacroEvent object must have a type and a key. The key must
   * be a valid key code. There can be an optional delay, and there must be no other
   * properties.
   *
   * @param input The normalized input to validate.
   * @returns True if the macro is valid, false otherwise.
   */
  protected override isValid(input: string): boolean {
    let macro;

    // Try to parse the input as JSON. If this fails, return false.
    try {
      macro = JSON5.parse('[' + input + ']');
    } catch (error) {
      return false;
    }

    // Each element must be an object with a type and a key.
    return macro.every((event: IMacroEvent) => {
      // There must be a key property.
      if (
        event.key === undefined ||
        typeof event.key !== 'string' ||
        !isKnownKeyCode(event.key)
      ) {
        return false;
      }

      // There must be a type property.
      if (
        event.type === undefined ||
        typeof event.type !== 'string' ||
        (event.type !== 'keyDown' && event.type !== 'keyUp')
      ) {
        return false;
      }

      // If a delay is given, it must be a number.
      if (event.delay !== undefined && typeof event.delay !== 'number') {
        return false;
      }

      // There must be no other properties.
      for (const key of Object.keys(event)) {
        if (key !== 'type' && key !== 'key' && key !== 'delay') {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * This method appends the key code of the given KeyboardEvent to the input field. Macro
   * recording continues until the input field looses focus or the record button is
   * pressed again, so the method never returns true.
   *
   * @param event The KeyboardEvent to get the macro for.
   * @returns False
   */
  protected override recordInput(event: KeyboardEvent): boolean {
    const macro = JSON5.parse('[' + this.input.value + ']' || '[]');

    macro.push({
      type: event.type === 'keydown' ? 'keyDown' : 'keyUp',
      key: event.code,
      delay: 10,
    });

    this.input.value = this.beautyPrint(JSON5.stringify(macro, null, 1));

    return false;
  }

  private beautyPrint(json: string): string {
    return json
      .replace(/\n/g, '')
      .replace(/ /g, '')
      .replace(/\[/g, '')
      .replace(/\]/g, '')
      .replace(/\},/g, '},\n')
      .replace(/:/g, ': ')
      .replace(/,/g, ', ');
  }
}

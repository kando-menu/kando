//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * A utility class to get the name of a key from a keyboard event. The result is similar
 * to the `name` property of the KeyboardEvent, but it also handles some special cases
 * like the numpad keys and the digit keys. It also normalizes the names to be more
 * consistent with Electron's accelerator format.
 */
export default class KeyMapper {
  /**
   * A map to convert DOM key codes to their names. This is initialized in the init
   * method.
   */
  private static keymap: Map<string, string> = new Map();

  /** A map to convert numpad keys to their names. */
  private static numpadKeys = new Map([
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

  /**
   * Initializes the key mapper by getting the keyboard layout map from the navigator.
   * This should be called once when the application starts.
   */
  static async init() {
    // @ts-expect-error The navigator is indeed available in Electron.
    window.navigator.keyboard.getLayoutMap().then((map) => {
      this.keymap = map;
    });
  }

  /**
   * Gets the name of the key from the given keyboard event. This method takes into
   * account the key code, the key value, and the location of the key to determine the
   * correct name. It also normalizes some names to be more consistent with Electron's
   * accelerator format.
   *
   * @param event The keyboard event to get the key name from.
   * @returns The name of the key.
   */
  static getName(event: KeyboardEvent): string {
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

    // We can explicitly bind to numpad keys. We check location property to determine
    // if the key is on the numpad.
    if (event.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) {
      key = this.numpadKeys.get(key) || key;
    }

    return key;
  }
}

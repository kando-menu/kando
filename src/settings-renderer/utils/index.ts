//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * A small helper which ensures that all 'key' properties of the given array are unique.
 * If any duplicates are found, they are prepended with a number, starting from 1.
 *
 * @param array The array to check for duplicates.
 */
export function ensureUniqueKeys<T extends { key: string }>(array: T[]) {
  const keys = new Set<string>();

  array.forEach((item) => {
    let key = item.key;
    let count = 1;

    while (keys.has(key)) {
      key = `${item.key}_${count++}`;
    }

    keys.add(key);
    item.key = key;
  });
}

export { default as FocusTrapManager } from './FocusTrapManager';

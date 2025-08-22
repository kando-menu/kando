//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { ItemType } from './item-type-registry';

export type MacroEvent = {
  type: 'keyDown' | 'keyUp';
  delay?: number;
  key?: string;
};

/**
 * For this type of menu items, the user can configure a macro that will be typed when the
 * item is clicked. If the `delayed` flag is set, the macro will be typed after the Kando
 * window has been closed.
 */
export type ItemData = {
  macro: MacroEvent[];
  delayed: boolean;
};

/** This class provides meta information for menu items that simulate a macro. */
export class MacroItemType implements ItemType {
  get hasChildren(): boolean {
    return false;
  }

  get defaultName(): string {
    return i18next.t('menu-items.macro.name');
  }

  get defaultIcon(): string {
    return 'macro-item.svg';
  }

  get defaultIconTheme(): string {
    return 'kando';
  }

  get defaultData(): ItemData {
    return {
      macro: [],
      delayed: true,
    };
  }

  get genericDescription(): string {
    return i18next.t('menu-items.macro.description');
  }
}

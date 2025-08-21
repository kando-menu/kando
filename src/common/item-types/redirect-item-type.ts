//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: yar2001T <https://github.com/yar2000T>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { ItemType } from './item-type-registry';

/**
 * For this type of menu items, the user can configure a menu that will be opened when the
 * item is clicked.
 */
export type ItemData = {
  menu: string;
};

/** This class provides meta information for menu items that open another menu. */
export class RedirectItemType implements ItemType {
  get hasChildren(): boolean {
    return false;
  }

  get defaultName(): string {
    return i18next.t('menu-items.redirect.name');
  }

  get defaultIcon(): string {
    return 'redirect-item.svg';
  }

  get defaultIconTheme(): string {
    return 'kando';
  }

  get defaultData(): ItemData {
    return {
      menu: '',
    };
  }

  get genericDescription(): string {
    return i18next.t('menu-items.redirect.description');
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: yar2001T <https://github.com/yar2000T>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { IMenuItem } from '../index';
import { IItemType } from '../item-type-registry';

/**
 * For this type of menu items, the user can configure a menu that will be opened when the
 * item is clicked.
 */
export interface IItemData {
  menu: string;
}

/** This class provides meta information for menu items that open another menu. */
export class RedirectItemType implements IItemType {
  get hasChildren(): boolean {
    return false;
  }

  get defaultName(): string {
    return i18next.t('items.redirect.name');
  }

  get defaultIcon(): string {
    return 'redo';
  }

  get defaultIconTheme(): string {
    return 'material-symbols-rounded';
  }

  get defaultData(): IItemData {
    return {
      menu: '',
      delayed: false,
    };
  }

  get genericDescription(): string {
    return i18next.t('items.redirect.description');
  }

  getDescription(item: IMenuItem): string {
    return (item.data as IItemData).menu || i18next.t('items.common.not-configured');
  }
}

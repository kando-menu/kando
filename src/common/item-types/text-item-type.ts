//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { IMenuItem } from '../index';
import { IItemType } from '../item-type-registry';

/**
 * For this type of menu items, the user can configure a piece of text that will be pasted
 * into the active window when the item is activated.
 */
export interface IItemData {
  text: string;
}

/**
 * This class provides meta information for menu items that paste a piece of text into the
 * active window.
 */
export class TextItemType implements IItemType {
  get hasChildren(): boolean {
    return false;
  }

  get defaultName(): string {
    return i18next.t('items.text.name');
  }

  get defaultIcon(): string {
    return 'translate';
  }

  get defaultIconTheme(): string {
    return 'material-symbols-rounded';
  }

  get defaultData(): IItemData {
    return {
      text: '',
    };
  }

  get genericDescription(): string {
    return i18next.t('items.text.description');
  }

  getDescription(item: IMenuItem): string {
    return (item.data as IItemData).text || i18next.t('items.common.not-configured');
  }
}

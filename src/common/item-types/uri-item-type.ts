//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { IItemType } from './item-type-registry';

/**
 * For this type of menu items, the user can configure a URL that will be opened when the
 * item is clicked.
 */
export interface IItemData {
  uri: string;
}

/** This class provides meta information for menu items that open a URL. */
export class URIItemType implements IItemType {
  get hasChildren(): boolean {
    return false;
  }

  get defaultName(): string {
    return i18next.t('menu-items.uri.name');
  }

  get defaultIcon(): string {
    return 'uri-item.svg';
  }

  get defaultIconTheme(): string {
    return 'kando';
  }

  get defaultData(): IItemData {
    return {
      uri: '',
    };
  }

  get genericDescription(): string {
    return i18next.t('menu-items.uri.description');
  }
}

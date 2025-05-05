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
 * For this type of menu items, the user can configure a hotkey that will be simulated
 * when the item is clicked. If the `delayed` flag is set, the hotkey will be simulated
 * after the Kando window has been closed.
 */
export interface IItemData {
  hotkey: string;
  delayed: boolean;
}

/** This class provides meta information for menu items that simulate a hotkey. */
export class HotkeyItemType implements IItemType {
  get hasChildren(): boolean {
    return false;
  }

  get defaultName(): string {
    return i18next.t('menu-items.hotkey.name');
  }

  get defaultIcon(): string {
    return 'hotkey-item.svg';
  }

  get defaultIconTheme(): string {
    return 'kando';
  }

  get defaultData(): IItemData {
    return {
      hotkey: '',
      delayed: true,
    };
  }

  get genericDescription(): string {
    return i18next.t('menu-items.hotkey.description');
  }
}

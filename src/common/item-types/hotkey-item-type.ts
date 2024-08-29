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
    return i18next.t('items.hotkey.name');
  }

  get defaultIcon(): string {
    return 'keyboard_external_input';
  }

  get defaultIconTheme(): string {
    return 'material-symbols-rounded';
  }

  get defaultData(): IItemData {
    return {
      hotkey: '',
      delayed: true,
    };
  }

  get genericDescription(): string {
    return i18next.t('items.hotkey.description');
  }

  getDescription(item: IMenuItem): string {
    const data = item.data as IItemData;
    if (!data.hotkey) {
      return i18next.t('items.common.not-configured');
    }

    // Remove all Left/Right suffixes from the modifiers "Control", "Shift", "Alt" and
    // "Meta" to make the hotkey more readable.
    return data.hotkey
      .replace('ControlLeft', 'Ctrl')
      .replace('ControlRight', 'Ctrl')
      .replace('ShiftLeft', 'Shift')
      .replace('ShiftRight', 'Shift')
      .replace('AltLeft', 'Alt')
      .replace('AltRight', 'Alt')
      .replace('MetaLeft', 'Meta')
      .replace('MetaRight', 'Meta')
      .replace(/\+/g, ' + ');
  }
}

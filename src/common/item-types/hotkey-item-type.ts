//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

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
    return 'Simulate Hotkey';
  }

  get defaultIcon(): string {
    return 'keyboard';
  }

  get defaultIconTheme(): string {
    return 'material-symbols-rounded';
  }

  get defaultData(): IItemData {
    return {
      hotkey: '',
      delayed: false,
    };
  }

  get genericDescription(): string {
    return 'Simulates key presses.';
  }

  getDescription(item: IMenuItem): string {
    return (item.data as IItemData).hotkey || 'Not configured.';
  }
}

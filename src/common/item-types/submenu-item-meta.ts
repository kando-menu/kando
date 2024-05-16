//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IMenuItem } from '../index';
import { IItemMeta } from '../item-factory';

/** For submenu items, no additional data is required. */
export interface IItemData {}

/** This class provides meta information for submenu items. */
export class SubmenuItemMeta implements IItemMeta {
  get hasChildren(): boolean {
    return true;
  }

  get defaultName(): string {
    return 'Submenu';
  }

  get defaultIcon(): string {
    return 'apps';
  }

  get defaultIconTheme(): string {
    return 'material-symbols-rounded';
  }

  get defaultData(): IItemData {
    return {};
  }

  get genericDescription(): string {
    return 'Contains other menu items.';
  }

  getDescription(item: IMenuItem): string {
    return `Contains ${item.children.length} menu items.`;
  }
}

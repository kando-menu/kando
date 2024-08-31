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

/** For submenu items, no additional data is required. */
export interface IItemData {}

/** This class provides meta information for submenu items. */
export class SubmenuItemType implements IItemType {
  get hasChildren(): boolean {
    return true;
  }

  get defaultName(): string {
    return i18next.t('items.submenu.name');
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
    return i18next.t('items.submenu.description');
  }

  getDescription(item: IMenuItem): string {
    return i18next.t('items.submenu.detailed-description', {
      count: item.children.length,
    });
  }
}

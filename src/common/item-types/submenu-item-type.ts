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

/** This class provides meta information for submenu items. */
export class SubmenuItemType implements IItemType {
  get hasChildren(): boolean {
    return true;
  }

  get defaultName(): string {
    return i18next.t('menu-items.submenu.name');
  }

  get defaultIcon(): string {
    return 'submenu-item.svg';
  }

  get defaultIconTheme(): string {
    return 'kando';
  }

  get defaultData() {
    return {};
  }

  get genericDescription(): string {
    return i18next.t('menu-items.submenu.description');
  }
}

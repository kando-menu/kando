//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { ItemType } from './item-type-registry';

/** This class provides meta information for the open settings menu item. */
export class SettingsItemType implements ItemType {
  get hasChildren(): boolean {
    return false;
  }

  get defaultName(): string {
    return i18next.t('menu-items.settings.name');
  }

  get defaultIcon(): string {
    return 'settings-item.svg';
  }

  get defaultIconTheme(): string {
    return 'kando';
  }

  get defaultData(): null {
    return null;
  }

  get genericDescription(): string {
    return i18next.t('menu-items.settings.description');
  }
}

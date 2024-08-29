//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { IItemConfig } from '../item-config-registry';

/** This class provides the configuration widgets for submenu items. */
export class SubmenuItemConfig implements IItemConfig {
  /** @inheritdoc */
  public getTipOfTheDay(): string {
    const tips = [
      i18next.t('items.submenu.tip-1'),
      i18next.t('items.submenu.tip-2'),
      i18next.t('items.submenu.tip-3'),
      i18next.t('items.submenu.tip-4'),
      i18next.t('items.submenu.tip-5'),
      i18next.t('items.submenu.tip-6'),
      i18next.t('items.submenu.tip-7'),
      i18next.t('items.submenu.tip-8'),
      i18next.t('items.submenu.tip-9'),
      i18next.t('items.submenu.tip-10'),
      i18next.t('items.submenu.tip-11'),
    ];

    return tips[Math.floor(Math.random() * tips.length)];
  }

  /** Submenus do not have any special settings. Therefore, this method returns `null`. */
  public getConfigWidget(): DocumentFragment | null {
    return null;
  }
}

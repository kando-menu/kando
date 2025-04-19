//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: yar2001T <https://github.com/yar2000T>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { IItemConfig } from '../item-config-registry';

/** This class provides the configuration widgets for redirect items. */
export class RedirectItemConfig implements IItemConfig {
  /** @inheritdoc */
  public getTipOfTheDay(): string {
    const tips = [
      i18next.t('items.redirect.tip-1'),
      i18next.t('items.redirect.tip-2'),
      i18next.t('items.redirect.tip-3'),
    ];

    return tips[Math.floor(Math.random() * tips.length)];
  }
}

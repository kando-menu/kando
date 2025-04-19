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

/** This class provides the configuration widgets for command items. */
export class CommandItemConfig implements IItemConfig {
  /** @inheritdoc */
  public getTipOfTheDay(): string {
    const tips = [
      i18next.t('items.command.tip-1'),
      i18next.t('items.command.tip-2'),
      i18next.t('items.command.tip-3'),
      i18next.t('items.command.tip-4'),
      i18next.t('items.command.tip-5'),
    ];

    return tips[Math.floor(Math.random() * tips.length)];
  }
}

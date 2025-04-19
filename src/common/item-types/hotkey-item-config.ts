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
import { chooseRandomTip } from './utils';

/** This class provides the configuration widgets for hotkey items. */
export class HotkeyItemConfig implements IItemConfig {
  /** @inheritdoc */
  public getTipOfTheDay(seed: number): string {
    return chooseRandomTip(
      [
        i18next.t('items.hotkey.tip-1'),
        i18next.t('items.hotkey.tip-2'),
        '<a href="https://kando.menu/valid-keynames/" target="_blank">' +
          i18next.t('items.hotkey.tip-3') +
          '</a>',
      ],
      seed
    );
  }
}

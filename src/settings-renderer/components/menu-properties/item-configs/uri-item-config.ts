//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { IItemConfig } from './item-config-registry';
import { chooseRandomTip } from './utils';

/** This class provides the configuration widgets for URI items. */
export class URIItemConfig implements IItemConfig {
  /** @inheritdoc */
  public getTipOfTheDay(seed: number): string {
    return chooseRandomTip(
      [
        i18next.t('items.uri.tip-1'),
        i18next.t('items.uri.tip-2'),
        i18next.t('items.uri.tip-3'),
        i18next.t('items.uri.tip-4'),
        i18next.t('items.uri.tip-5'),
        i18next.t('items.uri.tip-6'),
      ],
      seed
    );
  }
}

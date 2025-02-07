//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: yar2001T <https://github.com/yar2000T>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { IMenuItem } from '..';
import { IItemConfig } from '../item-config-registry';
import { IItemData } from './redirect-item-type';
import * as utils from './utils';

/** This class provides the configuration widgets for command items. */
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

  /** @inheritdoc */
  public getConfigWidget(item: IMenuItem): DocumentFragment | null {
    const fragment = utils.renderTemplate(
      require('../../renderer/editor/properties/templates/text-option.hbs'),
      {
        placeholder: i18next.t('items.common.not-configured'),
        label: i18next.t('items.redirect.redirect'),
        hint: i18next.t('items.redirect.redirect-hint'),
      }
    );

    const redirectInput = fragment.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement;
    redirectInput.value = (item.data as IItemData).menu || '';

    // Listen for changes and update the item.
    redirectInput.addEventListener('input', () => {
      (item.data as IItemData).menu = redirectInput.value;
    });

    return fragment;
  }
}

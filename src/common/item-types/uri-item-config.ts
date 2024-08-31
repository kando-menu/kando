//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { IMenuItem } from '..';
import { IItemConfig } from '../item-config-registry';
import { IItemData } from './uri-item-type';
import * as utils from './utils';

/** This class provides the configuration widgets for URI items. */
export class URIItemConfig implements IItemConfig {
  /** @inheritdoc */
  public getTipOfTheDay(): string {
    const tips = [
      i18next.t('items.uri.tip-1'),
      i18next.t('items.uri.tip-2'),
      i18next.t('items.uri.tip-3'),
      i18next.t('items.uri.tip-4'),
      i18next.t('items.uri.tip-5'),
      i18next.t('items.uri.tip-6'),
    ];

    return tips[Math.floor(Math.random() * tips.length)];
  }

  /** @inheritdoc */
  public getConfigWidget(item: IMenuItem): DocumentFragment | null {
    const fragment = utils.renderTemplate(
      require('../../renderer/editor/properties/templates/text-option.hbs'),
      {
        placeholder: i18next.t('items.common.not-configured'),
        label: i18next.t('items.uri.uri'),
        hint: i18next.t('items.uri.uri-hint'),
      }
    );

    // Get the input element and set the current value.
    const input = fragment.querySelector('input');
    input.value = (item.data as IItemData).uri || '';

    // Listen for changes and update the item.
    input.addEventListener('input', () => {
      (item.data as IItemData).uri = input.value;
    });

    return fragment;
  }
}

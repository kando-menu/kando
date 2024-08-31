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
import { IItemData } from './command-item-type';
import * as utils from './utils';

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

  /** @inheritdoc */
  public getConfigWidget(item: IMenuItem): DocumentFragment | null {
    // Add the checkbox for the delayed execution mode.
    const fragment = utils.renderTemplate(
      require('../../renderer/editor/properties/templates/checkbox-option.hbs'),
      {
        label: i18next.t('items.common.delayed-option'),
        hint: i18next.t('items.common.delayed-option-hint'),
      }
    );

    const delayedInput = fragment.querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement;
    delayedInput.checked = (item.data as IItemData).delayed || false;

    delayedInput.addEventListener('change', () => {
      (item.data as IItemData).delayed = delayedInput.checked;
    });

    fragment.append(
      utils.renderTemplate(
        require('../../renderer/editor/properties/templates/text-option.hbs'),
        {
          placeholder: i18next.t('items.common.not-configured'),
          label: i18next.t('items.command.command'),
          hint: i18next.t('items.command.command-hint'),
        }
      )
    );

    // Get the input element and set the current value.
    const commandInput = fragment.querySelector('input[type="text"]') as HTMLInputElement;
    commandInput.value = (item.data as IItemData).command || '';

    // Listen for changes and update the item.
    commandInput.addEventListener('input', () => {
      (item.data as IItemData).command = commandInput.value;
    });

    return fragment;
  }
}

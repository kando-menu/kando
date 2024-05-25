//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IMenuItem } from '..';
import { IItemConfig } from '../item-config-registry';
import { IItemData } from './command-item-type';
import * as utils from './utils';

/** This class provides the configuration widgets for command items. */
export class CommandItemConfig implements IItemConfig {
  /** @inheritdoc */
  public getTipOfTheDay(): string {
    const tips = [
      'You can use the Command item type to launch applications or scripts.',
      'If the path to an executable contains spaces, you should "wrap it in quotes".',
    ];

    return tips[Math.floor(Math.random() * tips.length)];
  }

  /** @inheritdoc */
  public getConfigWidget(item: IMenuItem): DocumentFragment | null {
    const fragment = utils.renderTemplate(
      require('../../renderer/editor/properties/templates/text-option.hbs'),
      {
        placeholder: 'Not Defined',
        label: 'Command',
        hint: 'This will be executed.',
      }
    );

    // Get the input element and set the current value.
    const input = fragment.querySelector('input');
    input.value = (item.data as IItemData).command || '';

    // Listen for changes and update the item.
    input.addEventListener('input', () => {
      (item.data as IItemData).command = input.value;
    });

    return fragment;
  }
}

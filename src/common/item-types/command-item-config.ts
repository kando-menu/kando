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
      'Use {{app_name}} to insert the name of the application which was focused when you opened the menu.',
      'Use {{window_name}} to insert the name of the window which was focused when you opened the menu.',
      'Use {{pointer_x}} and {{pointer_y}} to insert the pointer position where the menu was opened.',
    ];

    return tips[Math.floor(Math.random() * tips.length)];
  }

  /** @inheritdoc */
  public getConfigWidget(item: IMenuItem): DocumentFragment | null {
    // Add the checkbox for the delayed execution mode.
    const fragment = utils.renderTemplate(
      require('../../renderer/editor/properties/templates/checkbox-option.hbs'),
      {
        label: 'Execute After Closing the Menu',
        hint: 'Useful if the command targets a window that needs to be focused.',
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
          placeholder: 'Not Defined',
          label: 'Command',
          hint: 'This will be executed.',
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

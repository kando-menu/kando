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

/** This class provides the configuration widgets for command items. */
export class CommandItemConfig implements IItemConfig {
  /** @inheritdoc */
  public getTipOfTheDay(): string {
    return 'You can use the Command item type to launch applications or scripts.';
  }

  /** @inheritdoc */
  public getConfigWidget(item: IMenuItem): HTMLElement | null {
    const div = document.createElement('div');

    // Render the template.
    const template = require('./templates/text-entry.hbs');
    div.innerHTML = template({
      placeholder: 'Not Defined',
      label: 'Command',
      hint: 'A shell command or a path to an executable.',
    });

    // Get the input element and set the current value.
    const input = div.querySelector('input');
    input.value = (item.data as IItemData).command || '';

    // Listen for changes and update the item.
    input.addEventListener('input', () => {
      (item.data as IItemData).command = input.value;
    });

    return div;
  }
}

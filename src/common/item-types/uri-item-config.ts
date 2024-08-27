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
import { IItemData } from './uri-item-type';
import * as utils from './utils';

/** This class provides the configuration widgets for URI items. */
export class URIItemConfig implements IItemConfig {
  /** @inheritdoc */
  public getTipOfTheDay(): string {
    const tips = [
      'You can use the URI item type to open a website using the http:// protocol.',
      'You can use the URI item type to open a file or folder using the file:// protocol.',
      'You can use the URI item type to open a mailto: link.',
      'Use {{app_name}} to insert the name of the application which was focused when you opened the menu.',
      'Use {{window_name}} to insert the name of the window which was focused when you opened the menu.',
      'Use {{pointer_x}} and {{pointer_y}} to insert the pointer position where the menu was opened.',
    ];

    return tips[Math.floor(Math.random() * tips.length)];
  }

  /** @inheritdoc */
  public getConfigWidget(item: IMenuItem): DocumentFragment | null {
    const fragment = utils.renderTemplate(
      require('../../renderer/editor/properties/templates/text-option.hbs'),
      {
        placeholder: 'Not Defined',
        label: 'URI',
        hint: 'This will be opened.',
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

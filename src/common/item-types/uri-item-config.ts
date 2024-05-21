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

/** This class provides the configuration widgets for URI items. */
export class URIItemConfig implements IItemConfig {
  /** @inheritdoc */
  public getTipOfTheDay(): string {
    const tips = [
      'You can use the URI item type to open a website using the http:// protocol.',
      'You can use the URI item type to open a file or folder using the file:// protocol.',
      'You can use the URI item type to open a mailto: link.',
    ];

    return tips[Math.floor(Math.random() * tips.length)];
  }

  /** @inheritdoc */
  public getConfigWidget(item: IMenuItem): DocumentFragment | null {
    const fragment = document.createDocumentFragment();

    const div = document.createElement('div');
    fragment.appendChild(div);

    // Render the template.
    const template = require('../../renderer/editor/properties/templates/text-option.hbs');
    div.innerHTML = template({
      placeholder: 'Not Defined',
      label: 'URI',
      hint: 'This will be opened.',
    });

    // Get the input element and set the current value.
    const input = div.querySelector('input');
    input.value = (item.data as IItemData).uri || '';

    // Listen for changes and update the item.
    input.addEventListener('input', () => {
      (item.data as IItemData).uri = input.value;
    });

    return fragment;
  }
}

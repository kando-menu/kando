//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IMenuItem } from '..';
import { MacroPicker } from '../../renderer/editor/properties/macro-picker';
import { IItemConfig } from '../item-config-registry';
import { IItemData } from './macro-item-type';
import * as utils from './utils';

/** This class provides the configuration widgets for macro items. */
export class MacroItemConfig implements IItemConfig {
  /** @inheritdoc */
  public getTipOfTheDay(): string {
    const tips = [
      'All valid key names are listed <a href="https://github.com/kando-menu/kando/blob/main/docs/configuring.md#menu-shortcuts-vs-simulated-macros" target="_blank">here</a>. Just append "Up" or "Down" to the key name to simulate a key press or release.',
    ];

    return tips[Math.floor(Math.random() * tips.length)];
  }

  /** @inheritdoc */
  public getConfigWidget(item: IMenuItem): DocumentFragment | null {
    const fragment = document.createDocumentFragment();

    // Add the checkbox for the delayed execution mode.
    fragment.append(
      utils.renderTemplate(
        require('../../renderer/editor/properties/templates/checkbox-option.hbs'),
        {
          label: 'Execute Delayed',
          hint: 'Ensures that Kando does not block the key events.',
        }
      )
    );

    const input = fragment.querySelector('.form-check-input') as HTMLInputElement;
    input.checked = (item.data as IItemData).delayed || false;

    input.addEventListener('change', () => {
      (item.data as IItemData).delayed = input.checked;
    });

    // Add the macro picker.
    const picker = new MacroPicker();
    picker.setValue(
      (item.data as IItemData).macro
        .map((event) => {
          const type = event.type.replace('keyDown', 'down').replace('keyUp', 'up');
          return `${event.key}:${type}`;
        })
        .join(' + ')
    );
    fragment.append(picker.getContainer());

    picker.on('change', (value: string) => {
      (item.data as IItemData).macro = value.split('+').map((part) => {
        const [key, event] = part.split(':');
        return {
          key,
          type: event === 'down' ? 'keyDown' : 'keyUp',
        };
      });
    });

    return fragment;
  }
}

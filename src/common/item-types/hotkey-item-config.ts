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
import { HotkeyPicker } from '../../renderer/editor/properties/hotkey-picker';
import { IItemConfig } from '../item-config-registry';
import { IItemData } from './hotkey-item-type';
import * as utils from './utils';

/** This class provides the configuration widgets for hotkey items. */
export class HotkeyItemConfig implements IItemConfig {
  /** @inheritdoc */
  public getTipOfTheDay(): string {
    const tips = [
      i18next.t('items.hotkey.tip-1'),
      i18next.t('items.hotkey.tip-2'),
      '<a href="https://kando.menu/valid-keynames/" target="_blank">' +
        i18next.t('items.hotkey.tip-3') +
        '</a>',
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
          label: i18next.t('items.common.delayed-option'),
          hint: i18next.t('items.common.delayed-option-hint'),
        }
      )
    );

    const input = fragment.querySelector('.form-check-input') as HTMLInputElement;
    input.checked = (item.data as IItemData).delayed || false;

    input.addEventListener('change', () => {
      (item.data as IItemData).delayed = input.checked;
    });

    // Add the hotkey picker.
    const picker = new HotkeyPicker();
    picker.setValue((item.data as IItemData).hotkey || '');
    fragment.append(picker.getContainer());

    picker.on('change', (value: string) => {
      (item.data as IItemData).hotkey = value;
    });

    return fragment;
  }
}

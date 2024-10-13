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
import { IItemData } from './text-item-type';
import { TextPicker } from '../../renderer/editor/properties/text-picker';

/** This class provides the configuration widgets for insert-text items. */
export class TextItemConfig implements IItemConfig {
  /** @inheritdoc */
  public getTipOfTheDay(): string {
    const tips = [i18next.t('items.text.tip-1')];

    return tips[Math.floor(Math.random() * tips.length)];
  }

  /** @inheritdoc */
  public getConfigWidget(item: IMenuItem): DocumentFragment | null {
    const fragment = document.createDocumentFragment();

    const picker = new TextPicker({
      label: '',
      hint: '',
      lines: 7,
      placeholder: i18next.t('items.text.placeholder'),
      recordingPlaceholder: '',
      enableRecording: false,
      resetOnBlur: false,
    });
    fragment.append(picker.getContainer());

    picker.setValue((item.data as IItemData).text);

    picker.on('change', (value: string) => {
      (item.data as IItemData).text = value;
    });

    return fragment;
  }
}

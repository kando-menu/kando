//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { IMenuItem } from '../index';
import { IItemType } from '../item-type-registry';

export interface IMacroEvent {
  type: 'keyDown' | 'keyUp';
  delay?: number;
  key?: string;
}

/**
 * For this type of menu items, the user can configure a macro that will be typed when the
 * item is clicked. If the `delayed` flag is set, the macro will be typed after the Kando
 * window has been closed.
 */
export interface IItemData {
  macro: IMacroEvent[];
  delayed: boolean;
}

/** This class provides meta information for menu items that simulate a macro. */
export class MacroItemType implements IItemType {
  get hasChildren(): boolean {
    return false;
  }

  get defaultName(): string {
    return i18next.t('items.macro.name');
  }

  get defaultIcon(): string {
    return 'keyboard_keys';
  }

  get defaultIconTheme(): string {
    return 'material-symbols-rounded';
  }

  get defaultData(): IItemData {
    return {
      macro: [],
      delayed: true,
    };
  }

  get genericDescription(): string {
    return i18next.t('items.macro.description');
  }

  getDescription(item: IMenuItem): string {
    const data = item.data as IItemData;
    if (!data.macro) {
      return i18next.t('items.common.not-configured');
    }

    // Remove all Left/Right suffixes from the modifiers "Control", "Shift", "Alt" and
    // "Meta" to make the macro more readable. We prepend "↓" or "↑" to indicate key
    // presses and releases.
    return data.macro
      .map((event) => {
        const key = event.key
          .replace('ControlLeft', 'Ctrl')
          .replace('ControlRight', 'Ctrl')
          .replace('ShiftLeft', 'Shift')
          .replace('ShiftRight', 'Shift')
          .replace('AltLeft', 'Alt')
          .replace('AltRight', 'Alt')
          .replace('MetaLeft', 'Meta')
          .replace('MetaRight', 'Meta');
        return `${event.type === 'keyDown' ? '↓' : '↑'}${key}`;
      })
      .join(' + ');
  }
}

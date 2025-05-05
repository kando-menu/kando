//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { IItemType } from './item-type-registry';

/**
 * For this type of menu items, the user can configure a command that will be executed
 * when the item is clicked. If the `delayed` flag is set, the command will be executed
 * after the Kando window has been closed.
 */
export interface IItemData {
  command: string;
  delayed: boolean;
}

/** This class provides meta information for menu items that execute a command. */
export class CommandItemType implements IItemType {
  get hasChildren(): boolean {
    return false;
  }

  get defaultName(): string {
    return i18next.t('menu-items.command.name');
  }

  get defaultIcon(): string {
    return 'command-item.svg';
  }

  get defaultIconTheme(): string {
    return 'kando';
  }

  get defaultData(): IItemData {
    return {
      command: '',
      delayed: false,
    };
  }

  get genericDescription(): string {
    return i18next.t('menu-items.command.description');
  }
}

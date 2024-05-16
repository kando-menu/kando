//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IMenuItem } from '../index';
import { IItemMeta } from '../item-factory';

/**
 * For this type of menu items, the user can configure a command that will be executed
 * when the item is clicked.
 */
export interface IItemData {
  command: string;
}

/** This class provides meta information for menu items that execute a command. */
export class CommandItemMeta implements IItemMeta {
  get hasChildren(): boolean {
    return false;
  }

  get defaultName(): string {
    return 'Launch Application';
  }

  get defaultIcon(): string {
    return 'terminal';
  }

  get defaultIconTheme(): string {
    return 'material-symbols-rounded';
  }

  get defaultData(): IItemData {
    return {
      command: '',
    };
  }

  get genericDescription(): string {
    return 'Runs any command.';
  }

  getDescription(item: IMenuItem): string {
    return (item.data as IItemData).command || 'Not configured.';
  }
}

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
 * when the item is clicked.
 */
export interface IItemData {
  command: string;

  /**
   * If set, the command will be executed in a detached process. This means that the
   * process will not be connected to Kando, and will continue to run even if Kando is
   * closed.
   */
  detached: boolean;

  /**
   * If set, the command will be executed in a clean environment, meaning that it will not
   * inherit any environment variables from Kando. This is not yet supported on all
   * platforms.
   */
  isolated: boolean;

  /** If set, the command will be executed after the Kando window has been closed. */
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
      detached: true,
      isolated: false,
      delayed: false,
    };
  }

  get genericDescription(): string {
    return i18next.t('menu-items.command.description');
  }
}

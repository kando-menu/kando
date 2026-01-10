//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ItemType } from './item-type-registry';

/**
 * This class provides meta information for the simple-button item type. This item type is
 * not user-selectable; it is not available in the menu editor. It can only be used
 * programmatically. In fact it, is the basic action which is used in IPC menus.
 */
export class SimpleButtonItemType implements ItemType {
  get hasChildren(): boolean {
    return false;
  }

  get isUserSelectable(): boolean {
    return false;
  }

  get defaultName(): string {
    return 'Button';
  }

  get defaultIcon(): string {
    return 'settings-item.svg';
  }

  get defaultIconTheme(): string {
    return 'kando';
  }

  get defaultData() {
    return {};
  }

  get genericDescription(): string {
    return 'A simple button without any action.';
  }
}

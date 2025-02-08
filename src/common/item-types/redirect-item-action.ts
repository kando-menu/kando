//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: yar2001T <https://github.com/yar2000T>
// SPDX-License-Identifier: MIT

import { IMenuItem } from '../index';
import { IItemAction } from '../item-action-registry';
import { DeepReadonly } from '../../main/settings';
import { IItemData } from './redirect-item-type';
import { IItemData } from './redirect-item-type';
import { kando } from '../../main';

export class RedirectItemAction implements IItemAction {
  /**
   * Redirects are always opened immediately.
   *
   * @returns False
   */
  delayedExecution() {
    return false;
  }

  /**
   * This method opens the specified menu.
   *
   * @param item The item for which the action should be executed.
   * @returns A promise which resolves when the macro has been successfully simulated.
   */
  async execute(item: DeepReadonly<IMenuItem>) {
    const menu = (item.data as IItemData).menu;

    if (menu === '') {
      throw new Error('Menu name should not be empty!');
    }

    kando.showMenu({
      trigger: '',
      name: menu,
    });
  }
}

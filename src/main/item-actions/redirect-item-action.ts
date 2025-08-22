//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: yar2001T <https://github.com/yar2000T>
// SPDX-License-Identifier: MIT

import { MenuItem } from '../../common/index';
import { ItemAction } from './item-action-registry';
import { DeepReadonly } from '../settings';
import { ItemData } from '../../common/item-types/redirect-item-type';
import { KandoApp } from '../app';

export class RedirectItemAction implements ItemAction {
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
   * @param app The app which executed the action.
   * @returns A promise which resolves when the macro has been successfully simulated.
   */
  async execute(item: DeepReadonly<MenuItem>, app: KandoApp) {
    const menu = (item.data as ItemData).menu;

    if (menu === '') {
      throw new Error('Menu name should not be empty!');
    }

    app.showMenu({ name: menu });
  }
}

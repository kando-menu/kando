//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IMenuItem, IKeySequence } from '../index';
import { IItemAction } from '../item-action-registry';
import { Backend } from '../../main/backends/backend';
import { DeepReadonly } from '../../main/settings';
import { IItemData } from './macro-item-type';

/**
 * This action simulates multiple key presses and releases. It can be used to simulate
 * more complex macros than the simple hotkey action.
 */
export class MacroItemAction implements IItemAction {
  /**
   * For macros, we can choose to execute them immediately or with a delay.
   *
   * @param item The item for which we want to know if the action should be executed
   *   immediately or with a delay.
   * @returns True if the action should be executed with a delay.
   */
  delayedExecution(item: DeepReadonly<IMenuItem>) {
    return (item.data as IItemData).delayed;
  }

  /**
   * This method simulates the macro.
   *
   * @param item The item for which the action should be executed.
   * @param backend The backend which is currently used. This is used to simulate the key
   *   presses.
   * @returns A promise which resolves when the macro has been successfully simulated.
   */
  async execute(item: DeepReadonly<IMenuItem>, backend: Backend) {
    return new Promise<void>((resolve, reject) => {
      const data = item.data as IItemData;

      const keys: IKeySequence = [];

      // We remove all whitespace and split the macro into its parts.
      const parts = data.macro.replace(/\s/g, '').split('+');

      parts.forEach((part) => {
        const [key, event] = part.split(':');
        if (event === 'up') {
          keys.push({ name: key, down: false, delay: 10 });
        } else if (event === 'down') {
          keys.push({ name: key, down: true, delay: 10 });
        }
      });

      // Finally, we simulate the key presses using the backend.
      backend.simulateKeys(keys).then(resolve, reject);
    });
  }
}

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
import { IItemData } from './hotkey-item-type';

/** This action simulates key presses. It can be used to simulate hotkeys. */
export class HotkeyItemAction implements IItemAction {
  /**
   * For hotkeys, we can choose to execute them immediately or with a delay.
   *
   * @param item The item for which we want to know if the action should be executed
   *   immediately or with a delay.
   * @returns True if the action should be executed with a delay.
   */
  delayedExecution(item: DeepReadonly<IMenuItem>) {
    return (item.data as IItemData).delayed;
  }

  /**
   * This method simulates key presses. It first presses all keys and then releases them
   * again. We add a small delay between the key presses to make sure that the keys are
   * pressed in the correct order.
   *
   * @param item The item for which the action should be executed.
   * @param backend The backend which is currently used. This is used to simulate the key
   *   presses.
   * @returns A promise which resolves when the hotkey has been successfully simulated.
   */
  async execute(item: DeepReadonly<IMenuItem>, backend: Backend) {
    return new Promise<void>((resolve, reject) => {
      const keyNames = (item.data as IItemData).hotkey.split('+');

      // We simulate the key press by first pressing all keys and then releasing
      // them again. We add a small delay between the key presses to make sure
      // that the keys are pressed in the correct order.
      const keys: IKeySequence = [];

      // First press all keys.
      for (const key of keyNames) {
        keys.push({ name: key, down: true, delay: 10 });
      }

      // Then release all keys.
      for (const key of keyNames) {
        keys.push({ name: key, down: false, delay: 10 });
      }

      // Finally, we simulate the key presses using the backend.
      backend.simulateKeys(keys).then(resolve, reject);
    });
  }
}

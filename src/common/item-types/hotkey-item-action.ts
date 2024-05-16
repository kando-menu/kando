//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IMenuItem, IKeySequence } from '../index';
import { IItemAction } from '../action-registry';
import { Backend } from '../../main/backends/backend';
import { DeepReadonly } from '../../main/settings';
import { IItemData } from './hotkey-item-meta';

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
      // We convert some common key names to the corresponding left key names.
      const keyNames = (item.data as IItemData).hotkey.split('+').map((name) => {
        // There are many different names for the Control key. We convert them all
        // to "ControlLeft".
        if (
          name === 'CommandOrControl' ||
          name === 'CmdOrCtrl' ||
          name === 'Command' ||
          name === 'Control' ||
          name === 'Cmd' ||
          name === 'Ctrl'
        ) {
          return 'ControlLeft';
        }

        if (name === 'Shift') return 'ShiftLeft';
        if (name === 'Meta' || name === 'Super') return 'MetaLeft';
        if (name === 'Alt') return 'AltLeft';

        // If the key name is an integer, we assume that it is a number key. In this
        // case, we prefix it with "Digit".
        if (!isNaN(parseInt(name))) return 'Digit' + name;

        // If the key name is only one character long, we assume that it is a
        // single character which should be pressed. In this case, we prefix it
        // with "Key".
        if (name.length === 1) return 'Key' + name.toUpperCase();

        return name;
      });

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

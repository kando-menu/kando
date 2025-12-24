//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { MenuItem, KeySequence } from '../../common/index';
import { ItemAction } from './item-action-registry';
import { DeepReadonly } from '../settings';
import { ItemData } from '../../common/item-types/macro-item-type';
import { KandoApp } from '../app';

/**
 * This action simulates multiple key presses and releases. It can be used to simulate
 * more complex macros than the simple hotkey action.
 */
export class MacroItemAction implements ItemAction {
  /**
   * For macros, we can choose to execute them immediately or with a delay.
   *
   * @param item The item for which we want to know if the action should be executed
   *   immediately or with a delay.
   * @returns True if the action should be executed with a delay.
   */
  delayedExecution(item: DeepReadonly<MenuItem>) {
    return (item.data as ItemData).delayed;
  }

  /**
   * This method simulates the macro.
   *
   * @param item The item for which the action should be executed.
   * @param app The app which executed the action.
   * @returns A promise which resolves when the macro has been successfully simulated.
   */
  async execute(item: DeepReadonly<MenuItem>, app: KandoApp) {
    return new Promise<void>((resolve, reject) => {
      const data = item.data as ItemData;

      const keys: KeySequence = [];

      data.macro.forEach((event) => {
        const delay = event.delay || 10;
        const name = event.key;
        const down = event.type === 'keyDown';
        keys.push({ name, down, delay });
      });

      // Inhibit all shortcuts while simulating keys if the option is enabled.
      // This prevents the simulated input from triggering other Kando shortcuts.
      if (data.inhibitShortcuts) {
        app.getBackend().inhibitAllShortcuts();
      }

      // Finally, we simulate the key presses using the backend.
      app.getBackend().simulateKeys(keys).then(
        () => {
          // Restore all shortcuts after simulation completes if they were inhibited.
          if (data.inhibitShortcuts) {
            app.getBackend().inhibitShortcuts([]);
          }
          resolve();
        },
        (error) => {
          // Restore all shortcuts even if an error occurred.
          if (data.inhibitShortcuts) {
            app.getBackend().inhibitShortcuts([]);
          }
          reject(error);
        }
      );
    });
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { exec } from 'child_process';

import { IMenuItem } from '../index';
import { IItemAction } from '../item-action-registry';
import { DeepReadonly } from '../../main/settings';
import { IItemData } from './command-item-type';

/** This action runs commands. This can be used to start applications or run scripts. */
export class CommandItemAction implements IItemAction {
  /**
   * Commands can be executed immediately or with a delay.
   *
   * @param item The item for which we want to know if the action should be executed
   *   immediately or with a delay.
   * @returns True if the action should be executed with a delay.
   */
  delayedExecution(item: DeepReadonly<IMenuItem>) {
    return (item.data as IItemData).delayed;
  }

  /**
   * Runs the command.
   *
   * @param item The item for which the action should be executed.
   * @returns A promise which resolves when the command has been successfully executed.
   */
  async execute(item: DeepReadonly<IMenuItem>) {
    return new Promise<void>((resolve, reject) => {
      const command = (item.data as IItemData).command;

      exec(command, (error) => {
        if (error) {
          reject(error.message);
        } else {
          resolve();
        }
      });
    });
  }
}

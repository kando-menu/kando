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
import { Backend, WMInfo } from '../../main/backends/backend';

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
   * @param wmInfo Information about the window manager state when the menu was opened.
   * @returns A promise which resolves when the command has been successfully executed.
   */
  async execute(item: DeepReadonly<IMenuItem>, backend: Backend, wmInfo: WMInfo) {
    return new Promise<void>((resolve, reject) => {
      let command = (item.data as IItemData).command;

      // Replace placeholders in the command string.
      command = command
        .replace(/\{{app_name}}/g, wmInfo.appName)
        .replace(/\{{window_name}}/g, wmInfo.windowName)
        .replace(/\{{pointer_x}}/g, wmInfo.pointerX.toString())
        .replace(/\{{pointer_y}}/g, wmInfo.pointerY.toString());

      // Remove the CHROME_DESKTOP environment variable if it is set.
      // See https://github.com/kando-menu/kando/issues/552
      const env = { ...process.env };
      delete env.CHROME_DESKTOP;

      exec(command, { env }, (error) => {
        if (error) {
          reject(error.message);
        } else {
          resolve();
        }
      });
    });
  }
}

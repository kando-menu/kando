//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IMenuItem } from '../../common/index';
import { IItemAction } from './item-action-registry';
import { DeepReadonly } from '../utils/settings';
import { IItemData } from '../../common/item-types/command-item-type';
import { KandoApp } from '../app';
import { exec } from '../utils/shell';

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
   * Runs the command. It will asynchronously wait for one second to see if the command
   * finishes with an non-zero exit code. If it does, the promise will be rejected. Else
   * it will assume that the command was started successfully and resolve the promise. So
   * if an error occurs after one second, it will not be detected.
   *
   * @param item The item for which the action should be executed.
   * @param app The app which executed the action.
   * @returns A promise which resolves when the command has been successfully started.
   */
  async execute(item: DeepReadonly<IMenuItem>, app: KandoApp) {
    let command = (item.data as IItemData).command;

    // Replace placeholders in the command string.
    command = command
      .replace(/\{{app_name}}/g, app.getLastWMInfo().appName)
      .replace(/\{{window_name}}/g, app.getLastWMInfo().windowName)
      .replace(/\{{pointer_x}}/g, app.getLastWMInfo().pointerX.toString())
      .replace(/\{{pointer_y}}/g, app.getLastWMInfo().pointerY.toString());

    return exec(command, {
      detach: (item.data as IItemData).detached,
      isolate: (item.data as IItemData).isolated,
    });
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ExecuteCommandAction } from '../../common';
import { KandoApp } from '../app';
import { DeepReadonly } from '../settings';
import { Notification } from '../utils/notification';
import { exec } from '../utils/shell';

/**
 * This action executes a command. It will asynchronously wait for one second to see if
 * the command finishes with an non-zero exit code. If it does, the promise will be
 * rejected. Else it will assume that the command was started successfully and resolve the
 * promise. So if an error occurs after one second, it will not be detected.
 *
 * @param action The action for which the command should be executed.
 * @param app The app which executed the action.
 * @returns A promise which resolves when the command has been successfully started.
 */
export async function execute(action: DeepReadonly<ExecuteCommandAction>, app: KandoApp) {
  // Replace placeholders in the command string.
  const command = action.command
    .replace(/\{{app_name}}/g, app.getLastWMInfo().appName)
    .replace(/\{{window_name}}/g, app.getLastWMInfo().windowName)
    .replace(/\{{pointer_x}}/g, app.getLastWMInfo().pointerX.toString())
    .replace(/\{{pointer_y}}/g, app.getLastWMInfo().pointerY.toString());

  exec(command, {
    detach: action.detached,
    isolate: action.isolated,
  }).catch((error) => {
    Notification.show({
      title: `Failed to execute command: ${command}`,
      message: error,
      type: 'error',
    });
  });
}

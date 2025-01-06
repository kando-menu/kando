//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { spawn, StdioOptions } from 'child_process';
import * as os from 'os';

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
   * Runs the command. It will asynchronously wait for one second to see if the command
   * finishes with an non-zero exit code. If it does, the promise will be rejected. Else
   * it will assume that the command was started successfully and resolve the promise. So
   * if an error occurs after one second, it will not be detected.
   *
   * @param item The item for which the action should be executed.
   * @param backend The backend which is currently in use.
   * @param wmInfo Information about the window manager state when the menu was opened.
   * @returns A promise which resolves when the command has been successfully started.
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

      // If we are inside a flatpak container, we cannot execute commands directly on the host.
      // Instead we need to use flatpak-spawn.
      if (env.container && env.container === 'flatpak') {
        command = 'flatpak-spawn --host ' + command;
      }

      // We are only interested in a potential error output.
      const stdio: StdioOptions = ['ignore', 'ignore', 'pipe'];

      const options = {
        env,
        cwd: os.homedir(),
        shell: true,
        detached: true,
        stdio,
      };

      const child = spawn(command, [], options);

      let resolved = false;
      let errorOutput = '';

      // We set a timeout of one second. If the process does not exit within this time,
      // we assume that it was started successfully and resolve the promise.
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          child.unref();
          resolve();
        }
      }, 1000);

      // We collect the error output of the process.
      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      // If the process exits within the timeout, we either resolve or reject the promise
      // based on the exit code.
      child.on('exit', (code) => {
        if (!resolved) {
          clearTimeout(timeout);
          resolved = true;
          if (code !== 0) {
            reject(errorOutput);
          } else {
            resolve();
          }
        }
      });
    });
  }
}

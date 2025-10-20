//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { shell } from 'electron';

import { MenuItem } from '../../common/index';
import { ItemAction } from './item-action-registry';
import { DeepReadonly } from '../settings';
import { ItemData } from '../../common/item-types/file-item-type';
import { exec } from '../utils/shell';

/** This action opens files with the default application. */
export class FileItemAction implements ItemAction {
  /**
   * Files are opened immediately.
   *
   * @returns False
   */
  delayedExecution() {
    return false;
  }

  /**
   * Opens a file with the default application.
   *
   * @param item The item for which the action should be executed.
   * @returns A promise which resolves when the file has been opened.
   */
  async execute(item: DeepReadonly<MenuItem>) {
    const path = (item.data as ItemData).path;

    // On some Linux desktops, Electron's shell.openPath does not work properly. See here:
    // https://github.com/kando-menu/kando/issues/1058
    // This is a bit weird, as Electron seems to call nothing more than xdg-open itself,
    // but for some reason this does not always work. So we call xdg-open manually here.
    // Electron's xdg-open call is here:
    // https://github.com/electron/electron/blob/16b5776b0170a501d8acb8105e14b15846533442/shell/common/platform_util_linux.cc#L324
    if (process.platform === 'linux') {
      exec(`xdg-open ${path}`, {
        detach: true,
        isolate: false,
      });
    } else {
      shell.openPath(path);
    }
  }
}

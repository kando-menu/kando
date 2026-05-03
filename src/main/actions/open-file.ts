//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { shell } from 'electron';

import { OpenFileAction } from '../../common';
import { DeepReadonly } from '../settings';
import { exec } from '../utils/shell';

/**
 * Opens a file with the default application.
 *
 * @param action The action for which the file should be opened.
 * @returns A promise which resolves when the file has been opened.
 */
export async function execute(action: DeepReadonly<OpenFileAction>) {
  // On some Linux desktops, Electron's shell.openPath does not work properly. See here:
  // https://github.com/kando-menu/kando/issues/1058
  // This is a bit weird, as Electron seems to call nothing more than xdg-open itself,
  // but for some reason this does not always work. So we call xdg-open manually here.
  // Electron's xdg-open call is here:
  // https://github.com/electron/electron/blob/16b5776b0170a501d8acb8105e14b15846533442/shell/common/platform_util_linux.cc#L324
  if (process.platform === 'linux') {
    return exec(`xdg-open "${action.path}"`, {
      detach: true,
      isolate: false,
    });
  }

  await shell.openPath(action.path);
}

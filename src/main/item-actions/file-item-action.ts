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
    await shell.openPath((item.data as ItemData).path);
    return;
  }
}

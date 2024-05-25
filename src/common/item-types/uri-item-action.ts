//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IMenuItem } from '../index';
import { IItemAction } from '../item-action-registry';
import { DeepReadonly } from '../../main/settings';
import { IItemData } from './uri-item-type';

import { shell } from 'electron';

/**
 * This action opens URIs with the default application. This can be used to open for
 * example websites or files.
 */
export class URIItemAction implements IItemAction {
  /**
   * URIs are opened immediately.
   *
   * @returns False
   */
  delayedExecution() {
    return false;
  }

  /**
   * Opens the URI with the default application.
   *
   * @param item The item for which the action should be executed.
   * @returns A promise which resolves when the URI has been successfully opened.
   */
  async execute(item: DeepReadonly<IMenuItem>) {
    return shell.openExternal((item.data as IItemData).uri);
  }
}

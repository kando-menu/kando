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
import { ItemData } from '../../common/item-types/uri-item-type';
import { WMInfo } from '../../common';
import { KandoApp } from '../app';

/**
 * This action opens URIs with the default application. This can be used to open for
 * example websites or files.
 */
export class URItemAction implements ItemAction {
  /**
   * URIs are opened immediately.
   *
   * @returns False
   */
  delayedExecution() {
    return false;
  }

  /**
   * Replaces placeholders in the URI string with actual values.
   *
   * @param uri The URI string.
   * @param backend The backend which is currently in use.
   * @param wmInfo Information about the window manager state when the menu was opened.
   * @returns The URI string with placeholders replaced.
   */
  private replacePlaceholders(uri: string, wmInfo: WMInfo): string {
    return uri
      .replace(/\{{app_name}}/g, wmInfo.appName)
      .replace(/\{{window_name}}/g, wmInfo.windowName)
      .replace(/\{{pointer_x}}/g, wmInfo.pointerX.toString())
      .replace(/\{{pointer_y}}/g, wmInfo.pointerY.toString());
  }

  /**
   * Opens the URI with the default application.
   *
   * @param item The item for which the action should be executed.
   * @param app The app which executed the action.
   * @returns A promise which resolves when the URI has been successfully opened.
   */
  async execute(item: DeepReadonly<MenuItem>, app: KandoApp) {
    let uri = (item.data as ItemData).uri;
    uri = this.replacePlaceholders(uri, app.getLastWMInfo());
    return shell.openExternal(uri);
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { shell } from 'electron';

import { OpenURIAction } from '../../common';
import { KandoApp } from '../app';
import { DeepReadonly } from '../settings';

/**
 * This action opens URIs with the default application. This can be used to open for
 * example websites or files.
 *
 * @param action The action for which the URI should be opened.
 * @param app The app which executed the action.
 * @returns A promise which resolves when the URI has been successfully opened.
 */
export async function execute(action: DeepReadonly<OpenURIAction>, app: KandoApp) {
  const wmInfo = app.getLastWMInfo();
  const uri = action.uri
    .replace(/\{{app_name}}/g, wmInfo.appName)
    .replace(/\{{window_name}}/g, wmInfo.windowName)
    .replace(/\{{pointer_x}}/g, wmInfo.pointerX.toString())
    .replace(/\{{pointer_y}}/g, wmInfo.pointerY.toString());
  return shell.openExternal(uri);
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { CloseSubmenuAction } from '../../common';
import { KandoApp } from '../app';
import { DeepReadonly } from '../settings';

/**
 * This action closes the current submenu.
 *
 * @param action The action for which the workflow is executed.
 * @param app The app which executed the action.
 * @returns A promise which resolves immediately.
 */
export async function execute(action: DeepReadonly<CloseSubmenuAction>, app: KandoApp) {
  app.getMenuWindow().closeSubmenu();
}

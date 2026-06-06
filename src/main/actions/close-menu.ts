//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { CloseMenuAction } from '../../common';
import { KandoApp } from '../app';
import { DeepReadonly } from '../settings';

/**
 * This action closes the menu. It can be used in the workflows of menu items to close the
 * menu after an action has been executed.
 *
 * @param action The action for which the workflow is executed.
 * @param app The app which executed the action.
 * @returns A promise which resolves when the menu has been successfully closed.
 */
export async function execute(action: DeepReadonly<CloseMenuAction>, app: KandoApp) {
  await app.getMenuWindow().closeMenu();
}

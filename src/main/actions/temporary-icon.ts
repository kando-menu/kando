//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    Read more on github.com/kando-menu/kando               //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { TemporaryIconAction } from '../../common';
import { KandoApp } from '../app';
import { DeepReadonly } from '../settings';

/**
 * Temporarily changes the icon of the menu item whose workflow is running.
 *
 * @param action The action to execute.
 * @param app The app which executed the action.
 * @param menuItemPath The path of the menu item whose workflow is running.
 */
export async function execute(
  action: DeepReadonly<TemporaryIconAction>,
  app: KandoApp,
  menuItemPath?: number[]
) {
  if (!menuItemPath) {
    throw new Error('The temporary icon action requires a menu item workflow.');
  }

  const menuWindow = app.getMenuWindow();
  if (!menuWindow) {
    throw new Error('Cannot change a menu icon when the menu window is unavailable.');
  }

  menuWindow.setTemporaryIcon(menuItemPath, action.icon, action.iconTheme);
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { InhibitShortcutsAction } from '../../common';
import { KandoApp } from '../app';
import { DeepReadonly } from '../settings';

/**
 * This action inhibits shortcuts. It can be used in the workflows of menu items to
 * temporarily disable Kando's menu shortcuts while the workflow is executed.
 *
 * @param action The action for which the workflow is executed.
 * @param app The app which executed the action.
 * @returns A promise which resolves when the menu has been successfully closed.
 */
export async function execute(
  action: DeepReadonly<InhibitShortcutsAction>,
  app: KandoApp
) {
  const inhibitionID = await app.getBackend().inhibitAllShortcuts();

  return async () => {
    await app.getBackend().releaseInhibition(inhibitionID);
  };
}

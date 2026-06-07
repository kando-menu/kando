//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { FocusWindowAction } from '../../common';
import { KandoApp } from '../app';
import { DeepReadonly } from '../settings';

/**
 * This action will focus a matching application window.
 *
 * @param action The action for which the focus should be applied.
 * @param app The app which executed the action.
 * @returns A promise which resolves when the focus has been successfully applied.
 */
export async function execute(action: DeepReadonly<FocusWindowAction>, app: KandoApp) {
  console.debug('Executing focus window action', action);
}

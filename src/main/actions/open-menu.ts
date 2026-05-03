//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: yar2001T <https://github.com/yar2000T>
// SPDX-License-Identifier: MIT

import { OpenMenuAction } from '../../common';
import { KandoApp } from '../app';
import { DeepReadonly } from '../settings';

/**
 * This action opens the specified menu.
 *
 * @param action The action for which the menu should be opened.
 * @param app The app which executed the action.
 */
export async function execute(action: DeepReadonly<OpenMenuAction>, app: KandoApp) {
  if (action.menu === '') {
    throw new Error('Menu name should not be empty!');
  }

  await app.showMenu({ name: action.menu });
}

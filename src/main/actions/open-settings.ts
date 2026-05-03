//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { OpenSettingsAction } from '../../common';
import { KandoApp } from '../app';
import { DeepReadonly } from '../settings';

/**
 * Opens the Kando settings window.
 *
 * @param action The action to execute.
 * @param app The app which executed the action.
 */
export async function execute(action: DeepReadonly<OpenSettingsAction>, app: KandoApp) {
  void action;
  app.showSettings();
}

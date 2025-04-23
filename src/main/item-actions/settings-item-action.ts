//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IMenuItem } from '../../common/index';
import { IItemAction } from './item-action-registry';
import { DeepReadonly } from '../utils/settings';
import { KandoApp } from '../app';

/** This action opens Kando settings. */
export class SettingsItemAction implements IItemAction {
  /**
   * Opening settings is never delayed.
   *
   * @returns False
   */
  delayedExecution() {
    return false;
  }

  /**
   * Opens the Kando settings window.
   *
   * @param item The item for which the action should be executed. - Unused
   * @param app The app which executed the action.
   * @returns Void
   */
  async execute(_item: DeepReadonly<IMenuItem>, app: KandoApp) {
    app.showSettings();
  }
}

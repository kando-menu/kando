//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ItemAction } from './item-action-registry';

/**
 * This dummy action does nothing. It is used for item types which are only instantiated
 * via the IPC interface, but have no predefined action.
 */
export class NoItemAction implements ItemAction {
  delayedExecution() {
    return false;
  }

  async execute() {}
}

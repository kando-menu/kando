//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import clipboard from 'clipboardy';

import { SetClipboardAction } from '../../common';
import { DeepReadonly } from '../settings';

/**
 * Stores the given text in the clipboard.
 *
 * @param action The action for which the clipboard text should be set.
 */
export async function execute(action: DeepReadonly<SetClipboardAction>) {
  if (!action.text) {
    return;
  }

  // Since Electron 33, the clipboard API seems to be broken on Wayland. Hence, we use
  // the clipboardy package instead.
  clipboard.writeSync(action.text);
}

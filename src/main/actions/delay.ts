//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { DelayAction } from '../../common';
import { DeepReadonly } from '../settings';

/**
 * Waits for a specified amount of time.
 *
 * @param action The action for which the delay should be performed.
 * @returns A promise which resolves when the specified time has elapsed.
 */
export async function execute(action: DeepReadonly<DelayAction>): Promise<void> {
  const duration = action.duration * 1000; // Convert seconds to milliseconds.

  return new Promise((resolve) => setTimeout(resolve, duration));
}

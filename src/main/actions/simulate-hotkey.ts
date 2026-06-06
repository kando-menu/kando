//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { KeySequence, SimulateHotkeyAction } from '../../common';
import { KandoApp } from '../app';
import { DeepReadonly } from '../settings';

/**
 * Simulates key presses for a configured hotkey. It first presses all keys and then
 * releases them again.
 *
 * @param action The action for which the hotkey should be simulated.
 * @param app The app which executed the action.
 * @returns A promise which resolves when the hotkey has been successfully simulated.
 */
export async function execute(action: DeepReadonly<SimulateHotkeyAction>, app: KandoApp) {
  const keyNames = action.hotkey.split('+');

  const keys: KeySequence = [];

  // First press all keys.
  for (const key of keyNames) {
    keys.push({ name: key, down: true, delay: 10 });
  }

  // Then release all keys.
  for (const key of keyNames) {
    keys.push({ name: key, down: false, delay: 10 });
  }

  await app.getBackend().simulateKeys(keys);
}

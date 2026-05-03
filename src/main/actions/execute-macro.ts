//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ExecuteMacroAction, KeySequence } from '../../common';
import { KandoApp } from '../app';
import { DeepReadonly } from '../settings';

/**
 * This action simulates multiple key presses and releases. It can be used to simulate
 * more complex macros than the simple hotkey action.
 *
 * @param action The action for which the macro should be simulated.
 * @param app The app which executed the action.
 * @returns A promise which resolves when the macro has been successfully simulated.
 */
export async function execute(action: DeepReadonly<ExecuteMacroAction>, app: KandoApp) {
  const keys: KeySequence = [];

  action.macro.forEach((event) => {
    keys.push({
      name: event.key,
      down: event.type === 'keyDown',
      delay: event.delay ?? 10,
    });
  });

  const backend = app.getBackend();

  await backend.simulateKeys(keys);
}

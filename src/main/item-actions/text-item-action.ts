//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import os from 'node:os';
import { clipboard } from 'electron';

import { MenuItem } from '../../common/index';
import { ItemAction } from './item-action-registry';
import { DeepReadonly } from '../settings';
import { ItemData } from '../../common/item-types/text-item-type';
import { KandoApp } from '../app';

/** This action pastes some given text into the active window. */
export class TextItemAction implements ItemAction {
  /**
   * Pasting text is always delayed.
   *
   * @returns False
   */
  delayedExecution() {
    return true;
  }

  /**
   * Stores the given text in the clipboard and pastes it into the active window by
   * simulating a Ctrl+V key press.
   *
   * @param item The item for which the action should be executed.
   * @param app The app which executed the action.
   * @returns A promise which resolves when the URI has been successfully opened.
   */
  async execute(item: DeepReadonly<MenuItem>, app: KandoApp) {
    const text = (item.data as ItemData).text;
    if (text) {
      clipboard.writeText(text);

      const ctrl = os.platform() === 'darwin' ? 'MetaLeft' : 'ControlLeft';

      const ctrlV = [
        { name: ctrl, down: true, delay: 0 },
        { name: 'KeyV', down: true, delay: 10 },
        { name: 'KeyV', down: false, delay: 10 },
        { name: ctrl, down: false, delay: 10 },
      ];

      app.getBackend().simulateKeys(ctrlV);
    }
  }
}

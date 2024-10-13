//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import os from 'node:os';

import { IMenuItem } from '../index';
import { IItemAction } from '../item-action-registry';
import { DeepReadonly } from '../../main/settings';
import { IItemData } from './text-item-type';
import { Backend } from '../../main/backends/backend';
import { clipboard } from 'electron';

/** This action pastes some given text into the active window. */
export class TextItemAction implements IItemAction {
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
   * @param backend The backend which is currently in use.
   * @returns A promise which resolves when the URI has been successfully opened.
   */
  async execute(item: DeepReadonly<IMenuItem>, backend: Backend) {
    const text = (item.data as IItemData).text;
    if (text) {
      clipboard.writeText(text);

      const ctrl = os.platform() === 'darwin' ? 'MetaLeft' : 'ControlLeft';

      const ctrlV = [
        { name: ctrl, down: true, delay: 0 },
        { name: 'KeyV', down: true, delay: 10 },
        { name: 'KeyV', down: false, delay: 10 },
        { name: ctrl, down: false, delay: 10 },
      ];

      backend.simulateKeys(ctrlV);
    }
  }
}

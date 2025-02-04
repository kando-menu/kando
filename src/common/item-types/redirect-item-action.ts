//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: yar2001T <https://github.com/yar2000T>
// SPDX-License-Identifier: MIT

import { IMenuItem } from '../index';
import { IItemAction } from '../item-action-registry';
import { DeepReadonly } from '../../main/settings';
import { IItemData } from './redirect-item-type';
import { Backend, WMInfo } from '../../main/backends/backend';
import { kando } from '../../main';
import { Notification } from 'electron';
import * as path from 'path'; // Ensure 'path' module is imported

export class RedirectItemAction implements IItemAction {
  delayedExecution(item: DeepReadonly<IMenuItem>) {
    return (item.data as IItemData).delayed;
  }

  async execute(
    item: DeepReadonly<IMenuItem>,
    _backend: Backend, // eslint-disable-line @typescript-eslint/no-unused-vars
    _wmInfo: WMInfo // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const menu = (item.data as IItemData).menu;

        const env = { ...process.env };
        delete env.CHROME_DESKTOP;

        if (!menu) {
          const errorMessage = 'Menu name is undefined or empty.';
          console.error(errorMessage);
          this.showError(errorMessage, 'Invalid menu name');
          reject(new Error(errorMessage));
          return;
        }

        try {
          kando.showMenu({
            trigger: '',
            name: menu,
          });

          resolve();
        } catch (error) {
          const errorMessage = 'Error showing menu';
          console.error(errorMessage + ':', error);
          this.showError(errorMessage, error.toString());
          reject(error);
        }
      } catch (error) {
        const errorMessage = 'Unexpected error in execute';
        console.error(errorMessage + ':', error);
        this.showError(errorMessage, error.toString());
        reject(error);
      }
    });
  }

  private showError(message: string, error: string) {
    console.error(message + ': ' + error);

    if (Notification.isSupported()) {
      const notification = new Notification({
        title: message + '.',
        body: error,
        icon: path.join(__dirname, require('../../../assets/icons/icon.png')),
      });

      notification.show();
    }
  }
}

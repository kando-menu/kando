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
  /**
   * Commands can be executed immediately or with a delay.
   *
   * @param item The item for which we want to know if the action should be executed
   *   immediately or with a delay.
   * @returns True if the action should be executed with a delay.
   */
  delayedExecution(item: DeepReadonly<IMenuItem>) {
    return (item.data as IItemData).delayed;
  }

  /**
   * Opens the menu.
   * 
   * @param item The item for which the action should be executed.
   * @param backend The backend which is currently in use.
   * @param wmInfo Information about the window manager state when the menu was opened.
   * @returns A promise which resolves when the menu has been successfully opened.
   */
  async execute(item: DeepReadonly<IMenuItem>, backend: Backend, wmInfo: WMInfo): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        let menu = (item.data as IItemData).menu;

        // Remove the CHROME_DESKTOP environment variable if it is set.
        const env = { ...process.env };
        delete env.CHROME_DESKTOP;

        // Ensure menu name is valid before proceeding
        if (!menu) {
          const errorMessage = 'Menu name is undefined or empty.';
          console.error(errorMessage);
          this.showError(errorMessage, 'Invalid menu name');
          reject(new Error(errorMessage));
          return;
        }
        
        // Try calling showMenu and catch any potential errors
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

  /**
   * Show error notifications using Electron's Notification API.
   * @param message The title/message for the notification.
   * @param error The error details to show.
   */
  private showError(message: string, error: string) {
    console.error(message + ': ' + error);

    if (Notification.isSupported()) {
      const notification = new Notification({
        title: message + '.',
        body: error,
        icon: path.join(__dirname, require('../../assets/icons/icon.png')),
      });

      notification.show();
    }
  }
}

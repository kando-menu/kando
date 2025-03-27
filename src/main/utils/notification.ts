//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import path from 'path';

import { Notification as ElectronNotification } from 'electron';

/**
 * This class provides a static method to show notifications. It will print the message to
 * the console and show a notification if possible.
 */
export class Notification {
  /**
   * This prints a message to the console and shows a notification if possible.
   *
   * @param title The message to show.
   * @param message The message to show.
   * @param onClick An optional function to call when the notification is clicked.
   */
  static show(title: string, message: string, onClick?: () => void) {
    console.log(title + ': ' + message);

    if (ElectronNotification.isSupported()) {
      const notification = new ElectronNotification({
        title: title,
        body: message,
        icon: path.join(__dirname, require('../../../assets/icons/icon.png')),
      });

      if (onClick) {
        notification.on('click', onClick);
      }

      notification.show();
    }
  }

  /**
   * This prints an error message to the console and shows a notification if possible.
   *
   * @param title The message to show.
   * @param error The error to show.
   */
  static showError(title: string, error: string) {
    console.error(title + ': ' + error);

    if (ElectronNotification.isSupported()) {
      const notification = new ElectronNotification({
        title: title,
        body: error,
        icon: path.join(__dirname, require('../../../assets/icons/icon.png')),
      });

      notification.show();
    }
  }
}

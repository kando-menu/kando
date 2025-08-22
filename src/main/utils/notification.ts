//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import path from 'path';
import { app } from 'electron';

import { Notification as ElectronNotification } from 'electron';

/** Options for displaying a notification. */
export type NotificationOptions = {
  /** The title of the notification. */
  title: string;

  /** The message to show. */
  message: string;

  /** The type of notification. Defaults to 'info'. */
  type?: 'info' | 'error';

  /** An optional function to call when the notification is clicked. */
  onClick?: () => void;
};

/**
 * This class provides a static method to show notifications. It will print the message to
 * the console and show a notification if possible.
 *
 * One issue with Electron's notification API is that it does only work after the app has
 * been initialized. However, we also need to show notifications before the app is
 * initialized, e.g. when the settings file cannot be loaded. Therefore, we use this class
 * allows queuing notifications until the app is ready.
 */
export class Notification {
  /**
   * This is a queue of notifications that will be shown once the app is ready. It is
   * initialized with an empty array.
   */
  private static notifications: NotificationOptions[] = [];

  /**
   * This initializes the handler for the app-ready event. It will show all queued
   * notifications once the app is ready.
   */
  static init() {
    app.on('ready', () => {
      for (const options of Notification.notifications) {
        Notification.show(options);
      }
      this.notifications = [];
    });
  }

  /**
   * This prints a message to the console and shows a notification if possible.
   *
   * @param options The options for the notification.
   */
  static show(options: NotificationOptions) {
    // If the app is not ready yet, we queue the notification.
    if (!app.isReady()) {
      Notification.notifications.push(options);
      return;
    }

    if (options.type === 'error') {
      console.error(options.title + ': ' + options.message);
    } else {
      console.log(options.title + ': ' + options.message);
    }

    if (ElectronNotification.isSupported()) {
      const notification = new ElectronNotification({
        title: options.title,
        body: options.message,
        icon: path.join(__dirname, require('../../../assets/icons/icon.png')),
      });

      if (options.onClick) {
        notification.on('click', options.onClick);
      }

      notification.show();
    }
  }
}

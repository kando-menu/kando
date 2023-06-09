//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { app } from 'electron';

/**
 * This file is the main entry point for Kando's host process. It is responsible for
 * handling the lifecycle of the app.
 */

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
  process.exit(0);
}

// Prevent multiple instances of the app. If another instance is started, we just quit
// this one. The first instance will get notified via the second-instance event and
// will show the menu.
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Start the app. We import the KandoApp class here make the code above as fast as
// possible.
import { KandoApp } from './main/app';
import { Notification } from 'electron';
import path from 'path';

const kando = new KandoApp();

// Show a message when the app is ready.
app
  .whenReady()
  .then(() => kando.init())
  .then(() => {
    // Show a nifty message when the app is about to quit.
    app.on('will-quit', async () => {
      await kando.quit();
      console.log('Good-Pie :)');
    });

    // Show the menu when the user starts the app for a second time.
    app.on('second-instance', () => kando.showMenu());

    // Finally, show a message that the app is ready.
    console.log(`Kando ${app.getVersion()} is ready.`);
    console.log('Press <Ctrl>+<Space> to open the prototype menu!');
  })
  .catch((err) => {
    // Show a notification when the app fails to start.
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: 'Kando failed to start.',
        body: 'Please check the console for more information.',
        icon: path.join(__dirname, require('../assets/icons/icon.png')),
      });

      notification.show();
    }

    console.error('Failed to initialize Kando: ' + err);
    app.quit();

    // Make sure the app quits with a non-zero exit code.
    process.exitCode = 1;
  });

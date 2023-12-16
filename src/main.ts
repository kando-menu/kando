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
 * handling the lifecycle of the app. The drawing of the menu and the editor is done in
 * the renderer process (see renderer.ts).
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

// Start the app. We import the KandoApp class here to make the code above as fast as
// possible.
import { KandoApp } from './main/app';
import { Notification } from 'electron';
import path from 'path';

// It is not very nice that electron stores all its cache data in the user's config
// directory. Until https://github.com/electron/electron/pull/34337 is merged, we
// move most of the stuff to a separate directory to make it easier to clean up.
app.setPath('sessionData', path.join(app.getPath('sessionData'), 'session'));
app.setPath('crashDumps', path.join(app.getPath('sessionData'), 'crashDumps'));
app.setAppLogsPath(path.join(app.getPath('sessionData'), 'logs'));

// Create the app and initialize it as soon as electron is ready.
const kando = new KandoApp();

app
  .whenReady()
  .then(() => kando.init())
  .then(() => {
    // Show a nifty message when the app is about to quit.
    app.on('will-quit', async () => {
      await kando.quit();
      console.log('Good-Pie :)');
    });

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

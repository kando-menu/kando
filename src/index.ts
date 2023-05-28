//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { app } from 'electron';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
  throw '';
}

// Prevent multiple instances of the app. In the future, we may want to show the
// preferences window instead.
// app.on('second-instance', (event, commandLine, workingDirectory) => {});
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  throw '';
}

// Start the app.
import { KandoApp } from './app';
const kando = new KandoApp();

app
  .whenReady()
  .then(() => kando.init())
  .then(() =>
    console.log('Kando is ready! Press <Ctrl>+<Space> to open the prototype menu.')
  )
  .catch((err) => {
    console.error('Failed to initialize Kando: ' + err);
    app.quit();
  });

app.on('will-quit', async () => {
  await kando.quit();
  console.log('Good-Pie :)');
});

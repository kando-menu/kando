//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do,                 //
//     . <   _|   .  | ____| |  | (   |    the open-source cross-platform pie menu.     //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

const electron = require('electron');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  electron.app.quit();
  throw '';
}

// Prevent multiple instances of the app. In the future, we may want to show the
// preferences window instead.
// electron.app.on('second-instance', (event, commandLine, workingDirectory) => {});
const gotTheLock = electron.app.requestSingleInstanceLock();
if (!gotTheLock) {
  electron.app.quit();
  throw '';
}

// The backend is responsible for all the system interaction. It is implemented
// differently for each platform.
const KenDoApp = require('./app').default;

// Start the app.
const app = new KenDoApp();
app.init()
  .then(() => {
    console.log('Ken-Do is ready!');
  })
  .catch(err => {
    console.error('Failed to initialize Ken-Do: ' + err);
    electron.app.quit();
  });

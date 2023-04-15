//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//    |  /  __|   \ |       _ \   _ \      This file is part of Ken-Do, the             //
//    . <   _|   .  | ____| |  | (   |     cross-platform marking menu.                 //
//   _|\_\ ___| _|\_|      ___/ \___/      Read more on github.com/ken-do/ken-do        //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

// Modules to control application life and create native browser window
const electron = require('electron');
const path     = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  electron.app.quit();
}

const gotTheLock = electron.app.requestSingleInstanceLock();

let mainWindow;

if (!gotTheLock) {
  electron.app.quit();
} else {
  electron.app.on('second-instance', (event, commandLine, workingDirectory) => {
    mainWindow.show();
  });


  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  electron.app.whenReady().then(() => {
    // electron.globalShortcut.register('Alt+CommandOrControl+I', () => {
    //   mainWindow.show();
    // });

    let mainScreen = electron.screen.getPrimaryDisplay();

    console.log(mainScreen.workAreaSize);


    mainWindow = new electron.BrowserWindow({
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
      },
      transparent: true,
      resizable: false,
      frame: false,
      alwaysOnTop: true,
      x: 0,
      y: 0,
      width: mainScreen.workAreaSize.width / 2 + 1,
      height: mainScreen.workAreaSize.height + 1,
      type: 'dock',
      show: false
    });

    mainWindow.once('ready-to-show', () => {
      let pos = electron.screen.getCursorScreenPoint();
      mainWindow.webContents.send('show-menu', pos);
      mainWindow.show();
    });

    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  });


  // electron.app.on('window-all-closed', function() {
  //   app.quit();
  // });

  electron.ipcMain.on('show-dev-tools', () => {
    mainWindow.webContents.openDevTools();
  });

  electron.ipcMain.on('hide-window', () => {
    electron.app.quit();
    // mainWindow.hide();
  });

  electron.ipcMain.on('item-selected', () => {
    console.log('foo');
  });

  electron.app.on('will-quit', () => {
    console.log('Bye!');
  });
}

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//    |  /  __|   \ |       _ \   _ \      This file is part of Ken-Do, the             //
//    . <   _|   .  | ____| |  | (   |     cross-platform marking menu.                 //
//   _|\_\ ___| _|\_|      ___/ \___/      Read more on github.com/ken-do/ken-do        //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

const electron = require('electron');
const os       = require('node:os');
const process  = require('node:process');

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

  if (os.platform() === 'linux') {
    console.log(`Running on Linux (${process.env.XDG_CURRENT_DESKTOP} on ${
      process.env.XDG_SESSION_TYPE})!`);
  } else if (os.platform() === 'win32') {
    console.log(`Running on Windows ${os.release()}!`);
  } else if (os.platform() === 'darwin') {
    console.log('MacOS is not yet supported!');
    electron.app.quit();
  }

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  electron.app.whenReady().then(() => {
    electron.globalShortcut.register('Shift+CommandOrControl+K', () => {
      mainWindow.show();
      let pos = electron.screen.getCursorScreenPoint();
      mainWindow.webContents.send('show-menu', pos);
    });

    let mainScreen = electron.screen.getPrimaryDisplay();

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
      width: mainScreen.workAreaSize.width + 1,
      height: mainScreen.workAreaSize.height + 1,
      type: 'dock',
      show: false
    });

    // mainWindow.once('ready-to-show', () => {
    //   mainWindow.show();
    //   let pos = electron.screen.getCursorScreenPoint();
    //   mainWindow.webContents.send('show-menu', pos);
    // });

    // mainWindow.once('focus', () => {
    //   console.log(electron.screen.getCursorScreenPoint());
    // });

    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  });


  electron.ipcMain.on('show-dev-tools', () => {
    mainWindow.webContents.openDevTools();
  });

  electron.ipcMain.on('hide-window', () => {
    // electron.app.quit();
    mainWindow.hide();
  });

  electron.ipcMain.on('item-selected', () => {
    console.log('foo');
  });

  electron.app.on('will-quit', () => {
    console.log('Bye!');
  });
}

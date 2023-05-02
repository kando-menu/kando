//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do, the truly       //
//     . <   _|   .  | ____| |  | (   |    amazing cross-platform marking menu.         //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

const electron = require('electron');

const Backend = require('./backend').default;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  electron.app.quit();
  throw '';
}

const gotTheLock = electron.app.requestSingleInstanceLock();
if (!gotTheLock) {
  electron.app.quit();
  throw '';
}

let backend = new Backend();
let mainWindow;

function showMenu() {
  backend.getFocusedWindow().then(window => {
    mainWindow.webContents.send('set-window-info', window);

    backend.getPointer().then(pointer => {
      mainWindow.show();
      mainWindow.webContents.send('show-menu', pointer);
    });
  });
}

// electron.app.on('second-instance', (event, commandLine, workingDirectory) => {});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron.app.whenReady().then(() => {
  backend.connect()
    .then(() => {
      console.log('Connected to backend');

      backend.bindShortcut('Shift+CommandOrControl+K', showMenu);
    })
    .catch(err => {
      console.error('Failed to connect to the Ken-Do Integration extension: ' + err);
    });


  let mainScreen = electron.screen.getPrimaryDisplay();

  mainWindow = new electron.BrowserWindow({
    webPreferences:
      {contextIsolation: true, sandbox: true, preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY},
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

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
});


electron.ipcMain.on('show-dev-tools', () => {
  mainWindow.webContents.openDevTools();
});

electron.ipcMain.on('hide-window', () => {
  mainWindow.hide();
});

electron.ipcMain.on('item-selected', () => {
  console.log('foo');
});

electron.ipcMain.on('simulate-shortcut', () => {
  mainWindow.hide();
  backend.simulateShortcut('Ctrl+Alt+Tab');
  // backend.simulateShortcut('Ctrl+Alt+Right');
});

electron.app.on('will-quit', () => {
  backend.unbindAllShortcuts();
  console.log('Bye!');
});

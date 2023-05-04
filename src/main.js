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

const Backend = require('./backend').default;
// electron.app.on('second-instance', (event, commandLine, workingDirectory) => {});


class KenDoApp {
  constructor() {
    this._backend = new Backend();
    this._window  = null;
  }

  async init() {
    await electron.app.whenReady();
    await this._backend.init();
    await this._backend.bindShortcut('Shift+CommandOrControl+K', () => {
      this._showMenu();
    });

    this._window = await this._initWindow();

    this._initRenderer();


    electron.app.on('will-quit', () => {
      this._backend.unbindAllShortcuts();
      console.log('Bye!');
    });
  }

  async _initWindow() {

    const screen = electron.screen.getPrimaryDisplay();

    const window = new electron.BrowserWindow({
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
      width: screen.workAreaSize.width + 1,
      height: screen.workAreaSize.height + 1,
      type: 'dock',
      show: false
    });

    await window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    return window;
  }

  _initRenderer() {
    electron.ipcMain.on('show-dev-tools', () => {
      this._window.webContents.openDevTools();
    });

    electron.ipcMain.on('hide-window', () => {
      this._window.hide();
    });

    electron.ipcMain.on('item-selected', () => {
      console.log('foo');
    });

    electron.ipcMain.on('simulate-shortcut', () => {
      this._window.hide();
      this._backend.simulateShortcut('Ctrl+Alt+Tab');
      // this._backend.simulateShortcut('Ctrl+Alt+Right');
    });
  }

  _showMenu() {
    Promise.all([this._backend.getFocusedWindow(), this._backend.getPointer()])
      .then(([window, pointer]) => {
        this._window.webContents.send('set-window-info', window);
        this._window.webContents.send('show-menu', pointer);
        this._window.show();
      })
      .catch(err => {
        console.error('Failed to show menu: ' + err);
      });
  }
}


const app = new KenDoApp();
app.init()
  .then(() => {
    console.log('Ken-Do is ready!');
  })
  .catch(err => {
    console.error('Failed to initialize Ken-Do: ' + err);
    electron.app.quit();
  });

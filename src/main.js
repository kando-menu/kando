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
const os       = require('node:os');

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
const Backend = require('./backend').default;

// This will get it's own file in the future.
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

    const windowTypes = {linux: 'dock', win32: 'toolbar', darwin: 'panel'};

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
      type: windowTypes[os.platform()],
      show: false
    });

    await window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    return window;
  }

  // Setup IPC communication with the renderer process.
  _initRenderer() {
    electron.ipcMain.on('show-dev-tools', () => {
      this._window.webContents.openDevTools();
    });

    electron.ipcMain.on('hide-window', () => {
      this._window.hide();
    });

    electron.ipcMain.on('item-selected', () => {
      console.log('Red circle was clicked!');
    });

    electron.ipcMain.on('simulate-shortcut', () => {
      this._window.hide();

      if (os.platform() === 'win32') {
        this._backend.simulateShortcut('Ctrl+Alt+Tab');
      } else {
        this._backend.simulateShortcut('Ctrl+Alt+Right');
      }
    });
  }

  // This is called when the user presses the shortcut. It will get the current
  // window and pointer position and send them to the renderer process.
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

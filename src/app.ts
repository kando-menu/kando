//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { screen, BrowserWindow, ipcMain } from 'electron';
import os from 'node:os';
import { Backend, getBackend } from './backend';

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

export class KandoApp {
  // The backend is responsible for all the system interaction. It is implemented
  // differently for each platform.
  private backend: Backend = getBackend();

  // The window is the main window of the application. It is a transparent window
  // which covers the whole screen. It is always on top and has no frame. It is used
  // to display the pie menu.
  private window: BrowserWindow = null;

  // This timeout is used to hide the window after the fade-out animation.
  private hideTimeout: NodeJS.Timeout = null;

  public async init() {
    await this.backend.init();
    await this.backend.bindShortcut('CommandOrControl+Space', () => {
      this.showMenu();
    });

    this.window = await this.initWindow();

    this.initRenderer();
  }

  // This is called when the app is closed. It will unbind all shortcuts.
  public async quit() {
    await this.backend.unbindAllShortcuts();
  }

  // This creates the main window. It is a transparent window which covers the whole
  // screen. It is always on top and has no frame. It is used to display the pie menu.
  private async initWindow() {
    const display = screen.getPrimaryDisplay();

    const windowTypes = new Map<string, string>([
      ['linux', 'dock'],
      ['win32', 'toolbar'],
      ['darwin', 'panel'],
    ]);

    const window = new BrowserWindow({
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
      transparent: true,
      resizable: false,
      frame: false,
      alwaysOnTop: true,
      x: display.workArea.x,
      y: display.workArea.y,
      width: display.workArea.width + 1,
      height: display.workArea.height + 1,
      type: windowTypes.get(os.platform()),
      show: false,
    });

    await window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    return window;
  }

  // Setup IPC communication with the renderer process.
  private initRenderer() {
    ipcMain.on('show-dev-tools', () => {
      this.window.webContents.openDevTools();
    });

    // We do not hide the window immediately when the user clicks on an item. Instead
    // we wait for the fade-out animation to finish. We also make the window click-through
    // by ignoring any input events during the fade-out animation.
    ipcMain.on('hide-window', (event, delay) => {
      this.window.setFocusable(false);
      this.window.setIgnoreMouseEvents(true);
      this.hideTimeout = setTimeout(() => {
        this.window.hide();
        this.hideTimeout = null;
      }, delay);
    });

    ipcMain.on('item-selected', () => {
      console.log('Red circle was clicked!');
    });

    ipcMain.on('log', (event, message) => {
      console.log(message);
    });

    ipcMain.on('simulate-shortcut', () => {
      this.window.hide();

      if (os.platform() === 'win32') {
        this.backend.simulateShortcut('Ctrl+Alt+Tab');
      } else {
        this.backend.simulateShortcut('Ctrl+Alt+Right');
      }
    });

    ipcMain.on('move-pointer', (event, pos) => {
      this.backend.movePointer(pos.x, pos.y);
    });
  }

  // This is called when the user presses the shortcut. It will get the current
  // window and pointer position and send them to the renderer process.
  private showMenu() {
    Promise.all([this.backend.getFocusedWindow(), this.backend.getPointer()])
      .then(([window, pointer]) => {
        // Abort any ongoing hide animation.
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
        }

        // Move the window to the monitor which contains the pointer.
        const workarea = screen.getDisplayNearestPoint(pointer).workArea;
        this.window.setBounds({
          x: workarea.x,
          y: workarea.y,
          width: workarea.width + 1,
          height: workarea.height + 1,
        });

        console.log('Currently focused window: ' + window.wmClass);

        this.window.webContents.send('show-menu', {
          x: pointer.x - workarea.x,
          y: pointer.y - workarea.y,
        });

        this.window.setFocusable(true);
        this.window.setIgnoreMouseEvents(false);
        this.window.show();
      })
      .catch((err) => {
        console.error('Failed to show menu: ' + err);
      });
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { screen, BrowserWindow, ipcMain, shell, Tray, Menu } from 'electron';
import { Backend, getBackend } from './backends';
import path from 'path';

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

/**
 * This class contains the main host process logic of Kando. It is responsible for
 * creating the transparent window and for handling IPC communication with the renderer
 * process. It also creates the backend which is responsible for all low-level system
 * interaction.
 */
export class KandoApp {
  // The backend is responsible for all the system interaction. It is implemented
  // differently for each platform.
  private backend: Backend = getBackend();

  // The window is the main window of the application. It is a transparent window
  // which covers the whole screen. It is always on top and has no frame. It is used
  // to display the pie menu.
  private window: BrowserWindow;

  // This timeout is used to hide the window after the fade-out animation.
  private hideTimeout: NodeJS.Timeout;

  // This is the tray icon which is displayed in the system tray. In the future it
  // will be possible to disable this icon.
  private tray: Tray;

  public async init() {
    if (this.backend === null) {
      throw new Error('No backend found.');
    }

    await this.backend.init();

    this.window = await this.initWindow();

    this.initRenderer();

    // Add a tray icon to the system tray. This icon can be used to open the pie menu
    // and to quit the application.
    this.tray = new Tray(path.join(__dirname, require('../../assets/icons/icon.png')));
    this.tray.setToolTip('Kando');
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open (Control + Space)',
        click: () => this.showMenu(),
      },
      { label: 'Quit', role: 'quit' },
    ]);
    this.tray.setContextMenu(contextMenu);

    await this.backend.bindShortcut({
      id: 'prototype_trigger',
      description: 'Trigger the Kando prototype',
      accelerator: 'CommandOrControl+Space',
      action: () => {
        this.showMenu();
      },
    });
  }

  // This is called when the app is closed. It will unbind all shortcuts.
  public async quit() {
    if (this.backend != null) {
      await this.backend.unbindAllShortcuts();
    }
  }

  // This creates the main window. It is a transparent window which covers the whole
  // screen. It is always on top and has no frame. It is used to display the pie menu.
  private async initWindow() {
    const display = screen.getPrimaryDisplay();

    const window = new BrowserWindow({
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
      transparent: true,
      resizable: false,
      skipTaskbar: true,
      frame: false,
      x: display.workArea.x,
      y: display.workArea.y,
      width: display.workArea.width + 1,
      height: display.workArea.height + 1,
      type: this.backend.getWindowType(),
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

    ipcMain.on('simulate-keys', (event, keys) => {
      this.window.hide();
      this.backend.simulateKeys(keys);
    });

    ipcMain.on('move-pointer', (event, dist) => {
      this.backend.movePointer(Math.floor(dist.x), Math.floor(dist.y));
    });

    ipcMain.on('open-uri', (event, uri) => {
      this.window.hide();
      shell.openExternal(uri);
    });
  }

  // This is called when the user presses the shortcut. It will get the current
  // window and pointer position and send them to the renderer process.
  private showMenu() {
    this.backend
      .getWMInfo()
      .then((info) => {
        // Abort any ongoing hide animation.
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
        }

        // Move the window to the monitor which contains the pointer.
        const workarea = screen.getDisplayNearestPoint({
          x: info.pointerX,
          y: info.pointerY,
        }).workArea;
        this.window.setBounds({
          x: workarea.x,
          y: workarea.y,
          width: workarea.width + 1,
          height: workarea.height + 1,
        });

        if (info.windowClass) {
          console.log('Currently focused window: ' + info.windowClass);
        } else {
          console.log('Currently no window is focused.');
        }

        this.window.webContents.send('show-menu', {
          x: info.pointerX - workarea.x,
          y: info.pointerY - workarea.y,
        });

        this.window.show();

        // There seems to be an issue with GNOME Shell 44.1 where the window does not
        // get focus when it is shown. This is a workaround for that issue.
        setTimeout(() => {
          this.window.focus();
        }, 100);
      })
      .catch((err) => {
        console.error('Failed to show menu: ' + err);
      });
  }
}

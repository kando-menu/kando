//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import os from 'node:os';
import { BrowserWindow, shell, ipcMain } from 'electron';

import { IAppSettings } from '../common';
import { Settings } from './utils/settings';
import { Backend } from './backends';
import { WindowsBackend } from './backends/windows/backend';

declare const SETTINGS_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const SETTINGS_WINDOW_WEBPACK_ENTRY: string;

/** This is window which contains the settings of Kando. */
export class SettingsWindow extends BrowserWindow {
  /** This will resolve once the window has fully loaded. */
  private windowLoaded = new Promise<void>((resolve) => {
    ipcMain.on('settings-window.ready', () => {
      resolve();
    });
  });

  constructor(backend: Backend, settings: Settings<IAppSettings>) {
    const transparent = settings.get('transparentSettingsWindow');

    super({
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        // Electron only allows loading local resources from apps loaded from the file
        // system. In development mode, the app is loaded from the webpack dev server.
        // Hence, we have to disable webSecurity in development mode.
        webSecurity: process.env.NODE_ENV !== 'development',
        preload: SETTINGS_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
      backgroundColor: '#00000000',
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#ffffff00',
        symbolColor: '#888',
        height: 30,
      },
      // Only on Linux we use a "real" transparent window. On Windows and macOS we use
      // an acrylic background. On Linux, the desktop environment will be responsible
      // for drawing a blurred background.
      transparent: transparent && os.platform() === 'linux',
      // For macOS.
      vibrancy: transparent ? 'menu' : undefined,
      // For Windows.
      backgroundMaterial: transparent ? 'acrylic' : undefined,
      fullscreenable: false,
      width: 1200,
      height: 800,
      show: false,
    });

    // Due to an Electron issue, the acrylic effect on Windows is broken after maximizing
    // the window (https://github.com/electron/electron/issues/42393). We can fix this by
    // some direct calls to the Win32 API.
    if (transparent && os.platform() === 'win32') {
      (backend as WindowsBackend).fixAcrylicEffect(
        this.getNativeWindowHandle().readInt32LE(0)
      );
    }

    // Remove the default menu. This disables all default shortcuts like CMD+W which are
    // not needed in Kando.
    this.setMenu(null);

    // If the user clicks on a link, we open the link in the default browser.
    this.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    this.loadURL(SETTINGS_WINDOW_WEBPACK_ENTRY);

    // Show the window when the renderer is ready.
    this.windowLoaded.then(() => {
      this.show();

      // Show dev tools in development mode.
      if (process.env.NODE_ENV === 'development') {
        this.webContents.openDevTools();
      }
    });
  }
}

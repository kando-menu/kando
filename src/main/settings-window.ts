//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { BrowserWindow, shell, ipcMain } from 'electron';

import { Settings } from './utils/settings';
import { IMenuSettings, IAppSettings } from '../common';
import { Backend } from './backends';

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

  constructor(
    private appSettings: Settings<IAppSettings>,
    private menuSettings: Settings<IMenuSettings>,
    private backend: Backend
  ) {
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
      width: 800,
      height: 600,
      show: false,
    });

    // Remove the default menu. This disables all default shortcuts like CMD+W which are
    // not needed in Kando.
    this.setMenu(null);

    // If the user clicks on a link, we open the link in the default browser.
    this.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  async load() {
    // this.initMenuRendererAPI();

    await this.loadURL(SETTINGS_WINDOW_WEBPACK_ENTRY);

    return this.windowLoaded;
  }
}

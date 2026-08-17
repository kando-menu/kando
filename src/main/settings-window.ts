//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import os from 'node:os';
import { BrowserWindow, shell, ipcMain, screen } from 'electron';

import { GeneralSettings, SettingsWindowSidebarWidths } from '../common';
import {
  Settings,
  SettingsWindowState,
  SettingsWindowStateStore,
  fitWindowBoundsToWorkArea,
  getConfigDirectory,
} from './settings';
import { Backend } from './backends';
import { WindowsBackend } from './backends/windows/backend';

declare const SETTINGS_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const SETTINGS_WINDOW_WEBPACK_ENTRY: string;

/** This is window which contains the settings of Kando. */
export class SettingsWindow extends BrowserWindow {
  /** Stores window geometry and sidebar widths independently of user settings. */
  private readonly stateStore: SettingsWindowStateStore;

  /** The current machine-local state of this settings window. */
  private state: SettingsWindowState;

  /** This will resolve once the window has fully loaded. */
  public onWindowLoaded = new Promise<void>((resolve) => {
    ipcMain.on('settings-window.ready', () => {
      resolve();
    });
  });

  constructor(backend: Backend, settings: Settings<GeneralSettings>) {
    const stateStore = new SettingsWindowStateStore(getConfigDirectory());
    const windowState = stateStore.load();
    const restoredBounds = windowState.bounds
      ? fitWindowBoundsToWorkArea(
          windowState.bounds,
          screen.getDisplayMatching(windowState.bounds).workArea
        )
      : undefined;

    // The special 'auto' flavor is only used as an initial default value. We override it
    // with the preferred flavor of the backend.
    if (settings.get('settingsWindowFlavor') === 'auto') {
      settings.set({
        settingsWindowFlavor: backend.getBackendInfo().shouldUseTransparentSettingsWindow
          ? 'transparent-system'
          : 'sakura-system',
      });
    }

    const settingsWindowFlavor = settings.get('settingsWindowFlavor');
    const transparent =
      settingsWindowFlavor === 'transparent-light' ||
      settingsWindowFlavor === 'transparent-dark' ||
      settingsWindowFlavor === 'transparent-system';

    super({
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        // Electron only allows loading local resources from apps loaded from the file
        // system. In development mode, the app is loaded from the webpack dev server.
        // Hence, we have to disable webSecurity in development mode.
        webSecurity: process.env.NODE_ENV !== 'development',
        preload: SETTINGS_WINDOW_PRELOAD_WEBPACK_ENTRY,
        spellcheck: false,
      },
      backgroundColor: '#00000000',
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#ffffff00',
        symbolColor: '#888',
        height: 36,
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
      x: restoredBounds?.x,
      y: restoredBounds?.y,
      width: restoredBounds?.width ?? 1350,
      height: restoredBounds?.height ?? 900,
      minWidth: 1000,
      minHeight: 700,
      show: false,
      autoHideMenuBar: true,
    });

    this.stateStore = stateStore;
    this.state = windowState;

    // Persist the normal bounds so that closing a maximized window does not replace the
    // user's preferred normal size with the display-sized maximized bounds.
    this.on('close', () => this.saveState());

    // Due to an Electron issue, the acrylic effect on Windows is broken after maximizing
    // the window (https://github.com/electron/electron/issues/42393). We can fix this by
    // some direct calls to the Win32 API.
    if (transparent && os.platform() === 'win32') {
      (backend as WindowsBackend).fixAcrylicEffect(
        this.getNativeWindowHandle().readInt32LE(0)
      );
    }

    // If the user clicks on a link, we open the link in the default browser.
    this.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    this.loadURL(SETTINGS_WINDOW_WEBPACK_ENTRY);

    // Show the window when the renderer is ready.
    this.onWindowLoaded.then(() => {
      if (this.isDestroyed()) {
        return;
      }

      if (windowState.maximized) {
        this.maximize();
      }

      this.show();
    });
  }

  /** Persists the current normal bounds and maximized state. */
  public saveState() {
    if (this.isDestroyed()) {
      return;
    }

    this.state = {
      ...this.state,
      bounds: this.getNormalBounds(),
      maximized: this.isMaximized(),
    };
    this.stateStore.save(this.state);
  }

  /** Returns the persisted widths of the settings window sidebars. */
  public getSidebarWidths(): SettingsWindowSidebarWidths {
    return { ...this.state.sidebarWidths };
  }

  /** Persists the width of one settings window sidebar. */
  public setSidebarWidth(position: 'left' | 'right', width: number) {
    const roundedWidth = Math.round(width);
    if (!Number.isFinite(roundedWidth) || roundedWidth <= 0) {
      return;
    }

    this.state = {
      ...this.state,
      sidebarWidths: {
        ...this.state.sidebarWidths,
        [position]: roundedWidth,
      },
    };

    this.saveState();
  }
}

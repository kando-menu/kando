//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ipcRenderer, OpenDialogOptions } from 'electron';

import { COMMON_WINDOW_API } from '../common/common-window-api';
import {
  IBackendInfo,
  IMenuThemeDescription,
  ISoundThemeDescription,
  IVersionInfo,
  IWMInfo,
  ISystemInfo,
} from '../common';

/**
 * These functions are available in the settings window's renderer process. They are
 * available on the window object as `window.settingsAPI.<method>`. In addition, the
 * common window API functions are also be available as `window.commonAPI.<method>`.
 */
export const SETTINGS_WINDOW_API = {
  /**
   * This will be called by the renderer process when it is fully loaded. This is used to
   * notify the host process that the renderer process is ready to receive messages.
   */
  settingsWindowReady: () => {
    ipcRenderer.send('settings-window.ready');
  },

  /** This will return some information about the currently used backend. */
  getBackendInfo: (): Promise<IBackendInfo> => {
    return ipcRenderer.invoke('settings-window.get-backend-info');
  },

  /** Returns the current version string of Kando. */
  getVersionInfo: (): Promise<IVersionInfo> => {
    return ipcRenderer.invoke('settings-window.get-version');
  },

  /** Returns some information about the currently used window manager. */
  getWMInfo: (): Promise<IWMInfo> => {
    return ipcRenderer.invoke('settings-window.get-wm-info');
  },

  /** Returns some information about the current system. */
  getSystemInfo: (): Promise<ISystemInfo> => {
    return ipcRenderer.invoke('settings-window.get-system-info');
  },

  /** Returns the position of the top left corner of the settings window. */
  getWindowPosition: (): Promise<{ x: number; y: number }> => {
    return ipcRenderer.invoke('settings-window.get-position');
  },

  /** Returns the index of the last opened menu. */
  getCurrentMenu: function (): Promise<number> {
    return ipcRenderer.invoke('settings-window.get-current-menu');
  },

  /** This will return the path to Kando's config directory. */
  getConfigDirectory: (): Promise<string> => {
    return ipcRenderer.invoke('settings-window.get-config-directory');
  },

  /** This will return the path to the user's menu themes directory. */
  getMenuThemesDirectory: (): Promise<string> => {
    return ipcRenderer.invoke('settings-window.get-menu-themes-directory');
  },

  /** This will return all available menu themes. */
  getAllMenuThemes: (): Promise<Array<IMenuThemeDescription>> => {
    return ipcRenderer.invoke('settings-window.get-all-menu-themes');
  },

  /** This will return all available sound themes. */
  getAllSoundThemes: (): Promise<Array<ISoundThemeDescription>> => {
    return ipcRenderer.invoke('settings-window.get-all-sound-themes');
  },

  /** This will show the web developer tools. */
  showDevTools: (forWindow: 'menu-window' | 'settings-window') => {
    ipcRenderer.send('settings-window.show-dev-tools', forWindow);
  },

  /** This will reload the current menu theme. */
  reloadMenuTheme: () => {
    ipcRenderer.send('settings-window.reload-menu-theme');
  },

  /** This will reload the current menu theme. */
  reloadSoundTheme: () => {
    ipcRenderer.send('settings-window.reload-sound-theme');
  },

  /** This will open a file picker and return the selected file path. */
  openFilePicker: (config: OpenDialogOptions): Promise<string> => {
    return ipcRenderer.invoke('settings-window.open-file-picker', config);
  },
};

/**
 * This interface extends the global window object with the `api` objects. These `api`
 * objects contain all functions that can be called by the renderer process.
 */
export interface WindowWithAPIs extends Window {
  commonAPI: typeof COMMON_WINDOW_API;
  settingsAPI: typeof SETTINGS_WINDOW_API;
}

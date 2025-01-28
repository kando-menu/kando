//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ipcRenderer } from 'electron';

import { COMMON_WINDOW_API } from '../common/common-window-api';
import { IBackendInfo } from '../common';

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

  /** This will return the path to Kando's config director. */
  getConfigDirectory: (): Promise<string> => {
    return ipcRenderer.invoke('settings-window.get-config-directory');
  },

  /** This will show the web developer tools. */
  showDevTools: () => {
    ipcRenderer.send('settings-window.show-dev-tools');
  },

  /** This will reload the current menu theme. */
  reloadMenuTheme: () => {
    ipcRenderer.send('settings-window.reload-menu-theme');
  },

  /** This will reload the current menu theme. */
  reloadSoundTheme: () => {
    ipcRenderer.send('settings-window.reload-sound-theme');
  },

  /**
   * This will be called when the user enters the edit mode. This ensures that a currently
   * selected shortcut can be assigned to a new menu.
   */
  unbindShortcuts: () => {
    ipcRenderer.send('settings-window.unbind-shortcuts');
  },

  /**
   * This will be called by the host process when the user should be shown a button to
   * update the app.
   *
   * @param callback This callback will be called when the button should be shown.
   */
  showUpdateAvailableButton: (func: () => void) => {
    ipcRenderer.on('settings-window.show-update-available-button', func);
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
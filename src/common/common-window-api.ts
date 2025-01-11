//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ipcRenderer } from 'electron';

import {
  IAppSettings,
  IMenuThemeDescription,
  ISoundThemeDescription,
  IVersionInfo,
  IMenuSettings,
  IIconThemesInfo,
} from '.';

/**
 * This basic set of functions will be available in both renderer processes. It will be
 * available in the menu window's renderer process as well as in the settings window's
 * renderer process. Both processes will extend this interface with additional functions.
 */
export const COMMON_WINDOW_API = {
  /**
   * This will print the given message to the console of the host process.
   *
   * @param message The message to print.
   */
  log: (message: string) => {
    ipcRenderer.send('common.log', message);
  },

  /**
   * This will return the current locale and all localization strings loaded by i18next
   * for the current and all potential fallback locales.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLocales: (): Promise<{ current: string; data: any; fallbackLng: any }> => {
    return ipcRenderer.invoke('common.get-locales');
  },

  /**
   * The appSettings object can be used to read and write the app settings. The settings
   * are persisted in the host process. When a setting is changed, the host process will
   * notify the renderer process.
   */
  appSettings: {
    get: function (): Promise<IAppSettings> {
      return ipcRenderer.invoke('common.app-settings-get');
    },
    getKey: function <K extends keyof IAppSettings>(key: K): Promise<IAppSettings[K]> {
      return ipcRenderer.invoke(`common.app-settings-get-${key}`);
    },
    setKey: function <K extends keyof IAppSettings>(
      key: K,
      value: IAppSettings[K]
    ): void {
      ipcRenderer.send(`common.app-settings-set-${key}`, value);
    },
    onChange: function <K extends keyof IAppSettings>(
      key: K,
      callback: (newValue: IAppSettings[K], oldValue: IAppSettings[K]) => void
    ): void {
      ipcRenderer.on(
        `common.app-settings-changed-${key}`,
        (event, newValue, oldValue) => {
          callback(newValue, oldValue);
        }
      );
    },
  },

  /**
   * The menuSettings object can be used to read and write the settings. This is primarily
   * used by the settings. When a menu should be shown, the host process will call the
   * showMenu callback further below. For now, it is not forseen that the settings reloads
   * the settings when they change on disc. Hence, there is no onChange callback.
   */
  menuSettings: {
    get: function (): Promise<IMenuSettings> {
      return ipcRenderer.invoke('common.menu-settings-get');
    },
    set: function (data: IMenuSettings): void {
      ipcRenderer.send('common.menu-settings-set', data);
    },
    getCurrentMenu: function (): Promise<number> {
      return ipcRenderer.invoke('common.menu-settings-get-current-menu');
    },
  },

  /** Returns the current version string of Kando. */
  getVersion: (): Promise<IVersionInfo> => {
    return ipcRenderer.invoke('common.get-version');
  },

  /** This will return a IIconThemesInfo describing all available icon themes. */
  getIconThemes: (): Promise<IIconThemesInfo> => {
    return ipcRenderer.invoke('common.get-icon-themes');
  },

  /** This will return the descriptions of the currently used menu theme. */
  getMenuTheme: (): Promise<IMenuThemeDescription> => {
    return ipcRenderer.invoke('common.get-menu-theme');
  },

  /** This will return all available menu themes. */
  getAllMenuThemes: (): Promise<Array<IMenuThemeDescription>> => {
    return ipcRenderer.invoke('common.get-all-menu-themes');
  },

  /**
   * This will return the accent colors of the currently used menu theme. This may depend
   * on the current system theme (light or dark).
   */
  getCurrentMenuThemeColors: (): Promise<Record<string, string>> => {
    return ipcRenderer.invoke('common.get-current-menu-theme-colors');
  },

  /** This will return whether the dark mode is currently enabled for the system. */
  getIsDarkMode: (): Promise<boolean> => {
    return ipcRenderer.invoke('common.get-is-dark-mode');
  },

  /** This will be called by the host process when the dark mode is toggled for the system. */
  darkModeChanged: (callback: (darkMode: boolean) => void): void => {
    ipcRenderer.on('common.dark-mode-changed', (e, darkMode) => callback(darkMode));
  },

  /** This will return the descriptions of the currently used sound theme. */
  getSoundTheme: (): Promise<ISoundThemeDescription> => {
    return ipcRenderer.invoke('common.get-sound-theme');
  },
};

/**
 * This interface extends the global window object with the `commonAPI` object. This will
 * be available in both renderer processes. In the menu window's renderer process and in
 * the settings window's renderer process are some additional functions available. See
 * `menu/menu-window-api.ts` and `settings/settings-window-api.ts` for more information.
 */
export interface WindowWithAPIs extends Window {
  commonAPI: typeof COMMON_WINDOW_API;
}

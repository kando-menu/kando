//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ipcRenderer, webUtils } from 'electron';

import {
  MenuItem,
  GeneralSettings,
  MenuThemeDescription,
  SoundThemeDescription,
  MenuSettings,
  IconThemesInfo,
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
   * The generalSettings object can be used to read and write the general settings. The
   * settings are persisted in the host process. When a setting is changed, the host
   * process will notify the renderer process.
   */
  generalSettings: {
    get: function (): Promise<GeneralSettings> {
      return ipcRenderer.invoke('common.general-settings-get');
    },
    set: function (settings: GeneralSettings): void {
      ipcRenderer.send(`common.general-settings-set`, settings);
    },
    onChange: function (
      callback: (newSettings: GeneralSettings, oldSettings: GeneralSettings) => void
    ): () => void {
      const wrappedCallback = (
        event: Electron.IpcRendererEvent,
        newSettings: GeneralSettings,
        oldSettings: GeneralSettings
      ) => {
        callback(newSettings, oldSettings);
      };

      ipcRenderer.on('common.general-settings-changed', wrappedCallback);

      return () => {
        ipcRenderer.off('common.general-settings-changed', wrappedCallback);
      };
    },
  },

  /**
   * The menuSettings object can be used to read and write the configured menus. They are
   * persisted in the host process. When a menu is changed, the host process will notify
   * the renderer process.
   */
  menuSettings: {
    get: function (): Promise<MenuSettings> {
      return ipcRenderer.invoke('common.menu-settings-get');
    },
    set: function (data: Partial<MenuSettings>): void {
      ipcRenderer.send('common.menu-settings-set', data);
    },
    onChange: function (
      callback: (newSettings: MenuSettings, oldSettings: MenuSettings) => void
    ): () => void {
      const wrappedCallback = (
        event: Electron.IpcRendererEvent,
        newSettings: MenuSettings,
        oldSettings: MenuSettings
      ) => {
        callback(newSettings, oldSettings);
      };

      ipcRenderer.on('common.menu-settings-changed', wrappedCallback);

      return () => {
        ipcRenderer.off('common.menu-settings-changed', wrappedCallback);
      };
    },
  },

  /** This will return a IconThemesInfo describing all available user icon themes. */
  getIconThemes: (): Promise<IconThemesInfo> => {
    return ipcRenderer.invoke('common.get-icon-themes');
  },

  /** This will return the descriptions of the currently used menu theme. */
  getMenuTheme: (): Promise<MenuThemeDescription> => {
    return ipcRenderer.invoke('common.get-menu-theme');
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

  /**
   * This will be called by the host process when the dark mode is toggled for the system.
   * It returns a function to disconnect the listener.
   */
  darkModeChanged: (callback: (darkMode: boolean) => void): (() => void) => {
    const wrappedCallback = (event: Electron.IpcRendererEvent, darkMode: boolean) => {
      callback(darkMode);
    };

    ipcRenderer.on('common.dark-mode-changed', wrappedCallback);

    return () => {
      ipcRenderer.off('common.dark-mode-changed', wrappedCallback);
    };
  },

  /** This will return the descriptions of the currently used sound theme. */
  getSoundTheme: (): Promise<SoundThemeDescription> => {
    return ipcRenderer.invoke('common.get-sound-theme');
  },

  /** This lists all currently available system icons. */
  getSystemIcons: (): Promise<Map<string, string>> => {
    return ipcRenderer.invoke('common.get-system-icons');
  },

  /**
   * This method creates a new menu item for a given file. Depending on the file type,
   * different item types may be used. For example, if the file is a *.desktop file on
   * Linux, it will create a run-command item. For most other files, it will create a file
   * item. It may happen that no item could be created.
   *
   * @param file The file for which a menu item should be created.
   * @returns A new menu item for the given file.
   */
  createItemForDroppedFile(file: File): Promise<MenuItem | null> {
    const name = file.name;
    const path = webUtils.getPathForFile(file);
    return ipcRenderer.invoke('common.create-menu-item-for-file', name, path);
  },
};

/**
 * This type extends the global window object with the `commonAPI` object. This will be
 * available in both renderer processes. In the menu window's renderer process and in the
 * settings window's renderer process are some additional functions available. See
 * `menu/menu-window-api.ts` and `settings/settings-window-api.ts` for more information.
 */
export type WindowWithAPIs = {
  readonly commonAPI: typeof COMMON_WINDOW_API;
} & Window;

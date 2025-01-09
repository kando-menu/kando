//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import {
  IVec2,
  IMenuItem,
  IAppSettings,
  IMenuSettings,
  IVersionInfo,
  IBackendInfo,
  IShowMenuOptions,
  IMenuThemeDescription,
  IShowSettingsOptions,
  ISoundThemeDescription,
  IIconThemesInfo,
} from '../../common';

// Declare the API to the host process. See preload.ts for more information on the exposed
// functions. The API has to be declared here again, because the TypeScript compiler
// does not know about preload.ts.
export interface SettingsWindowAPI {
  menuWindowReady: () => void;
  settingsWindowReady: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLocales: () => Promise<{ current: string; data: any; fallbackLng: any }>;
  appSettings: {
    get: () => Promise<IAppSettings>;
    getKey: <K extends keyof IAppSettings>(key: K) => Promise<IAppSettings[K]>;
    setKey: <K extends keyof IAppSettings>(key: K, value: IAppSettings[K]) => void;
    onChange: <K extends keyof IAppSettings>(
      key: K,
      callback: (newValue: IAppSettings[K], oldValue: IAppSettings[K]) => void
    ) => void;
  };
  menuSettings: {
    get: () => Promise<IMenuSettings>;
    set: (data: IMenuSettings) => void;
    getCurrentMenu: () => Promise<number>;
  };
  getVersion: () => Promise<IVersionInfo>;
  getBackendInfo: () => Promise<IBackendInfo>;
  getMenuTheme: () => Promise<IMenuThemeDescription>;
  getAllMenuThemes: () => Promise<Array<IMenuThemeDescription>>;
  getSoundTheme: () => Promise<ISoundThemeDescription>;
  getCurrentMenuThemeColors: () => Promise<Record<string, string>>;
  getIsDarkMode: () => Promise<boolean>;
  darkModeChanged: (callback: (darkMode: boolean) => void) => void;
  getIconThemes: () => Promise<IIconThemesInfo>;
  showDevTools: () => void;
  reloadMenuTheme: () => void;
  reloadSoundTheme: () => void;
  movePointer: (dist: IVec2) => void;
  log: (message: string) => void;
  showMenu: (
    func: (
      root: IMenuItem,
      menuOptions: IShowMenuOptions,
      settingsOptions: IShowSettingsOptions
    ) => void
  ) => void;
  showSettings: (func: (settingsOptions: IShowSettingsOptions) => void) => void;
  hideSettings: (func: () => void) => void;
  unbindShortcuts: () => void;
  showUpdateAvailableButton: (func: () => void) => void;
  hoverItem: (path: string) => void;
  unhoverItem: (path: string) => void;
  selectItem: (path: string) => void;
  cancelSelection: () => void;
}

/**
 * This interface extends the global window object with the `api` object. This object
 * contains all functions that can be called by the renderer process. Use it like this:
 * `declare const window: SettingsWindowAPI;`.
 */
export interface SettingsWindowWithApi extends Window {
  api: SettingsWindowAPI;
}

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
  IShowMenuOptions,
  IMenuThemeDescription,
  ISoundThemeDescription,
} from '../../common';

// These functions will be available in the menu window's renderer process. They will be
// available on the window object as `window.api.<method>`.
export interface MenuWindowAPI {
  /**
   * This will be called by the renderer process when it is fully loaded. This is used to
   * notify the host process that the renderer process is ready to receive messages.
   */
  menuWindowReady: () => void;

  /**
   * The appSettings object can be used to read and write the app settings. The settings
   * are persisted in the host process. When a setting is changed, the host process will
   * notify the renderer process.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appSettings: {
    get: () => Promise<IAppSettings>;
    getKey: <K extends keyof IAppSettings>(key: K) => Promise<IAppSettings[K]>;
    setKey: <K extends keyof IAppSettings>(key: K, value: IAppSettings[K]) => void;
    onChange: <K extends keyof IAppSettings>(
      key: K,
      callback: (newValue: IAppSettings[K], oldValue: IAppSettings[K]) => void
    ) => void;
  };

  /** This will return the descriptions of the currently used menu theme. */
  getMenuTheme: () => Promise<IMenuThemeDescription>;

  /** This will return the descriptions of the currently used sound theme. */
  getSoundTheme: () => Promise<ISoundThemeDescription>;

  /**
   * This will return the accent colors of the currently used menu theme. This may depend
   * on the current system theme (light or dark).
   */
  getCurrentMenuThemeColors: () => Promise<Record<string, string>>;

  /** This will be called by the host process when the dark mode is toggled for the system. */
  darkModeChanged: (callback: (darkMode: boolean) => void) => void;

  /**
   * This can be used to warp the mouse pointer to a different position.
   *
   * @param dist The distance to move the mouse pointer.
   */
  movePointer: (dist: IVec2) => void;

  /**
   * This will print the given message to the console of the host process.
   *
   * @param message The message to print.
   */
  log: (message: string) => void;

  /**
   * This will be called by the host process when a new menu should be shown.
   *
   * @param callback This callback will be called when a new menu should be shown.
   */
  showMenu: (func: (root: IMenuItem, menuOptions: IShowMenuOptions) => void) => void;

  /**
   * This will be called by the render process when the user hovers a menu item.
   *
   * @param path The path of the hovered menu item.
   */
  hoverItem: (path: string) => void;

  /**
   * This will be called by the render process when the user unhovers a menu item.
   *
   * @param path The path of the unhovered menu item.
   */
  unhoverItem: (path: string) => void;

  /**
   * This will be called by the render process when the user selects a menu item.
   *
   * @param path The path of the selected menu item.
   */
  selectItem: (path: string) => void;

  /**
   * This will be called by the render process when the user cancels a selection in the
   * menu.
   */
  cancelSelection: () => void;
}

/**
 * This interface extends the global window object with the `api` object. This object
 * contains all functions that can be called by the renderer process. Use it like this:
 * `declare const window: MenuWindowWithApi;`.
 */
export interface MenuWindowWithApi extends Window {
  api: MenuWindowAPI;
}

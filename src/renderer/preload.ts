//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ipcRenderer, contextBridge } from 'electron';
import {
  IVec2,
  IMenuItem,
  IAppSettings,
  IMenuSettings,
  IShowMenuOptions,
  IShowEditorOptions,
} from '../common';

/**
 * There is a well-defined API between the host process and the renderer process. The
 * renderer process can call the functions below to interact with the host process or
 * register callbacks to be called by the host process.
 */
contextBridge.exposeInMainWorld('api', {
  /**
   * This will be called by the renderer process when it is fully loaded. This is used to
   * notify the host process that the renderer process is ready to receive messages.
   */
  rendererReady: function () {
    ipcRenderer.send('renderer-ready');
  },

  /**
   * This will return the current locale and all localization strings loaded by i18next
   * for the current and all potential fallback locales.
   */
  getLocales: function () {
    return ipcRenderer.invoke('get-locales');
  },

  /**
   * The appSettings object can be used to read and write the app settings. The settings
   * are persisted in the host process. When a setting is changed, the host process will
   * notify the renderer process.
   */
  appSettings: {
    get(): Promise<IAppSettings> {
      return ipcRenderer.invoke('app-settings-get');
    },
    getKey<K extends keyof IAppSettings>(key: K): Promise<IAppSettings[K]> {
      return ipcRenderer.invoke(`app-settings-get-${key}`);
    },
    setKey<K extends keyof IAppSettings>(key: K, value: IAppSettings[K]) {
      ipcRenderer.send(`app-settings-set-${key}`, value);
    },
    onChange<K extends keyof IAppSettings>(
      key: K,
      callback: (newValue: IAppSettings[K], oldValue: IAppSettings[K]) => void
    ) {
      ipcRenderer.on(`app-settings-changed-${key}`, (event, newValue, oldValue) => {
        callback(newValue, oldValue);
      });
    },
  },

  /**
   * The menuSettings object can be used to read and write the menu settings. This is
   * primarily used by the menu editor. When a menu should be shown, the host process will
   * call the showMenu callback further below. For now, it is not forseen that the menu
   * editor reloads the menu settings when they change on disc. Hence, there is no
   * onChange callback.
   */
  menuSettings: {
    get(): Promise<IMenuSettings> {
      return ipcRenderer.invoke('menu-settings-get');
    },
    set(data: IMenuSettings) {
      ipcRenderer.send('menu-settings-set', data);
    },
    getCurrentMenu(): Promise<number> {
      return ipcRenderer.invoke('menu-settings-get-current-menu');
    },
  },

  /** Returns the current version string of Kando. */
  getVersion: function () {
    return ipcRenderer.invoke('get-version');
  },

  /** This will return some information about the currently used backend. */
  getBackendInfo: function () {
    return ipcRenderer.invoke('get-backend-info');
  },

  /** This will return the descriptions of the currently used menu theme. */
  getMenuTheme: function () {
    return ipcRenderer.invoke('get-menu-theme');
  },

  /** This will return all available menu themes. */
  getAllMenuThemes: function () {
    return ipcRenderer.invoke('get-all-menu-themes');
  },

  /** This will return the descriptions of the currently used sound theme. */
  getSoundTheme: function () {
    return ipcRenderer.invoke('get-sound-theme');
  },

  /**
   * This will return the accent colors of the currently used menu theme. This may depend
   * on the current system theme (light or dark).
   */
  getCurrentMenuThemeColors: function () {
    return ipcRenderer.invoke('get-current-menu-theme-colors');
  },

  /** This will return whether the dark mode is currently enabled for the system. */
  getIsDarkMode: function () {
    return ipcRenderer.invoke('get-is-dark-mode');
  },

  /** This will be called by the host process when the dark mode is toggled for the system. */
  darkModeChanged(callback: (darkMode: boolean) => void) {
    ipcRenderer.on('dark-mode-changed', (e, darkMode) => callback(darkMode));
  },

  /** This will return a IIconThemesInfo describing all available icon themes. */
  getIconThemes: function () {
    return ipcRenderer.invoke('get-icon-themes');
  },

  /** This will show the web developer tools. */
  showDevTools: function () {
    ipcRenderer.send('show-dev-tools');
  },

  /** This will reload the current menu theme. */
  reloadMenuTheme: function () {
    ipcRenderer.send('reload-menu-theme');
  },

  /** This will reload the current menu theme. */
  reloadSoundTheme: function () {
    ipcRenderer.send('reload-sound-theme');
  },

  /**
   * This will print the given message to the console of the host process.
   *
   * @param message The message to print.
   */
  log: function (message: string) {
    ipcRenderer.send('log', message);
  },

  /**
   * This will be called by the host process when a new menu should be shown.
   *
   * @param callback This callback will be called when a new menu should be shown.
   */
  showMenu: function (
    callback: (
      root: IMenuItem,
      menuOptions: IShowMenuOptions,
      editorOptions: IShowEditorOptions
    ) => void
  ) {
    ipcRenderer.on('show-menu', (event, root, menuOptions, editorOptions) =>
      callback(root, menuOptions, editorOptions)
    );
  },

  /**
   * This will be called by the host process when the user should be shown the editor.
   *
   * @param callback This callback will be called when the editor should be shown.
   */
  showEditor: function (callback: (editorOptions: IShowEditorOptions) => void) {
    ipcRenderer.on('show-editor', (event, editorOptions) => callback(editorOptions));
  },

  /**
   * This will be called by the host process when the editor should be hidden. This
   * happens for instance when the user clicks on an external link.
   *
   * @param callback This callback will be called when the editor should be hidden.
   */
  hideEditor: function (callback: () => void) {
    ipcRenderer.on('hide-editor', callback);
  },

  /**
   * This will be called when the user enters the edit mode. This ensures that a currently
   * selected shortcut can be assigned to a new menu.
   */
  unbindShortcuts: function () {
    ipcRenderer.send('unbind-shortcuts');
  },

  /**
   * This will be called by the host process when the user should be shown a button to
   * update the app.
   *
   * @param callback This callback will be called when the button should be shown.
   */
  showUpdateAvailableButton: function (callback: () => void) {
    ipcRenderer.on('show-update-available-button', callback);
  },

  /**
   * This will be called by the render process when the user hovers a menu item.
   *
   * @param path The path of the hovered menu item.
   */
  hoverItem: function (path: string) {
    ipcRenderer.send('hover-item', path);
  },

  /**
   * This will be called by the render process when the user unhovers a menu item.
   *
   * @param path The path of the unhovered menu item.
   */
  unhoverItem: function (path: string) {
    ipcRenderer.send('unhover-item', path);
  },

  /**
   * This will be called by the render process when the user selects a menu item.
   *
   * @param path The path of the selected menu item.
   */
  selectItem: function (path: string) {
    ipcRenderer.send('select-item', path);
  },

  /**
   * This will be called by the render process when the user cancels a selection in the
   * menu.
   */
  cancelSelection: function () {
    ipcRenderer.send('cancel-selection');
  },

  /**
   * This can be used to warp the mouse pointer to a different position.
   *
   * @param dist The distance to move the mouse pointer.
   */
  movePointer: function (dist: IVec2) {
    ipcRenderer.send('move-pointer', dist);
  },
});

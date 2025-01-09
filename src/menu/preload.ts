//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ipcRenderer, contextBridge } from 'electron';

import { MenuWindowAPI } from './@types/preload';
import { IVec2, IMenuItem, IAppSettings, IShowMenuOptions } from '../common';

/**
 * There is a well-defined API between the host process and the menu window's renderer
 * process. The renderer process can call the functions below to interact with the host
 * process or register callbacks to be called by the host process.
 */
contextBridge.exposeInMainWorld('api', {
  menuWindowReady: function () {
    ipcRenderer.send('menu-window-ready');
  },
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
  getMenuTheme: function () {
    return ipcRenderer.invoke('get-menu-theme');
  },
  getSoundTheme: function () {
    return ipcRenderer.invoke('get-sound-theme');
  },
  getCurrentMenuThemeColors: function () {
    return ipcRenderer.invoke('get-current-menu-theme-colors');
  },
  darkModeChanged(callback: (darkMode: boolean) => void) {
    ipcRenderer.on('dark-mode-changed', (e, darkMode) => callback(darkMode));
  },
  movePointer: function (dist: IVec2) {
    ipcRenderer.send('move-pointer', dist);
  },
  log: function (message: string) {
    ipcRenderer.send('log', message);
  },
  showMenu: function (
    callback: (root: IMenuItem, menuOptions: IShowMenuOptions) => void
  ) {
    ipcRenderer.on('show-menu', (event, root, menuOptions) =>
      callback(root, menuOptions)
    );
  },
  hoverItem: function (path: string) {
    ipcRenderer.send('hover-item', path);
  },
  unhoverItem: function (path: string) {
    ipcRenderer.send('unhover-item', path);
  },
  selectItem: function (path: string) {
    ipcRenderer.send('select-item', path);
  },
  cancelSelection: function () {
    ipcRenderer.send('cancel-selection');
  },
} as MenuWindowAPI);

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
import { Vec2, MenuItem, ShowMenuOptions } from '../common';

/**
 * These functions are available in the menu window's renderer process. They are available
 * on the window object as `window.menuAPI.<method>`. In addition, the common window API
 * functions are also be available as `window.commonAPI.<method>`.
 */
export const MENU_WINDOW_API = {
  /**
   * This will be called by the renderer process when it is fully loaded. This is used to
   * notify the host process that the renderer process is ready to receive messages.
   */
  menuWindowReady: () => {
    ipcRenderer.send('menu-window.ready');
  },

  /**
   * This can be used to warp the mouse pointer to a different position.
   *
   * @param dist The distance to move the mouse pointer.
   */
  movePointer: (dist: Vec2) => {
    ipcRenderer.send('menu-window.move-pointer', dist);
  },

  /**
   * This will be called by the host process when a new menu should be shown.
   *
   * @param callback This callback will be called when a new menu should be shown.
   */
  onShowMenu: (func: (root: MenuItem, menuOptions: ShowMenuOptions) => void) => {
    ipcRenderer.on('menu-window.show-menu', (event, root, menuOptions) =>
      func(root, menuOptions)
    );
  },

  /**
   * This will be called by the host process when the menu should be closed. Usually, the
   * renderer will call selectItem or cancelSelection to close the menu, but sometimes the
   * host process needs to close the menu without a selection.
   *
   * @param callback This callback will be called when the menu should be closed.
   */
  onHideMenu: (func: () => void) => {
    ipcRenderer.on('menu-window.hide-menu', func);
  },

  /**
   * This will be called by the render process when the user selects a menu item.
   *
   * @param path The path of the selected menu item.
   */
  selectItem: (path: string) => {
    ipcRenderer.send('menu-window.select-item', path);
  },

  /**
   * This will be called by the render process when the user hovers a menu item.
   *
   * @param path The path of the hovered menu item.
   */
  hoverItem: (path: string) => {
    ipcRenderer.send('menu-window.hover-item', path);
  },

  /**
   * This will be called by the render process when the user unhovers a menu item.
   *
   * @param path The path of the unhovered menu item.
   */
  unhoverItem: (path: string) => {
    ipcRenderer.send('menu-window.unhover-item', path);
  },

  /**
   * This will be called by the render process when the user cancels a selection in the
   * menu.
   */
  cancelSelection: () => {
    ipcRenderer.send('menu-window.cancel-selection');
  },

  /** This will be called by the render process to show the settings window. */
  showSettings: () => {
    ipcRenderer.send('menu-window.show-settings');
  },

  /**
   * This will be called by the host process when the menu theme should be reloaded.
   *
   * @param callback This callback will be called when the menu theme should be reloaded.
   */
  onReloadMenuTheme: (func: () => void) => {
    ipcRenderer.on('menu-window.reload-menu-theme', func);
  },

  /**
   * This will be called by the host process when the sound theme should be reloaded.
   *
   * @param callback This callback will be called when the sound theme should be reloaded.
   */
  onReloadSoundTheme: (func: () => void) => {
    ipcRenderer.on('menu-window.reload-sound-theme', func);
  },
};

/**
 * This type extends the global window object with the `api` objects. These `api` objects
 * contain all functions that can be called by the renderer process.
 */
export type WindowWithAPIs = {
  readonly commonAPI: typeof COMMON_WINDOW_API;
  readonly menuAPI: typeof MENU_WINDOW_API;
} & Window;

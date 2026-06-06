//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ipcRenderer, webFrame } from 'electron';

import { COMMON_WINDOW_API } from '../common/common-window-api';
import {
  Vec2,
  ShowMenuOptions,
  SelectionSource,
  MenuInteractionType,
  RootMenuItem,
} from '../common';

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
   * This will be triggered by the host process when a new menu should be shown.
   *
   * @param callback This callback will be called when a new menu should be shown.
   */
  onShowMenu: (func: (root: RootMenuItem, menuOptions: ShowMenuOptions) => void) => {
    ipcRenderer.on('menu-window.show-menu', (event, root, menuOptions) =>
      func(root, menuOptions)
    );
  },

  /**
   * The host can request the renderer process to initiate several menu interactions, such
   * as closing the menu or closing the current submenu. The renderer process will act
   * accordingly and call the finalizeInteraction callback afterwards.
   *
   * @param callback This callback will be called when the host process requests a menu
   *   interaction.
   */
  onTriggerInteraction: (
    func: (
      type: MenuInteractionType.eCloseMenu | MenuInteractionType.eCloseSubmenu
    ) => void
  ) => {
    ipcRenderer.on('menu-window.trigger-interaction', (event, type) => func(type));
  },

  /**
   * Menu interactions can be triggered by the user in the renderer process, for example
   * by clicking a menu item or hovering over a submenu. They can also be triggered by the
   * host process using the onTriggerInteraction function.
   *
   * In both cases, the renderer process will call this finalizeInteraction function to
   * notify the host process about the interaction. The host process will then execute the
   * corresponding workflow, track achievements, etc.
   *
   * The time and source parameters are used for achievement tracking. They are only
   * relevant for selection interactions like "selectButton".
   *
   * @param type The type of the interaction, e.g. opening a menu, hovering a button, etc.
   * @param path The path of the selected menu item.
   * @param time The time it took to select the item in milliseconds. This is used for
   *   achievement tracking.
   * @param source The source used to make the selection. Also used for achievement
   *   tracking.
   */
  finalizeInteraction: (
    type: MenuInteractionType,
    path: number[],
    time: number,
    source: SelectionSource
  ) => {
    ipcRenderer.send('menu-window.finalize-interaction', type, path, time, source);
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

  /**
   * This will be called by the host process when the icon themes should be reloaded.
   *
   * @param callback This callback will be called when the icon themes should be reloaded.
   */
  onReloadIconThemes: (func: () => void) => {
    webFrame.clearCache();
    ipcRenderer.on('menu-window.reload-icon-themes', func);
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

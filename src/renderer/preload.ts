//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ipcRenderer, contextBridge } from 'electron';
import { IKeySequence, IVec2, INode, IEditorData } from '../common';

/**
 * There is a well-defined API between the host process and the renderer process. The
 * renderer process can call the functions below to interact with the host process or
 * register callbacks to be called by the host process.
 */
contextBridge.exposeInMainWorld('api', {
  /**
   * This will hide the application window after the given delay.
   *
   * @param delay The delay in milliseconds.
   */
  hideWindow: function (delay: number) {
    ipcRenderer.send('hide-window', delay);
  },

  /** This will show the web developer tools. */
  showDevTools: function () {
    ipcRenderer.send('show-dev-tools');
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
   * @param callback This callback will be called with the root node of the menu and the
   *   position of the mouse cursor.
   */
  showMenu: function (callback: (root: INode, pos: IVec2) => void) {
    ipcRenderer.on('show-menu', (event, root, pos) => callback(root, pos));
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
   * This will be called by the render process when the user opens the menu editor. The
   * returned promise will resolve to the data required to initialize the editor.
   */
  getMenuEditorData: async function (): Promise<IEditorData> {
    return ipcRenderer.invoke('get-editor-data');
  },

  /**
   * This can be used to warp the mouse pointer to a different position.
   *
   * @param dist The distance to move the mouse pointer.
   */
  movePointer: function (dist: IVec2) {
    ipcRenderer.send('move-pointer', dist);
  },

  /**
   * This can be used to open an URI with the default application.
   *
   * @param uri The URI to open. For instance, this can be a file path or a web address.
   */
  openURI: function (uri: string) {
    ipcRenderer.send('open-uri', uri);
  },

  /**
   * This can be used to simulate a key press.
   *
   * @param keys The keys to press.
   */
  simulateKeys: function (keys: IKeySequence) {
    ipcRenderer.send('simulate-keys', keys);
  },

  /**
   * This can be used to run a shell command.
   *
   * @param command The command to run.
   */
  runCommand: function (command: string) {
    ipcRenderer.send('run-command', command);
  },
});

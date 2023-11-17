//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import './renderer/index.scss';

import { Menu } from './renderer/menu/menu';
import { Editor } from './renderer/editor/editor';
import { IKeySequence, IVec2, INode } from './common';

/**
 * This file is the main entry point for Kando's renderer process. It is responsible for
 * drawing the menu and the editor, as well as handling user input.
 */

// Declare the API to the host process (see preload.ts) ----------------------------------

interface IElectronAPI {
  loadPreferences: () => void;
  hideWindow: (delay: number) => void;
  showDevTools: () => void;
  simulateKeys: (keys: IKeySequence) => void;
  movePointer: (dist: IVec2) => void;
  openURI: (uri: string) => void;
  log: (message: string) => void;
  showMenu: (func: (root: INode, pos: IVec2) => void) => void;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}

// Wire up the menu and the editor -------------------------------------------------------

const menu = new Menu(document.getElementById('kando-menu-container'));
const editor = new Editor(document.getElementById('kando-editor-container'));

// Show the menu when the main process requests it.
window.api.showMenu((root, pos) => {
  menu.show(root, pos);
  editor.show();
});

// Sometimes, the user may select an item too close to the edge of the screen. In this
// case, we can not open the menu directly under the pointer. To make sure that the
// menu is still exactly under the pointer, we move the pointer a little bit.
menu.on('move-pointer', (dist) => {
  window.api.movePointer(dist);
});

// Hide Kando's window when the user aborts a selection.
menu.on('cancel', () => {
  window.api.hideWindow(300);
  menu.hide();
  editor.hide();
});

// For now, we just hide the window when the user selects an item. In the future, we
// might want to do something else here :)
menu.on('select', () => {
  window.api.hideWindow(400);
  menu.hide();
  editor.hide();
});

// Hide the menu when the user presses escape.
document.addEventListener('keyup', (ev) => {
  if (ev.key === 'Escape') {
    if (editor.isToolbarVisible()) {
      editor.hideToolbar();
    } else {
      window.api.hideWindow(300);
      menu.hide();
      editor.hide();
    }
  }
});

// This is helpful during development as it shows us when the renderer process has
// finished reloading.
window.api.log("Successfully loaded Kando's renderer process.");

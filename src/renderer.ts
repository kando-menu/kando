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

// Set up the menu -----------------------------------------------------------------------

const menu = new Menu(document.getElementById('kando-menu-container'));
const editor = new Editor(document.getElementById('kando-editor-container'));

menu.on('cancel', () => {
  window.api.hideWindow(300);
  menu.hide();
  editor.hide();
});

menu.on('select', () => {
  window.api.hideWindow(400);
  menu.hide();
  editor.hide();
});

menu.on('move-pointer', (dist) => {
  window.api.movePointer(dist);
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

// Show the menu when the main process requests it.
window.api.showMenu((root, pos) => {
  menu.show(root, pos);
  editor.show();
});

// This is helpful during development as it shows us when the renderer process has
// finished reloading.
window.api.log("Successfully loaded Kando's renderer process.");

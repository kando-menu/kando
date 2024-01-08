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

/**
 * This file is the main entry point for Kando's renderer process. It is responsible for
 * drawing the menu and the editor, as well as handling user input.
 */

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
  menu.hide();
  editor.hide();
  window.api.cancelSelection();
});

// Hide Kando's window when the user selects an item and notify the main process.
menu.on('select', (path) => {
  menu.hide();
  editor.hide();
  window.api.selectItem(path);
});

// Report hover and unhover events to the main process.
menu.on('hover', (path) => window.api.hoverItem(path));
menu.on('unhover', (path) => window.api.unhoverItem(path));

// Hide the menu when the user presses escape.
document.addEventListener('keyup', (ev) => {
  if (ev.key === 'Escape') {
    if (editor.isInEditMode()) {
      editor.leaveEditMode();
    } else {
      menu.hide();
      editor.hide();
      window.api.cancelSelection();
    }
  }
});

// This is helpful during development as it shows us when the renderer process has
// finished reloading.
window.api.log("Successfully loaded Kando's renderer process.");

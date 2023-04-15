//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//    |  /  __|   \ |       _ \   _ \      This file is part of Ken-Do, the             //
//    . <   _|   .  | ____| |  | (   |     cross-platform marking menu.                 //
//   _|\_\ ___| _|\_|      ___/ \___/      Read more on github.com/ken-do/ken-do        //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

const {ipcRenderer, contextBridge} = require('electron');

contextBridge.exposeInMainWorld('api', {
  hideWindow: function() {
    ipcRenderer.send('hide-window');
  },
  showDevTools: function() {
    ipcRenderer.send('show-dev-tools');
  },
  itemSelected: function() {
    ipcRenderer.send('item-selected');
  },
  showMenu: function(func) {
    ipcRenderer.on('show-menu', (event, ...args) => func(event, ...args));
  }
});
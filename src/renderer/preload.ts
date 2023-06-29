//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ipcRenderer, contextBridge } from 'electron';
import { IKeySequence, IVec2 } from '../common';

// Expose a bridged API to the renderer process.
contextBridge.exposeInMainWorld('api', {
  hideWindow: function (delay: number) {
    ipcRenderer.send('hide-window', delay);
  },
  showDevTools: function () {
    ipcRenderer.send('show-dev-tools');
  },
  simulateKeys: function (keys: IKeySequence) {
    ipcRenderer.send('simulate-keys', keys);
  },
  movePointer: function (dist: IVec2) {
    ipcRenderer.send('move-pointer', dist);
  },
  openURI: function (uri: string) {
    ipcRenderer.send('open-uri', uri);
  },
  itemSelected: function () {
    ipcRenderer.send('item-selected');
  },
  log: function (message: string) {
    ipcRenderer.send('log', message);
  },
  showMenu: function (callback: (pos: IVec2) => void) {
    ipcRenderer.on('show-menu', (event, pos) => callback(pos));
  },
});

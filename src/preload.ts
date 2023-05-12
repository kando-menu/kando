//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do,                 //
//     . <   _|   .  | ____| |  | (   |    the open-source cross-platform pie menu.     //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ipcRenderer, contextBridge } from "electron";

// Expose a bridged API to the renderer process.
contextBridge.exposeInMainWorld("api", {
  hideWindow: function () {
    ipcRenderer.send("hide-window");
  },
  showDevTools: function () {
    ipcRenderer.send("show-dev-tools");
  },
  simulateShortcut: function () {
    ipcRenderer.send("simulate-shortcut");
  },
  itemSelected: function () {
    ipcRenderer.send("item-selected");
  },
  log: function (message: string) {
    ipcRenderer.send("log", message);
  },
  showMenu: function (func: (event: any, ...args: any[]) => void) {
    ipcRenderer.on("show-menu", (event, ...args) => func(event, ...args));
  },
  setWindowInfo: function (func: (event: any, ...args: any[]) => void) {
    ipcRenderer.on("set-window-info", (event, ...args) => func(event, ...args));
  },
});

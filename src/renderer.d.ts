//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do,                 //
//     . <   _|   .  | ____| |  | (   |    the open-source cross-platform pie menu.     //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

export interface IElectronAPI {
  loadPreferences: () => void;
  hideWindow: () => void;
  showDevTools: () => void;
  simulateShortcut: () => void;
  itemSelected: () => void;
  log: (message: string) => void;
  showMenu: (func: (pos: { x: number; y: number }) => void) => void;
  setWindowInfo: (func: (info: { name: string; wmClass: string }) => void) => void;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}

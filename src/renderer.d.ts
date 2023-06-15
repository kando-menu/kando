//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

export interface IElectronAPI {
  loadPreferences: () => void;
  hideWindow: (delay: number) => void;
  showDevTools: () => void;
  simulateShortcut: () => void;
  movePointer: (dist: { x: number; y: number }) => void;
  openURI: (uri: string) => void;
  itemSelected: () => void;
  log: (message: string) => void;
  showMenu: (func: (pos: { x: number; y: number }) => void) => void;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}

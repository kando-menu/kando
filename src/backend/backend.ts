//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

export interface Backend {
  init: () => Promise<void>;

  // Returns the current pointer position and the currently pressed modifier keys.
  getPointer: () => Promise<{ x: number; y: number; mods: number }>;

  // Returns the name and the WM_CLASS of the currently focused window.
  getFocusedWindow: () => Promise<{ name: string; wmClass: string }>;

  // Simulates a keyboard shortcut.
  simulateShortcut: (shortcut: string) => Promise<void>;

  // Binds a callback to a keyboard shortcut. The callback is called whenever the
  // shortcut is pressed.
  bindShortcut: (shortcut: string, callback: () => void) => Promise<void>;

  // Unbinds a keyboard shortcut.
  unbindShortcut: (shortcut: string) => Promise<void>;

  // Unbinds all keyboard shortcuts.
  unbindAllShortcuts: () => Promise<void>;
}

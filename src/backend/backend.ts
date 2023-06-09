//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * This interface must be implemented by all backends. A backend is responsible for
 * communicating with the operating system. It provides methods to move the mouse pointer,
 * simulate keyboard shortcuts and get information about the currently focused window.
 *
 * See index.ts for information about how the backend is selected.
 */
export interface Backend {
  /**
   * This method will be called once when the backend is created. It can be used to
   * connect to some kind of IPC mechanism.
   *
   * @returns A promise which resolves when the backend is ready to be used.
   */
  init: () => Promise<void>;

  /**
   * Each backend should return a suitable window type here. The window type determines
   * how the window is drawn. The most suitable type is dependent on the operating system
   * and the window manager. For example, on GNOME, the window type "dock" seems to work
   * best, on KDE "toolbar" provides a better experience. On Windows, "toolbar" is the
   * only type that works.
   * https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions
   *
   * @returns The window type to use for the pie menu window.
   */
  getWindowType: () => string;

  /**
   * Each backend must provide the current pointer position via this method.
   *
   * @returns A promise which resolves to the current pointer position and the currently
   *   pressed modifier keys.
   * @todo: Add information about the modifier keys.
   */
  getPointer: () => Promise<{ x: number; y: number; mods: number }>;

  /**
   * Each backend must provide a way to move the pointer to a given position.
   *
   * @param x The x coordinate to move the pointer to.
   * @param y The y coordinate to move the pointer to.
   * @returns A promise which resolves when the pointer has been moved.
   */
  movePointer: (x: number, y: number) => Promise<void>;

  /**
   * Each backend must provide a way to get the name and class of the currently focused
   * application window.
   *
   * @returns A promise which resolves to the name and class of the currently focused
   *   window.
   */
  getFocusedWindow: () => Promise<{ name: string; wmClass: string }>;

  /**
   * Each backend must provide a way to simulate a keyboard shortcut. This is used to
   * execute the actions of the pie menu.
   *
   * @param shortcut The shortcut to simulate.
   * @returns A promise which resolves when the shortcut has been simulated.
   * @todo: Add information about the string format of the shortcut.
   */
  simulateShortcut: (shortcut: string) => Promise<void>;

  /**
   * Each backend must provide a way to bind a callback to a keyboard shortcut. The
   * callback should be called whenever the shortcut is pressed.
   *
   * @param shortcut The shortcut to bind.
   * @param callback The method to call when the shortcut is pressed.
   * @returns A promise which resolves when the shortcut has been bound.
   * @todo: Add information about the string format of the shortcut.
   */
  bindShortcut: (shortcut: string, callback: () => void) => Promise<void>;

  /**
   * Each backend must provide a way to unbind a previously bound keyboard shortcut.
   *
   * @param shortcut The shortcut to unbind.
   * @returns A promise which resolves when the shortcut has been unbound.
   */
  unbindShortcut: (shortcut: string) => Promise<void>;

  /**
   * Each backend must provide a way to unbind all previously bound keyboard shortcuts.
   *
   * @returns A promise which resolves when all shortcuts have been unbound.
   */
  unbindAllShortcuts: () => Promise<void>;
}

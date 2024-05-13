//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IBackendInfo, IKeySequence } from '../../common';

/**
 * This interface is used to transfer information required from the window manager when
 * opening the pie menu. It contains the name of the currently focused app / window as
 * well as the current pointer position.
 *
 * How to get the app name and the window name depends on the operating system and the
 * window manager.
 */
export interface WMInfo {
  windowName: string;
  appName: string;
  pointerX: number;
  pointerY: number;
}

/**
 * This interface is used to describe a keyboard shortcut. It contains a unique id, a
 * description and the actual shortcut. The shortcut is a string in the format used by
 * Electron's globalShortcut module. More information on the format can be found here:
 * https://www.electronjs.org/docs/latest/api/accelerator
 */
export interface Shortcut {
  id: string;
  description: string;
  accelerator: string;
  action: () => void;
}

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
   * Each backend must provide some basic information about the backend. See IBackendInfo
   * for more information.
   *
   * @returns Some information about the backend.
   */
  getBackendInfo: () => IBackendInfo;

  /**
   * Each backend must provide a way to get the name and app of the currently focused
   * window as well as the current pointer position.
   *
   * @returns A promise which resolves to the name and app of the currently focused window
   *   as well as to the current pointer position.
   */
  getWMInfo: () => Promise<WMInfo>;

  /**
   * Each backend must provide a way to move the pointer.
   *
   * @param dx The amount of horizontal movement.
   * @param dy The amount of vertical movement.
   * @returns A promise which resolves when the pointer has been moved.
   */
  movePointer: (dx: number, dy: number) => Promise<void>;

  /**
   * Each backend must provide a way to simulate a key sequence. This is used to execute
   * the actions of the pie menu.
   *
   * @param keys The keys to simulate.
   * @returns A promise which resolves when the key sequence has been simulated.
   */
  simulateKeys: (keys: IKeySequence) => Promise<void>;

  /**
   * Each backend must provide a way to bind an action to a keyboard shortcut.
   *
   * @param shortcut The shortcut to bind.
   * @returns A promise which resolves when the shortcut has been bound.
   */
  bindShortcut: (shortcut: Shortcut) => Promise<void>;

  /**
   * Each backend must provide a way to unbind a previously bound keyboard shortcut.
   *
   * @param shortcut The ID of the shortcut to unbind.
   * @returns A promise which resolves when the shortcut has been unbound.
   */
  unbindShortcut: (shortcut: Shortcut) => Promise<void>;

  /**
   * Each backend must provide a way to unbind all previously bound keyboard shortcuts.
   *
   * @returns A promise which resolves when all shortcuts have been unbound.
   */
  unbindAllShortcuts: () => Promise<void>;
}

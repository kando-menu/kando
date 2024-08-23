//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { Shortcut } from '../../../backend';

export interface Native {
  /**
   * This binds a shortcut. The action callback of the shortcut is called when the
   * shortcut is pressed.
   *
   * @param shortcut The shortcut to simulate.
   * @returns A promise which resolves when the shortcut has been bound.
   */
  bindShortcut(shortcut: Shortcut): void;

  /**
   * This unbinds a previously bound shortcut.
   *
   * @param trigger The trigger of a previously bound.
   */
  unbindShortcut(trigger: string): void;

  /** This unbinds all previously bound shortcuts. */
  unbindAllShortcuts(): void;
}

const native: Native = require('./../../../../../../build/Release/NativeHypr.node');

export { native };

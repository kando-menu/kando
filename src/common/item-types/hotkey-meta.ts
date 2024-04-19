//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { INode } from '../index';
import { IMeta } from '../item-factory';

/**
 * For this type of menu items, the user can configure a hotkey that will be simulated
 * when the item is clicked. If the `delayed` flag is set, the hotkey will be simulated
 * after the Kando window has been closed.
 */
export interface IActionData {
  hotkey: string;
  delayed: boolean;
}

/** This class provides meta information for menu items that simulate a hotkey. */
export class HotkeyMeta implements IMeta {
  get hasChildren(): boolean {
    return false;
  }

  get defaultName(): string {
    return 'Simulate Hotkey';
  }

  get defaultIcon(): string {
    return 'keyboard';
  }

  get defaultIconTheme(): string {
    return 'material-symbols-rounded';
  }

  get defaultData(): IActionData {
    return {
      hotkey: '',
      delayed: false,
    };
  }

  get genericDescription(): string {
    return 'Simulates key presses.';
  }

  getDescription(node: INode): string {
    return (node.data as IActionData).hotkey || 'Not configured.';
  }
}

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

interface INodeData {
  hotkey: string;
  delayed: boolean;
}

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

  get defaultData(): INodeData {
    return {
      hotkey: '',
      delayed: false,
    };
  }

  get genericDescription(): string {
    return 'Simulates key presses.';
  }

  getDescription(node: INode): string {
    return (node.data as INodeData).hotkey || 'Not configured.';
  }
}

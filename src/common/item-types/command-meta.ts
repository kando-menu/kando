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
  command: string;
}

export class CommandMeta implements IMeta {
  get hasChildren(): boolean {
    return false;
  }

  get defaultName(): string {
    return 'Launch Application';
  }

  get defaultIcon(): string {
    return 'terminal';
  }

  get defaultIconTheme(): string {
    return 'material-symbols-rounded';
  }

  get defaultData(): INodeData {
    return {
      command: '',
    };
  }

  get genericDescription(): string {
    return 'Runs any command.';
  }

  getDescription(node: INode): string {
    return (node.data as INodeData).command || 'Not configured.';
  }
}

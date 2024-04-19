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
  uri: string;
}

export class URIMeta implements IMeta {
  get hasChildren(): boolean {
    return false;
  }

  get defaultName(): string {
    return 'Open URL';
  }

  get defaultIcon(): string {
    return 'public';
  }

  get defaultIconTheme(): string {
    return 'material-symbols-rounded';
  }

  get defaultData(): INodeData {
    return {
      uri: '',
    };
  }

  get genericDescription(): string {
    return 'Opens files or websites.';
  }

  getDescription(node: INode): string {
    return (node.data as INodeData).uri || 'Not configured.';
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { INodeType, INode } from '../index';

interface INodeData {
  uri: string;
}

export class URINodeType implements INodeType {
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

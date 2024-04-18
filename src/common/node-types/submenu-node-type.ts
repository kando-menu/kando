//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { INode } from '../index';
import { INodeType } from '../node-type-registry';

interface INodeData {}

export class SubmenuNodeType implements INodeType {
  get hasChildren(): boolean {
    return true;
  }

  get defaultName(): string {
    return 'Submenu';
  }

  get defaultIcon(): string {
    return 'apps';
  }

  get defaultIconTheme(): string {
    return 'material-symbols-rounded';
  }

  get defaultData(): INodeData {
    return {};
  }

  get genericDescription(): string {
    return 'Contains other menu items.';
  }

  getDescription(node: INode): string {
    return `Contains ${node.children.length} menu items.`;
  }
}

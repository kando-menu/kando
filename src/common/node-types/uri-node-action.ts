//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { INode } from '../index';
import { INodeAction } from '../node-action-registry';
import { DeepReadonly } from '../../main/settings';

import { shell } from 'electron';

interface INodeData {
  uri: string;
}

export class URINodeAction implements INodeAction {
  delayedExecution() {
    return false;
  }

  execute(node: DeepReadonly<INode>): void {
    shell.openExternal((node.data as INodeData).uri);
  }
}

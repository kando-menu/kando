//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { INode } from './index';
import { Backend } from '../main/backends/backend';

import { CommandNodeAction } from './node-types/command-node-action';
import { HotkeyNodeAction } from './node-types/hotkey-node-action';
import { URINodeAction } from './node-types/uri-node-action';
import { DeepReadonly } from '../main/settings';

/** This interface describes the action of a menu item. */
export interface INodeAction {
  delayedExecution(node: DeepReadonly<INode>): boolean;

  /** This will be called when the menu item is executed. */
  execute(node: DeepReadonly<INode>, backend: Backend): void;
}

export class NodeActionRegistry {
  private static instance: NodeActionRegistry = null;

  private types: Map<string, INodeAction> = new Map();

  private constructor() {
    this.registerType('command', new CommandNodeAction());
    this.registerType('hotkey', new HotkeyNodeAction());
    this.registerType('uri', new URINodeAction());
  }

  public static getInstance(): NodeActionRegistry {
    if (NodeActionRegistry.instance === null) {
      NodeActionRegistry.instance = new NodeActionRegistry();
    }
    return NodeActionRegistry.instance;
  }

  public delayedExecution(node: DeepReadonly<INode>): boolean {
    return this.types.get(node.type).delayedExecution(node);
  }

  public execute(node: DeepReadonly<INode>, backend: Backend) {
    const type = this.types.get(node.type);
    type.execute(node, backend);
  }

  private registerType(name: string, type: INodeAction): void {
    this.types.set(name, type);
  }
}

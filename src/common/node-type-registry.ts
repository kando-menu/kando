//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { INodeType, INode } from './index';

import { CommandNodeType } from './node-types/command-node-type';
import { HotkeyNodeType } from './node-types/hotkey-node-type';
import { SubmenuNodeType } from './node-types/submenu-node-type';
import { URINodeType } from './node-types/uri-node-type';

export class NodeTypeRegistry {
  private static instance: NodeTypeRegistry = null;

  private types: Map<string, INodeType> = new Map();

  private constructor() {
    this.registerType('command', new CommandNodeType());
    this.registerType('hotkey', new HotkeyNodeType());
    this.registerType('submenu', new SubmenuNodeType());
    this.registerType('uri', new URINodeType());
  }

  public static getInstance(): NodeTypeRegistry {
    if (NodeTypeRegistry.instance === null) {
      NodeTypeRegistry.instance = new NodeTypeRegistry();
    }
    return NodeTypeRegistry.instance;
  }

  public getType(id: string): INodeType {
    return this.types.get(id);
  }

  public createNode(typeName: string): INode {
    const type = this.types.get(typeName);
    const node: INode = {
      type: typeName,
      data: type.defaultData,
      name: type.defaultName,
      icon: type.defaultIcon,
      iconTheme: type.defaultIconTheme,
    };

    if (type.hasChildren) {
      node.children = [];
    }

    return node;
  }

  public getTypes() {
    return this.types;
  }

  private registerType(name: string, type: INodeType): void {
    this.types.set(name, type);
  }
}

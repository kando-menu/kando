//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { INodeType, INode } from './index';

export class NodeTypeRegistry {
  private static instance: NodeTypeRegistry = null;

  private types: Map<string, INodeType> = new Map();

  private constructor() {
    this.registerType({
      id: 'submenu',
      hasChildren: true,
      defaultName: 'Submenu',
      defaultIcon: 'apps',
      defaultIconTheme: 'material-symbols-rounded',
      defaultData: {},
      genericDescription: 'Contains other menu items.',
      getDescription: () => '',
      execute: () => {},
    });

    this.registerType({
      id: 'command',
      hasChildren: false,
      defaultName: 'Launch Application',
      defaultIcon: 'terminal',
      defaultIconTheme: 'material-symbols-rounded',
      defaultData: {},
      genericDescription: 'Runs any command.',
      getDescription: () => '',
      execute: () => {},
    });

    this.registerType({
      id: 'uri',
      hasChildren: false,
      defaultName: 'Open URL',
      defaultIcon: 'public',
      defaultIconTheme: 'material-symbols-rounded',
      defaultData: {},
      genericDescription: 'Opens files or websites.',
      getDescription: () => '',
      execute: () => {},
    });

    this.registerType({
      id: 'hotkey',
      hasChildren: false,
      defaultName: 'Simulate Hotkey',
      defaultIcon: 'keyboard',
      defaultIconTheme: 'material-symbols-rounded',
      defaultData: {},
      genericDescription: 'Simulates key presses.',
      getDescription: () => '',
      execute: () => {},
    });
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

  public createNode(typeIndex: number): INode {
    const type = this.getTypes()[typeIndex];
    const node: INode = {
      type: type.id,
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

  public getTypes(): Array<INodeType> {
    return Array.from(this.types.values());
  }

  private registerType(type: INodeType): void {
    this.types.set(type.id, type);
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { INode } from './index';

import { CommandMeta } from './item-types/command-meta';
import { HotkeyMeta } from './item-types/hotkey-meta';
import { SubmenuMeta } from './item-types/submenu-meta';
import { URIMeta } from './item-types/uri-meta';

/**
 * This interface describes a type of a menu node. It is used to specify the action of a
 * menu item.
 */
export interface IMeta {
  /** Whether this type of menu item has children. */
  hasChildren: boolean;

  /** The default name of the menu item. */
  defaultName: string;

  /** The default icon of the menu item. */
  defaultIcon: string;

  /** The default icon theme of the menu item. */
  defaultIconTheme: string;

  /** The default data of the menu item. */
  defaultData: unknown;

  /** This should return a human-readable description of this type of menu item. */
  genericDescription: string;

  /** This should return a human-readable description of this specific menu item. */
  getDescription(node: INode): string;
}

export class ItemFactory {
  private static instance: ItemFactory = null;

  private types: Map<string, IMeta> = new Map();

  private constructor() {
    this.registerType('command', new CommandMeta());
    this.registerType('hotkey', new HotkeyMeta());
    this.registerType('submenu', new SubmenuMeta());
    this.registerType('uri', new URIMeta());
  }

  public static getInstance(): ItemFactory {
    if (ItemFactory.instance === null) {
      ItemFactory.instance = new ItemFactory();
    }
    return ItemFactory.instance;
  }

  public getType(id: string): IMeta {
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

  private registerType(name: string, type: IMeta): void {
    this.types.set(name, type);
  }
}

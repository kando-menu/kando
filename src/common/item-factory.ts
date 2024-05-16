//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IMenuItem } from './index';

import { CommandItemMeta } from './item-types/command-item-meta';
import { HotkeyItemMeta } from './item-types/hotkey-item-meta';
import { SubmenuItemMeta } from './item-types/submenu-item-meta';
import { URIItemMeta } from './item-types/uri-item-meta';

/**
 * This interface describes meta information about a menu-item type. Every available type
 * should implement this interface. You can find the implementations in the `item-types`
 * directory.
 */
export interface IItemMeta {
  /** Whether this type of menu item has children. */
  hasChildren: boolean;

  /** The default name for new menu items of this kind. */
  defaultName: string;

  /** The default icon for new menu items of this kind. */
  defaultIcon: string;

  /** The default icon theme for new menu items of this kind. */
  defaultIconTheme: string;

  /** The default data for new menu items of this kind. */
  defaultData: unknown;

  /**
   * This should return a human-readable description of this kind of menu item. It will be
   * shown in the add-new-item tab of the toolbar.
   */
  genericDescription: string;

  /**
   * This should return a human-readable description of a specific menu item of this kind.
   * It will be shown in the trash and stash tab of the toolbar below the item name.
   */
  getDescription(item: IMenuItem): string;
}

/**
 * This singleton class is a factory used by the `Editor` to create new menu items. It is
 * also used to get meta information about menu item types.
 */
export class ItemFactory {
  /** The singleton instance of this class. */
  private static instance: ItemFactory = null;

  /**
   * This map contains all available menu item types. The keys are the type names and the
   * values are the corresponding meta objects.
   */
  private types: Map<string, IItemMeta> = new Map();

  /**
   * This is a singleton class. The constructor is private. Use `getInstance` to get the
   * instance of this class.
   */
  private constructor() {
    this.types.set('command', new CommandItemMeta());
    this.types.set('hotkey', new HotkeyItemMeta());
    this.types.set('submenu', new SubmenuItemMeta());
    this.types.set('uri', new URIItemMeta());
  }

  /**
   * Use this method to get the singleton instance of this class.
   *
   * @returns The singleton instance of this class.
   */
  public static getInstance(): ItemFactory {
    if (ItemFactory.instance === null) {
      ItemFactory.instance = new ItemFactory();
    }
    return ItemFactory.instance;
  }

  /**
   * Use this method to get meta information about a specific menu item type.
   *
   * @param typeName The name of the type you want to get meta information about.
   * @returns The meta information about the requested type.
   */
  public getTypeInfo(typeName: string): IItemMeta {
    return this.types.get(typeName);
  }

  /**
   * Use this method to get a list of all available menu item types.
   *
   * @returns A map of all available menu item types.
   */
  public getAllTypes() {
    return this.types;
  }

  /**
   * Use this method to create a new menu item of a specific type.
   *
   * @param typeName The type of the menu item you want to create.
   * @returns The newly created menu item.
   */
  public createMenuItem(typeName: string): IMenuItem {
    const type = this.types.get(typeName);
    const item: IMenuItem = {
      type: typeName,
      data: type.defaultData,
      name: type.defaultName,
      icon: type.defaultIcon,
      iconTheme: type.defaultIconTheme,
    };

    if (type.hasChildren) {
      item.children = [];
    }

    return item;
  }
}

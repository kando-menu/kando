//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IMenuItem } from './index';

import { CommandItemType } from './item-types/command-item-type';
import { HotkeyItemType } from './item-types/hotkey-item-type';
import { MacroItemType } from './item-types/macro-item-type';
import { SubmenuItemType } from './item-types/submenu-item-type';
import { TextItemType } from './item-types/text-item-type';
import { URIItemType } from './item-types/uri-item-type';

/**
 * This interface describes meta information about a menu-item type. Every available type
 * should implement this interface. You can find the implementations in the `item-types`
 * directory.
 */
export interface IItemType {
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
   * It will be shown in the trash and templates tab of the toolbar below the item name.
   */
  getDescription(item: IMenuItem): string;
}

/**
 * This singleton class is a registry for all available menu item types. It is used to
 * acquire information about a specific type. It can be used both in the frontend and the
 * backend process.
 */
export class ItemTypeRegistry {
  /** The singleton instance of this class. */
  private static instance: ItemTypeRegistry = null;

  /**
   * This map contains all available menu item types. The keys are the type names and the
   * values are the corresponding type objects.
   */
  private types: Map<string, IItemType> = new Map();

  /**
   * This is a singleton class. The constructor is private. Use `getInstance` to get the
   * instance of this class.
   */
  private constructor() {
    this.types.set('command', new CommandItemType());
    this.types.set('hotkey', new HotkeyItemType());
    this.types.set('macro', new MacroItemType());
    this.types.set('submenu', new SubmenuItemType());
    this.types.set('text', new TextItemType());
    this.types.set('uri', new URIItemType());
  }

  /**
   * Use this method to get the singleton instance of this class.
   *
   * @returns The singleton instance of this class.
   */
  public static getInstance(): ItemTypeRegistry {
    if (ItemTypeRegistry.instance === null) {
      ItemTypeRegistry.instance = new ItemTypeRegistry();
    }
    return ItemTypeRegistry.instance;
  }

  /**
   * Use this method to get information about a specific menu item type.
   *
   * @param typeName The name of the type you want to get information about.
   * @returns The information about the requested type.
   */
  public getType(typeName: string): IItemType {
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
}

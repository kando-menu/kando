//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IMenuItem } from '..';

import { CommandItemType } from './command-item-type';
import { FileItemType } from './file-item-type';
import { HotkeyItemType } from './hotkey-item-type';
import { MacroItemType } from './macro-item-type';
import { SubmenuItemType } from './submenu-item-type';
import { TextItemType } from './text-item-type';
import { URIItemType } from './uri-item-type';
import { RedirectItemType } from './redirect-item-type';
import { SettingsItemType } from './settings-item-type';

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
    this.types.set('submenu', new SubmenuItemType());
    this.types.set('command', new CommandItemType());
    this.types.set('file', new FileItemType());
    this.types.set('hotkey', new HotkeyItemType());
    this.types.set('macro', new MacroItemType());
    this.types.set('text', new TextItemType());
    this.types.set('uri', new URIItemType());
    this.types.set('redirect', new RedirectItemType());
    this.types.set('settings', new SettingsItemType());
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

  /**
   * This is used during drag-and-drop operations: When some data is dragged into the
   * settings menu, we try to create a corresponding menu item. Usually, the drag source
   * offers the data in a variety of formats. Given a list of formats, this method returns
   * the most specific one for which we have a corresponding item type.
   *
   * @param types An array of data types. This is usually something like 'text/plain',
   *   'text/uri-list', or some of the Kando-specific types such as 'kando/item-type'.
   * @returns The most specific type for which we have a corresponding item type. If no
   *   such type is found, an empty string is returned.
   */
  public getPreferredDataType(types: readonly string[]): string {
    const prefferedTypes = [
      'kando/item-type', // This is used for new items dragged from the item type list.
      'kando/menu', // This is used for menus dragged from the menu list.
      'text/uri-list',
      'text/plain',
    ];

    for (const preferredType of prefferedTypes) {
      if (types.includes(preferredType)) {
        return preferredType;
      }
    }

    // If no preferred type is found, return an empty string.
    return '';
  }

  /**
   * Given a data type and the data itself, this method returns a new menu item fitting to
   * the data type.
   *
   * @param type The data type.
   * @param data The data itself.
   * @returns A new menu item fitting to the data type. If no item could be created, null
   *   is returned.
   */
  public createItem(type: string, data: string): IMenuItem {
    if (type === 'kando/item-type') {
      const itemType = this.types.get(data);
      if (itemType) {
        return {
          type: data,
          name: itemType.defaultName,
          icon: itemType.defaultIcon,
          iconTheme: itemType.defaultIconTheme,
          data: itemType.defaultData,
          children: itemType.hasChildren ? [] : undefined,
        };
      }
    } else if (type === 'kando/menu') {
      // This will be a IRenderedMenu as defined in
      // settings-renderer/components/menu-list/MenuList.tsx
      const menu = JSON.parse(data);
      return {
        type: 'redirect',
        name: menu.name,
        icon: menu.icon,
        iconTheme: menu.iconTheme,
        data: {
          menu: menu.name,
        },
      };
    } else if (type === 'text/uri-list') {
      const itemType = this.types.get('uri');
      return {
        type: 'uri',
        name: itemType.defaultName,
        icon: itemType.defaultIcon,
        iconTheme: itemType.defaultIconTheme,
        data: {
          uri: data,
        },
      };
    } else if (type === 'text/plain') {
      const itemType = this.types.get('text');
      return {
        type: 'text',
        name: itemType.defaultName,
        icon: itemType.defaultIcon,
        iconTheme: itemType.defaultIconTheme,
        data: {
          text: data,
        },
      };
    }

    return null;
  }
}

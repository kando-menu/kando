//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { WindowWithAPIs } from '../common-window-api';
declare const window: WindowWithAPIs;

import { MenuItem } from '..';

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
 * This type describes meta information about a menu-item type. Every available type
 * should implement this interface. You can find the implementations in the `item-types`
 * directory.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface ItemType {
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
  private types: Map<string, ItemType> = new Map();

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
  public getType(typeName: string): ItemType {
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
   * true if one of the formats is supported.
   *
   * @param transfer The transferred data.
   * @returns True if the drag source offers a supported data type.
   */
  public hasSupportedDataType(transfer: DataTransfer): boolean {
    const supportedTypes = [
      'kando/item-type', // This is used for new items dragged from the item type list.
      'kando/menu', // This is used for menus dragged from the menu list.
      'Files',
      'text/uri-list',
      'text/plain',
    ];

    for (const type of supportedTypes) {
      if (transfer.types.includes(type)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Given a data type and the data itself, this method returns a new menu item fitting to
   * the data type. The data type is a mime type such as 'text/plain' or a Kando-specific
   * type such as 'kando/item-type'. The data itself is a string that contains the data in
   * the corresponding format.
   *
   * @param transfer The transferred data.
   * @returns A new menu item fitting to the data type. If no item could be created, null
   *   is returned.
   */
  public async createItem(transfer: DataTransfer): Promise<MenuItem | null> {
    // We collect all potential data formats first. We have to do this, because some of
    // the following code is asynchronous and the DataTransfer object becomes invalid
    // after an await.
    const data = new Map<string, string | File>();

    for (const type of transfer.types) {
      if (type === 'Files') {
        data.set(type, transfer.files[0]);
      } else if (
        type === 'text/plain' ||
        type === 'text/uri-list' ||
        type === 'kando/item-type' ||
        type === 'kando/menu'
      ) {
        data.set(type, transfer.getData(type));
      }
    }

    // This is used during drag-and-drop operations of menu items in the menu editor.
    if (data.has('kando/item-type')) {
      const typeName = data.get('kando/item-type') as string;
      const itemType = this.types.get(typeName);
      if (itemType) {
        return {
          type: typeName,
          name: itemType.defaultName,
          icon: itemType.defaultIcon,
          iconTheme: itemType.defaultIconTheme,
          data: itemType.defaultData,
          children: itemType.hasChildren ? [] : undefined,
        };
      }
    }

    // This is used during drag-and-drop operations of menus in the editor.
    if (data.has('kando/menu')) {
      // This will be a IRenderedMenu as defined in
      // settings-renderer/components/menu-list/MenuList.tsx
      const menu = JSON.parse(data.get('kando/menu') as string);
      return {
        type: 'redirect',
        name: menu.name,
        icon: menu.icon,
        iconTheme: menu.iconTheme,
        data: {
          menu: menu.name,
        },
      };
    }

    // Creating a menu item for a file may fail. If it does, we try another data type
    // below.
    if (data.has('Files')) {
      const item = await window.commonAPI.createItemForDroppedFile(
        data.get('Files') as File
      );
      if (item) {
        return item;
      }
    }

    if (data.has('text/uri-list')) {
      const itemType = this.types.get('uri');
      return {
        type: 'uri',
        name: itemType.defaultName,
        icon: itemType.defaultIcon,
        iconTheme: itemType.defaultIconTheme,
        data: {
          uri: data.get('text/uri-list') as string,
        },
      };
    }

    if (data.has('text/plain')) {
      const itemType = this.types.get('text');
      return {
        type: 'text',
        name: itemType.defaultName,
        icon: itemType.defaultIcon,
        iconTheme: itemType.defaultIconTheme,
        data: {
          text: data.get('text/plain') as string,
        },
      };
    }

    return null;
  }
}

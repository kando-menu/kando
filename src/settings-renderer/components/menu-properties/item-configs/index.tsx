//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import { getSubmenuItemTips } from './submenu-item-config';
import { CommandItemConfig, getCommandItemTips } from './command-item-config';
import { FileItemConfig, getFileItemTips } from './file-item-config';
import { HotkeyItemConfig, getHotkeyItemTips } from './hotkey-item-config';
import { MacroItemConfig, getMacroItemTips } from './macro-item-config';
import { TextItemConfig, getTextItemTips } from './text-item-config';
import { UriItemConfig, getUriItemTips } from './uri-item-config';
import { RedirectItemConfig } from './redirect-item-config';
import { getSettingsItemTips } from './settings-item-config';

/**
 * This method returns a config component for the given menu item type.
 *
 * @param type The menu item type for which the config component should be created.
 * @returns The config component for the given menu item.
 */
export function getConfigComponent(type: string): React.ReactElement {
  const components: Record<string, React.ReactElement> = {
    command: <CommandItemConfig />,
    file: <FileItemConfig />,
    hotkey: <HotkeyItemConfig />,
    macro: <MacroItemConfig />,
    text: <TextItemConfig />,
    uri: <UriItemConfig />,
    redirect: <RedirectItemConfig />,
  };

  return components[type] || null;
}

/**
 * This method returns the tips for the given menu item type.
 *
 * @param type The menu item type for which the tips should be returned.
 * @returns The tips for the given menu item type.
 */
export function getItemTips(type: string): string[] {
  const tips: Record<string, string[]> = {
    submenu: getSubmenuItemTips(),
    command: getCommandItemTips(),
    file: getFileItemTips(),
    hotkey: getHotkeyItemTips(),
    macro: getMacroItemTips(),
    text: getTextItemTips(),
    uri: getUriItemTips(),
    settings: getSettingsItemTips(),
  };

  return tips[type] || [];
}

/**
 * This is used during drag-and-drop operations: When some data is dragged into the
 * settings menu, we try to create a corresponding action. Usually, the drag source offers
 * the data in a variety of formats. Given a list of formats, this method returns true if
 * one of the formats is supported.
 *
 * @param transfer The transferred data.
 * @returns True if the drag source offers a supported data type.
 */
export function hasSupportedDataType(transfer: DataTransfer): boolean {
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
 * Given some dropped data, this method returns a new menu item fitting to the data type.
 * The data type is a mime type such as 'text/plain' or a Kando-specific type such as
 * 'kando/item-type'. The data itself is a string that contains the data in the
 * corresponding format.
 *
 * @param transfer The transferred data.
 * @returns A new menu item with a single-action workflow fitting to the data type. If no
 *   item could be created, null is returned.
 */
export async function createItem(transfer: DataTransfer): Promise<MenuItem | null> {
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

  // This is used during drag-and-drop operations of actions in the menu editor.
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

  // Creating a action for a file may fail. If it does, we try another data type
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

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IMenuItem } from '.';
import { SubmenuItemConfig } from './item-types/submenu-item-config';
import { CommandItemConfig } from './item-types/command-item-config';
import { HotkeyItemConfig } from './item-types/hotkey-item-config';
import { MacroItemConfig } from './item-types/macro-item-config';
import { TextItemConfig } from './item-types/text-item-config';
import { URIItemConfig } from './item-types/uri-item-config';

/**
 * This interface is required for generating the configuration widget for a specific item
 * type in the menu editor. You can find the implementations in the `item-configs`
 * directory.
 */
export interface IItemConfig {
  /**
   * The tip returned by this method will be shown below the item properties in the menu
   * editor. It could be used to give the user some hints on how to configure the item. It
   * is also fine to return a random tip here, this way the user will learn something new
   * every time he selects an item of this kind. You can also return an empty string if
   * you don't want to show a tip.
   */
  getTipOfTheDay(): string;

  /**
   * This method returns an DocumentFragment that will be shown in the menu editor for
   * editing the given item. Whenever the user changes the settings of the item, the item
   * is updated accordingly. If an item type does not need any special settings, this
   * method can return null.
   */
  getConfigWidget(item: IMenuItem): DocumentFragment | null;
}

/**
 * This singleton class is a registry for all available actions. It is used to execute the
 * action of a menu item. This class can be used only in the backend process.
 */
export class ItemConfigRegistry {
  /** The singleton instance of this class. */
  private static instance: ItemConfigRegistry = null;

  /** This map contains all available configs. The keys are the type names. */
  private configs: Map<string, IItemConfig> = new Map();

  /**
   * This is a singleton class. The constructor is private. Use `getInstance` to get the
   * instance of this class.
   */
  private constructor() {
    this.configs.set('command', new CommandItemConfig());
    this.configs.set('hotkey', new HotkeyItemConfig());
    this.configs.set('macro', new MacroItemConfig());
    this.configs.set('submenu', new SubmenuItemConfig());
    this.configs.set('text', new TextItemConfig());
    this.configs.set('uri', new URIItemConfig());
  }

  /**
   * Use this method to get the singleton instance of this class.
   *
   * @returns The singleton instance of this class.
   */
  public static getInstance(): ItemConfigRegistry {
    if (ItemConfigRegistry.instance === null) {
      ItemConfigRegistry.instance = new ItemConfigRegistry();
    }
    return ItemConfigRegistry.instance;
  }

  /**
   * Use this method to get a tip-of-the-day for a specific item type.
   *
   * @param typeName The name of the type you want to get a tip for.
   * @returns A tip-of-the-day for the requested type.
   * @throws If the requested type is not available.
   */
  public getTipOfTheDay(typeName: string) {
    return this.getItemConfig(typeName).getTipOfTheDay();
  }

  /**
   * Use this method to get a configuration widget for a specific item type.
   *
   * @param item The item you want to configure.
   * @returns A configuration widget for the requested type.
   * @throws If the item's type is not available.
   */
  public getConfigWidget(item: IMenuItem) {
    return this.getItemConfig(item.type).getConfigWidget(item);
  }

  /**
   * This method returns the type object for the given type name.
   *
   * @param typeName The name of the type you want to get the config object for.
   * @returns The config object for the requested type.
   */
  private getItemConfig(typeName: string): IItemConfig {
    const config = this.configs.get(typeName);

    if (!config) {
      throw new Error(`Unknown item type: ${typeName}`);
    }

    return config;
  }
}

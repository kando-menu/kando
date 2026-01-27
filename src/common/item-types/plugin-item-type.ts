//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

// Note: In the actual Kando fork, you would import i18next:
// import i18next from 'i18next';

// Note: In the actual Kando fork, import from the existing registry:
// import { ItemType } from './item-type-registry';

/**
 * This interface matches Kando's ItemType interface.
 * In the actual fork, import from item-type-registry.ts instead.
 */
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
   * This should return a human-readable description of this kind of menu item.
   * It will be shown in the add-new-item tab of the toolbar.
   */
  genericDescription: string;
}

/**
 * Data schema for plugin menu items.
 * This is stored in the menu item's data field.
 */
export type PluginItemData = {
  /** The unique identifier of the plugin to execute */
  pluginId: string;
};

/**
 * This class provides meta information for menu items that execute plugins.
 * Plugins are external applications that run in their own BrowserWindow when triggered.
 */
export class PluginItemType implements ItemType {
  /**
   * Plugin items do not have children - they execute an external plugin.
   */
  get hasChildren(): boolean {
    return false;
  }

  /**
   * The default name shown when creating a new plugin item.
   */
  get defaultName(): string {
    // In actual implementation, use i18next for localization:
    // return i18next.t('menu-items.plugin.name');
    return 'Plugin';
  }

  /**
   * The default icon for plugin items.
   * Uses 'extension' which is a standard Material Design icon for plugins/extensions.
   */
  get defaultIcon(): string {
    return 'extension';
  }

  /**
   * The icon theme containing the default icon.
   * Uses 'material-symbols-rounded' to match Kando's Material icon system.
   */
  get defaultIconTheme(): string {
    return 'material-symbols-rounded';
  }

  /**
   * Default data for new plugin items.
   * The pluginId must be configured by the user.
   */
  get defaultData(): PluginItemData {
    return {
      pluginId: '',
    };
  }

  /**
   * Description shown in the add-new-item toolbar tab.
   */
  get genericDescription(): string {
    // In actual implementation, use i18next for localization:
    // return i18next.t('menu-items.plugin.description');
    return 'Execute an external plugin application.';
  }
}

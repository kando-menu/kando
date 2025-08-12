//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import * as z from 'zod';

/**
 * This interface is used to describe the conditions under which a menu should be shown.
 * When a menu shall be shown, the conditions of all menus are checked. The menu with the
 * most conditions that are met is selected.
 */
export const menuConditionsSchema = z.object({
  /** Regex to match for a window name */
  windowName: z.string().nullish(),

  /** Regex to match for an application name. */
  appName: z.string().nullish(),

  /**
   * Cursor position to match. In pixels relative to the top-left corner of the primary
   * display.
   */
  screenArea: z
    .object({
      xMin: z.number().nullish(),
      xMax: z.number().nullish(),
      yMin: z.number().nullish(),
      yMax: z.number().nullish(),
    })
    .nullish(),
});

/** The menu consists of a tree of menu items. */
export const menuItemSchema = z.object({
  /** The type of the menu item. See `ItemActionRegistry` and `ItemTypeRegistry`. */
  type: z.string(),

  /**
   * The data of the menu item. What this contains depends on the type. Usually, only leaf
   * menu items will have this field.
   */
  data: z.unknown().nullish(),

  /** The name of the menu item. This may be displayed with some kind of label. */
  name: z.string(),

  /** The icon of the menu item. */
  icon: z.string(),

  /** The theme from which the above icon should be used. */
  iconTheme: z.string(),

  /**
   * The children of this menu item. If this property is set, the menu item represents a
   * submenu.
   */
  get children() {
    return z.array(menuItemSchema).nullish();
  },

  /**
   * The direction of the menu item in degrees. If not set, it will be computed when the
   * menu is opened. If set, it is considered to be a "fixed angle" and all siblings will
   * be distributed more or less evenly around.
   */
  angle: z.number().min(0).max(360).nullish(),
});

/**
 * This interface describes a menu. It contains the root item of the menu, the shortcut to
 * open the menu and a flag indicating whether the menu should be opened in the center of
 * the screen or at the mouse pointer.
 *
 * This interface is used to describe one of the configured menus in the settings file.
 */
export const menuSchema = z.object({
  /** The root item of the menu. */
  root: menuItemSchema,

  /**
   * The shortcut to open the menu. Something like 'Control+Space'.
   *
   * @todo: Add description of the format of the shortcut string.
   */
  shortcut: z.string().default(''),

  /**
   * Some backends do not support direct binding of shortcuts. In this case, the user will
   * not be able to change the shortcut in the settings. Instead, the user provides an ID
   * for the shortcut and can then assign a key binding in the operating system.
   */
  shortcutID: z.string().default(''),

  /**
   * If true, the menu will open in the screen's center. Else it will open at the mouse
   * pointer.
   */
  centered: z.boolean().default(false),

  /**
   * If true, the menu will be "anchored". This means that any submenus will be opened at
   * the same position as the parent menu.
   */
  anchored: z.boolean().default(false),

  /**
   * If true, the menu will be in "hover mode". This means that the menu items can be
   * selected by only hovering over them.
   */
  hoverMode: z.boolean().default(false),

  /**
   * Conditions are matched before showing a menu. The one that has more conditions and
   * met them all is selected.
   */
  conditions: menuConditionsSchema.nullish(),

  /** Tags can be used to group and filter menus. */
  tags: z.array(z.string()).default([]),
});

/** The user can create menu collections to group menus according to their tags. */
export const menuCollectionSchema = z.object({
  /** The name of the collection. */
  name: z.string(),

  /** The icon of the collection. */
  icon: z.string(),

  /** The theme from which the above icon should be used. */
  iconTheme: z.string(),

  /** The tags which should be included in this collection. */
  tags: z.array(z.string()).default([]),
});

/**
 * This interface describes the content of the settings file. It contains the configured
 * menus as well as the templates.
 */
export const menuSettingsSchema = z.object({
  menus: z.array(menuSchema).default([]),

  /** The currently configured menu collections. */
  collections: z.array(menuCollectionSchema).default([
    {
      name: 'Favorites',
      icon: 'favorite',
      iconTheme: 'material-symbols-rounded',
      tags: ['favs'],
    },
  ]),
});

export type IMenuConditions = z.infer<typeof menuConditionsSchema>;
export type IMenuItem = z.infer<typeof menuItemSchema>;
export type IMenu = z.infer<typeof menuSchema>;
export type IMenuCollection = z.infer<typeof menuCollectionSchema>;
export type IMenuSettings = z.infer<typeof menuSettingsSchema>;

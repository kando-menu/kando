//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';
import * as z from 'zod';
import { version } from './../../../package.json';

// ------------------------------------------------------------------------------------ //
// #region                         Menu Actions
// ------------------------------------------------------------------------------------ //

/** This action will execute a command when triggered. */
export const MENU_EXECUTE_COMMAND_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('execute-command'),

  /** The command to execute. */
  command: z.string(),

  /**
   * If set, the command will be executed in a detached process. This means that the
   * process will not be connected to Kando, and will continue to run even if Kando is
   * closed.
   */
  detached: z.boolean().default(true),

  /**
   * If set, the command will be executed in a clean environment, meaning that it will not
   * inherit any environment variables from Kando. This is not yet supported on all
   * platforms.
   */
  isolated: z.boolean().default(false),
});

/** This action will open a file when triggered. */
export const MENU_OPEN_FILE_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('open-file'),

  /** The path of the file to open. */
  path: z.string(),
});

/** This action will open Kando's settings when triggered. */
export const MENU_OPEN_SETTINGS_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('open-settings'),
});

/** This action will open another menu when triggered. */
export const MENU_OPEN_MENU_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('open-menu'),

  /** The menu to open. */
  menu: z.string(),
});

/** This action will open an URI when triggered. */
export const MENU_OPEN_URI_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('open-uri'),

  /** The URI to open. */
  uri: z.string(),
});

/** This action will simulate a hotkey when triggered. */
export const MENU_SIMULATE_HOTKEY_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('simulate-hotkey'),

  /** The hotkey to simulate. */
  hotkey: z.string(),
});

/** This action will trigger a complex macro when triggered. */
export const MENU_SIMULATE_MACRO_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('simulate-macro'),

  /** The macro to trigger. */
  macro: z.array(
    z.object({
      type: z.enum(['keyDown', 'keyUp']),
      delay: z.number().default(0),
      key: z.string(),
    })
  ),
});

/** This action will update the clipboard when triggered. */
export const MENU_UPDATE_CLIPBOARD_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('update-clipboard'),

  /** The text to copy to the clipboard. */
  text: z.string(),
});

/** This type describes the possible actions that can be performed in a workflow. */
export const MENU_ACTION_SCHEMA_V2 = z.discriminatedUnion('type', [
  MENU_EXECUTE_COMMAND_ACTION_SCHEMA_V2,
  MENU_OPEN_FILE_ACTION_SCHEMA_V2,
  MENU_OPEN_MENU_ACTION_SCHEMA_V2,
  MENU_OPEN_SETTINGS_ACTION_SCHEMA_V2,
  MENU_OPEN_URI_ACTION_SCHEMA_V2,
  MENU_SIMULATE_HOTKEY_ACTION_SCHEMA_V2,
  MENU_SIMULATE_MACRO_ACTION_SCHEMA_V2,
  MENU_UPDATE_CLIPBOARD_ACTION_SCHEMA_V2,
]);

/** This type describes a workflow for a menu item is triggered when it is selected. */
export const MENU_SELECT_WORKFLOW_SCHEMA_V2 = z.object({
  /** Whether any select-workflow events should wait until the menu is hidden. */
  waitForFadeout: z.boolean().default(false),

  /** Whether all Kando shortcuts should be disabled when the select-workflow is active. */
  inhibitShortcuts: z.boolean().default(false),

  /** The actions to perform when the event is triggered. */
  actions: z.array(MENU_ACTION_SCHEMA_V2).default([]),
});

/** This type describes a workflow for a menu item is triggered when it is hovered. */
export const MENU_HOVER_WORKFLOW_SCHEMA_V2 = z.object({
  /** The actions to perform when the event is triggered. */
  actions: z.array(MENU_ACTION_SCHEMA_V2).default([]),
});

// ------------------------------------------------------------------------------------ //
// #region                           Menu Items
// ------------------------------------------------------------------------------------ //

/**
 * This type describes the basic properties of each menu item. It is extended by the
 * specific types for button and submenu items further below.
 */
export const MENU_ITEM_BASE_SCHEMA_V2 = z.object({
  /** The name of the menu item. This may be displayed with some kind of label. */
  name: z.string(),

  /** The icon of the menu item. */
  icon: z.string(),

  /** The theme from which the above icon should be used. */
  iconTheme: z.string(),

  /** The quick-select key for selecting this menu item. */
  quickSelectKey: z.string().optional(),

  /**
   * The direction of the menu item in degrees. If not set, it will be computed when the
   * menu is opened. If set, it is considered to be a "fixed angle" and all siblings will
   * be distributed more or less evenly around.
   */
  angle: z.number().optional(),
});

/** Button menu items do not have any additional properties beyond the base properties. */
export const MENU_BUTTON_ITEM_SCHEMA_V2 = MENU_ITEM_BASE_SCHEMA_V2.extend({
  type: z.literal('button'),

  /** The workflow which is triggered when the item is selected. */
  selectWorkflow: MENU_SELECT_WORKFLOW_SCHEMA_V2.optional(),

  /** The workflow which is triggered when the item is hovered. */
  hoverWorkflow: MENU_HOVER_WORKFLOW_SCHEMA_V2.optional(),
});

/**
 * Submenu items have children, which are other menu items. Due to the type recursion, we
 * use a lazy schema.
 */
export const MENU_SUBMENU_ITEM_SCHEMA_V2 = MENU_ITEM_BASE_SCHEMA_V2.extend({
  type: z.literal('submenu'),

  /** The workflow which is triggered when the submenu is opened. */
  openWorkflow: MENU_HOVER_WORKFLOW_SCHEMA_V2.optional(),

  /** The workflow which is triggered when the submenu is hovered. */
  hoverWorkflow: MENU_HOVER_WORKFLOW_SCHEMA_V2.optional(),

  /** The children of this menu item. */
  children: z.lazy(() => z.array(MENU_ITEM_SCHEMA_V2).default([])),
});

/** The menu consists of a tree of menu items. Each item can be a button or a submenu. */
export const MENU_ITEM_SCHEMA_V2 = z.lazy(() =>
  z.discriminatedUnion('type', [MENU_BUTTON_ITEM_SCHEMA_V2, MENU_SUBMENU_ITEM_SCHEMA_V2])
) as z.ZodType<MenuItemV2>;

// ------------------------------------------------------------------------------------ //
// #region                         Menu Conditions
// ------------------------------------------------------------------------------------ //

/**
 * This type is used to describe the conditions under which a menu should be shown. When a
 * menu shall be shown, the conditions of all menus are checked. The menu with the most
 * conditions that are met is selected.
 */
export const MENU_CONDITIONS_SCHEMA_V2 = z.object({
  /** Regex to match for a window name */
  windowName: z.string().optional(),

  /** Regex to match for an application name. */
  appName: z.string().optional(),

  /**
   * Cursor position to match. In pixels relative to the top-left corner of the primary
   * display.
   */
  screenArea: z
    .object({
      xMin: z.number().optional(),
      xMax: z.number().optional(),
      yMin: z.number().optional(),
      yMax: z.number().optional(),
    })
    .optional(),
});

// ------------------------------------------------------------------------------------ //
// #region                             Menus
// ------------------------------------------------------------------------------------ //

/**
 * This type describes a menu. It contains the root item of the menu, the shortcut to open
 * the menu and a flag indicating whether the menu should be opened in the center of the
 * screen or at the mouse pointer.
 *
 * This type is used to describe one of the configured menus in the settings file.
 */
export const MENU_SCHEMA_V2 = z.object({
  /** The root item of the menu. */
  root: MENU_ITEM_SCHEMA_V2,

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
  conditions: MENU_CONDITIONS_SCHEMA_V2.optional(),

  /** Tags can be used to group and filter menus. */
  tags: z.array(z.string()).default([]),
});

// ------------------------------------------------------------------------------------ //
// #region                       Menu Collections
// ------------------------------------------------------------------------------------ //

/** The user can create menu collections to group menus according to their tags. */
export const MENU_COLLECTION_SCHEMA_V2 = z.object({
  /** The name of the collection. */
  name: z.string(),

  /** The icon of the collection. */
  icon: z.string(),

  /** The theme from which the above icon should be used. */
  iconTheme: z.string(),

  /** The tags which should be included in this collection. */
  tags: z.array(z.string()).default([]),
});

// ------------------------------------------------------------------------------------ //
// #region                          Menu Settings
// ------------------------------------------------------------------------------------ //

/**
 * This type describes the content of the settings file. It contains the configured menus
 * as well as the templates.
 */
export const MENU_SETTINGS_SCHEMA_V2 = z.object({
  /**
   * The last version of Kando. This is used to determine whether the settings file needs
   * to be backed up and potentially migrated to a newer version.
   */
  version: z.string().default(version),

  /** The currently configured menus. */
  menus: z.array(MENU_SCHEMA_V2).default([]),

  /** The currently configured menu collections. */
  collections: z.array(MENU_COLLECTION_SCHEMA_V2).default([
    {
      name: 'Favorites',
      icon: 'favorite',
      iconTheme: 'material-symbols-rounded',
      tags: ['favs'],
    },
  ]),
});

// ------------------------------------------------------------------------------------ //
// #region                        Action Meta Info
// ------------------------------------------------------------------------------------ //

const MENU_ACTION_TYPE_META_ENTRIES_V2: Array<[MenuActionTypeV2, MenuActionTypeMetaV2]> =
  [
    [
      'execute-command',
      {
        name: i18next.t('menu-items.command.name'),
        icon: 'command-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-items.command.description'),
      },
    ],
    [
      'open-file',
      {
        name: i18next.t('menu-items.file.name'),
        icon: 'file-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-items.file.description'),
      },
    ],
    [
      'open-menu',
      {
        name: i18next.t('menu-items.redirect.name'),
        icon: 'redirect-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-items.redirect.description'),
      },
    ],
    [
      'open-settings',
      {
        name: i18next.t('menu-items.settings.name'),
        icon: 'settings-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-items.settings.description'),
      },
    ],
    [
      'open-uri',
      {
        name: i18next.t('menu-items.uri.name'),
        icon: 'uri-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-items.uri.description'),
      },
    ],
    [
      'simulate-hotkey',
      {
        name: i18next.t('menu-items.hotkey.name'),
        icon: 'hotkey-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-items.hotkey.description'),
      },
    ],
    [
      'simulate-macro',
      {
        name: i18next.t('menu-items.macro.name'),
        icon: 'macro-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-items.macro.description'),
      },
    ],
    [
      'update-clipboard',
      {
        name: i18next.t('menu-items.text.name'),
        icon: 'clipboard-item.svg',
        iconTheme: 'kando',
        description: i18next.t('menu-items.text.description'),
      },
    ],
  ];

/** Meta information for all available action types. */
export const MENU_ACTION_TYPE_META_V2: Readonly<
  Record<MenuActionTypeV2, MenuActionTypeMetaV2>
> = Object.fromEntries(MENU_ACTION_TYPE_META_ENTRIES_V2) as Record<
  MenuActionTypeV2,
  MenuActionTypeMetaV2
>;

// ------------------------------------------------------------------------------------ //
// #region                        Type Exports
// ------------------------------------------------------------------------------------ //

export type MenuV2 = z.infer<typeof MENU_SCHEMA_V2>;

/**
 * Due to the recursive nature of the menu items, we need to explicitly define this type
 * here.
 */
export type MenuSubmenuItemV2 = z.infer<typeof MENU_ITEM_BASE_SCHEMA_V2> & {
  type: 'submenu';
  children?: MenuItemV2[] | null;
};
export type MenuButtonItemV2 = z.infer<typeof MENU_BUTTON_ITEM_SCHEMA_V2>;
export type MenuItemV2 = MenuButtonItemV2 | MenuSubmenuItemV2;

export type MenuActionV2 = z.infer<typeof MENU_ACTION_SCHEMA_V2>;
export type MenuActionTypeV2 = z.infer<typeof MENU_ACTION_SCHEMA_V2>['type'];

export type MenuConditionsV2 = z.infer<typeof MENU_CONDITIONS_SCHEMA_V2>;

export type MenuCollectionV2 = z.infer<typeof MENU_COLLECTION_SCHEMA_V2>;

export type MenuSettingsV2 = z.infer<typeof MENU_SETTINGS_SCHEMA_V2>;

/** This type describes meta information for an action type. */
type MenuActionTypeMetaV2 = {
  /** The default name for new actions of this kind. */
  name: string;

  /** The default icon for new actions of this kind. */
  icon: string;

  /** The default icon theme for new actions of this kind. */
  iconTheme: string;

  /** A human-readable description of this kind of action. */
  description: string;
};

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import * as z from 'zod';
import { version } from './../../../package.json';

// ------------------------------------------------------------------------------------ //
// #region                        Workflow Actions
// ------------------------------------------------------------------------------------ //

/** This action will close the menu when executed. */
export const CLOSE_MENU_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('close-menu'),
});

/** This action will close the current submenu when executed. */
export const CLOSE_SUBMENU_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('close-submenu'),
});

/** This action will simply wait for a specified amount of time when triggered. */
export const DELAY_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('delay'),

  /** The amount of time to wait in seconds. */
  duration: z.number(),
});

/** This action will execute a command when triggered. */
export const EXECUTE_COMMAND_ACTION_SCHEMA_V2 = z.object({
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

/** Temporarily disables all Kando shortcuts when triggered. */
export const INHIBIT_SHORTCUTS_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('inhibit-shortcuts'),
});

/** Macros are composed of these events. */
export const MACRO_EVENT_SCHEMA_V2 = z.object({
  type: z.enum(['keyDown', 'keyUp']),

  /** The delay before executing this event in milliseconds. */
  delay: z.number().default(0),

  /** The key for this event. This can be a single character or a special key like 'Enter'. */
  key: z.string(),
});

/** This action will trigger a complex macro when triggered. */
export const EXECUTE_MACRO_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('execute-macro'),

  /** The macro to trigger. */
  macro: z.array(MACRO_EVENT_SCHEMA_V2),
});

/** This action will focus a matching application window. */
export const FOCUS_WINDOW_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('focus-window'),

  /** Regex to match for a window name */
  windowName: z.string().optional(),

  /** Regex to match for an application name. */
  appName: z.string().optional(),
});

/** This action will open a file when triggered. */
export const OPEN_FILE_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('open-file'),

  /** The path of the file to open. */
  path: z.string(),
});

/** This action will open Kando's settings when triggered. */
export const OPEN_SETTINGS_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('open-settings'),
});

/** This action will open another menu when triggered. */
export const OPEN_MENU_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('open-menu'),

  /** The menu to open. */
  menu: z.string(),
});

/** This action will open an URI when triggered. */
export const OPEN_URI_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('open-uri'),

  /** The URI to open. */
  uri: z.string(),
});

/** This action will set the clipboard when triggered. */
export const SET_CLIPBOARD_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('set-clipboard'),

  /** The text to copy to the clipboard. */
  text: z.string(),
});

/** This action will simulate a hotkey when triggered. */
export const SIMULATE_HOTKEY_ACTION_SCHEMA_V2 = z.object({
  type: z.literal('simulate-hotkey'),

  /** The hotkey to simulate. */
  hotkey: z.string(),
});

/** This type describes the possible actions that can be performed in a workflow. */
export const WORKFLOW_ACTION_SCHEMA_V2 = z.discriminatedUnion('type', [
  CLOSE_MENU_ACTION_SCHEMA_V2,
  CLOSE_SUBMENU_ACTION_SCHEMA_V2,
  DELAY_ACTION_SCHEMA_V2,
  EXECUTE_COMMAND_ACTION_SCHEMA_V2,
  EXECUTE_MACRO_ACTION_SCHEMA_V2,
  FOCUS_WINDOW_ACTION_SCHEMA_V2,
  INHIBIT_SHORTCUTS_ACTION_SCHEMA_V2,
  OPEN_FILE_ACTION_SCHEMA_V2,
  OPEN_MENU_ACTION_SCHEMA_V2,
  OPEN_SETTINGS_ACTION_SCHEMA_V2,
  OPEN_URI_ACTION_SCHEMA_V2,
  SET_CLIPBOARD_ACTION_SCHEMA_V2,
  SIMULATE_HOTKEY_ACTION_SCHEMA_V2,
]);

/** This type describes a workflow for a menu item is triggered when it is selected. */
export const WORKFLOW_SCHEMA_V2 = z.object({
  /** The quick-select key for triggering this workflow. */
  quickSelectKey: z.string().optional(),

  /** The actions to perform when the event is triggered. */
  actions: z.array(WORKFLOW_ACTION_SCHEMA_V2).default([]),
});

// ------------------------------------------------------------------------------------ //
// #region                           Menu Items
// ------------------------------------------------------------------------------------ //

/**
 * This type describes the basic properties of each menu item. It is extended by the
 * specific types for the root, button and submenu items further below.
 */
const BASE_MENU_ITEM_SCHEMA_V2 = z.object({
  /** The name of the menu item. This may be displayed with some kind of label. */
  name: z.string(),

  /** The icon of the menu item. */
  icon: z.string(),

  /** The theme from which the above icon should be used. */
  iconTheme: z.string(),
});

/**
 * The root menu item is the top-level item of a menu. It can have children, which are the
 * actual items that are displayed in the menu. The root item itself does not have any
 * workflows.
 */
export const ROOT_MENU_ITEM_SCHEMA_V2 = BASE_MENU_ITEM_SCHEMA_V2.extend({
  type: z.literal('root'),

  /** The workflow which is triggered when the root center is clicked. */
  activateWorkflow: WORKFLOW_SCHEMA_V2.optional(),

  /** The top-level children of the menu. */
  get children() {
    return z.array(CHILD_MENU_ITEM_SCHEMA_V2);
  },
});

/** Button menu items do not have any children but can have workflows. */
export const BUTTON_MENU_ITEM_SCHEMA_V2 = BASE_MENU_ITEM_SCHEMA_V2.extend({
  type: z.literal('button'),

  /**
   * The direction of the menu item in degrees. If not set, it will be computed when the
   * menu is opened. If set, it is considered to be a "fixed angle" and all siblings will
   * be distributed more or less evenly around.
   */
  angle: z.number().optional(),

  /** The workflow which is triggered when the item is hovered. */
  hoverWorkflow: WORKFLOW_SCHEMA_V2.optional(),

  /** The workflow which is triggered when the item is selected. */
  selectWorkflow: WORKFLOW_SCHEMA_V2.optional(),
});

/**
 * Submenu items have children, which are other menu items. Due to the type recursion, we
 * use a lazy schema.
 */
export const SUBMENU_MENU_ITEM_SCHEMA_V2 = BASE_MENU_ITEM_SCHEMA_V2.extend({
  type: z.literal('submenu'),

  /**
   * The direction of the menu item in degrees. If not set, it will be computed when the
   * menu is opened. If set, it is considered to be a "fixed angle".
   */
  angle: z.number().optional(),

  /** The workflow which is triggered when the submenu is hovered. */
  hoverWorkflow: WORKFLOW_SCHEMA_V2.optional(),

  /** The workflow which is triggered when the submenu is opened. */
  openWorkflow: WORKFLOW_SCHEMA_V2.optional(),

  /** The workflow which is triggered when the submenu center is clicked while open. */
  activateWorkflow: WORKFLOW_SCHEMA_V2.optional(),

  /** The children of this menu item. */
  get children() {
    return z.array(CHILD_MENU_ITEM_SCHEMA_V2);
  },
});

/** Child menu items can be either button items or submenu items. */
export const CHILD_MENU_ITEM_SCHEMA_V2 = z.union([
  BUTTON_MENU_ITEM_SCHEMA_V2,
  SUBMENU_MENU_ITEM_SCHEMA_V2,
]);

/** This type can be any menu item, including the root item. */
export const MENU_ITEM_SCHEMA_V2 = z.union([
  ROOT_MENU_ITEM_SCHEMA_V2,
  BUTTON_MENU_ITEM_SCHEMA_V2,
  SUBMENU_MENU_ITEM_SCHEMA_V2,
]);

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
  root: ROOT_MENU_ITEM_SCHEMA_V2,

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
// #region                        Type Exports
// ------------------------------------------------------------------------------------ //

export type MenuV2 = z.infer<typeof MENU_SCHEMA_V2>;

export type WorkflowV2 = z.infer<typeof WORKFLOW_SCHEMA_V2>;
export type WorkflowActionV2 = z.infer<typeof WORKFLOW_ACTION_SCHEMA_V2>;
export type WorkflowActionTypeV2 = z.infer<typeof WORKFLOW_ACTION_SCHEMA_V2>['type'];
export type MenuItemTypeV2 = z.infer<typeof MENU_ITEM_SCHEMA_V2>['type'];

export type MacroEventV2 = z.infer<typeof MACRO_EVENT_SCHEMA_V2>;

export type CloseMenuActionV2 = z.infer<typeof CLOSE_MENU_ACTION_SCHEMA_V2>;
export type CloseSubmenuActionV2 = z.infer<typeof CLOSE_SUBMENU_ACTION_SCHEMA_V2>;
export type ExecuteCommandActionV2 = z.infer<typeof EXECUTE_COMMAND_ACTION_SCHEMA_V2>;
export type ExecuteMacroActionV2 = z.infer<typeof EXECUTE_MACRO_ACTION_SCHEMA_V2>;
export type FocusWindowActionV2 = z.infer<typeof FOCUS_WINDOW_ACTION_SCHEMA_V2>;
export type InhibitShortcutsActionV2 = z.infer<typeof INHIBIT_SHORTCUTS_ACTION_SCHEMA_V2>;
export type OpenFileActionV2 = z.infer<typeof OPEN_FILE_ACTION_SCHEMA_V2>;
export type OpenMenuActionV2 = z.infer<typeof OPEN_MENU_ACTION_SCHEMA_V2>;
export type OpenSettingsActionV2 = z.infer<typeof OPEN_SETTINGS_ACTION_SCHEMA_V2>;
export type OpenURIActionV2 = z.infer<typeof OPEN_URI_ACTION_SCHEMA_V2>;
export type SetClipboardActionV2 = z.infer<typeof SET_CLIPBOARD_ACTION_SCHEMA_V2>;
export type SimulateHotkeyActionV2 = z.infer<typeof SIMULATE_HOTKEY_ACTION_SCHEMA_V2>;
export type DelayActionV2 = z.infer<typeof DELAY_ACTION_SCHEMA_V2>;

export type RootMenuItemV2 = z.infer<typeof ROOT_MENU_ITEM_SCHEMA_V2>;
export type ButtonMenuItemV2 = z.infer<typeof BUTTON_MENU_ITEM_SCHEMA_V2>;
export type SubmenuMenuItemV2 = z.infer<typeof SUBMENU_MENU_ITEM_SCHEMA_V2>;
export type ChildMenuItemV2 = ButtonMenuItemV2 | SubmenuMenuItemV2;
export type MenuItemV2 = RootMenuItemV2 | ChildMenuItemV2;

export type MenuConditionsV2 = z.infer<typeof MENU_CONDITIONS_SCHEMA_V2>;
export type MenuCollectionV2 = z.infer<typeof MENU_COLLECTION_SCHEMA_V2>;
export type MenuSettingsV2 = z.infer<typeof MENU_SETTINGS_SCHEMA_V2>;

import * as z from 'zod';
/**
 * This type is used to describe the conditions under which a menu should be shown. When a
 * menu shall be shown, the conditions of all menus are checked. The menu with the most
 * conditions that are met is selected.
 */
export declare const MENU_CONDITIONS_SCHEMA_V1: any;
/** The menu consists of a tree of menu items. */
export declare const MENU_ITEM_SCHEMA_V1: any;
/**
 * This type describes a menu. It contains the root item of the menu, the shortcut to open
 * the menu and a flag indicating whether the menu should be opened in the center of the
 * screen or at the mouse pointer.
 *
 * This type is used to describe one of the configured menus in the settings file.
 */
export declare const MENU_SCHEMA_V1: any;
/** The user can create menu collections to group menus according to their tags. */
export declare const MENU_COLLECTION_SCHEMA_V1: any;
/**
 * This type describes the content of the settings file. It contains the configured menus
 * as well as the templates.
 */
export declare const MENU_SETTINGS_SCHEMA_V1: any;
export type MenuConditionsV1 = z.infer<typeof MENU_CONDITIONS_SCHEMA_V1>;
export type MenuItemV1 = z.infer<typeof MENU_ITEM_SCHEMA_V1>;
export type MenuV1 = z.infer<typeof MENU_SCHEMA_V1>;
export type MenuCollectionV1 = z.infer<typeof MENU_COLLECTION_SCHEMA_V1>;
export type MenuSettingsV1 = z.infer<typeof MENU_SETTINGS_SCHEMA_V1>;

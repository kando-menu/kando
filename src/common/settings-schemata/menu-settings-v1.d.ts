import * as z from 'zod';
/**
 * This type is used to describe the conditions under which a menu should be shown. When a
 * menu shall be shown, the conditions of all menus are checked. The menu with the most
 * conditions that are met is selected.
 */
export declare const MENU_CONDITIONS_SCHEMA_V1: z.ZodObject<{
    /** Regex to match for a window name */
    windowName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    /** Regex to match for an application name. */
    appName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    /**
     * Cursor position to match. In pixels relative to the top-left corner of the primary
     * display.
     */
    screenArea: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        xMin: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        xMax: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        yMin: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        yMax: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        xMin?: number | null | undefined;
        xMax?: number | null | undefined;
        yMin?: number | null | undefined;
        yMax?: number | null | undefined;
    }, {
        xMin?: number | null | undefined;
        xMax?: number | null | undefined;
        yMin?: number | null | undefined;
        yMax?: number | null | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    windowName?: string | null | undefined;
    appName?: string | null | undefined;
    screenArea?: {
        xMin?: number | null | undefined;
        xMax?: number | null | undefined;
        yMin?: number | null | undefined;
        yMax?: number | null | undefined;
    } | null | undefined;
}, {
    windowName?: string | null | undefined;
    appName?: string | null | undefined;
    screenArea?: {
        xMin?: number | null | undefined;
        xMax?: number | null | undefined;
        yMin?: number | null | undefined;
        yMax?: number | null | undefined;
    } | null | undefined;
}>;
/** The menu consists of a tree of menu items. */
export declare const MENU_ITEM_SCHEMA_V1: any;
/**
 * This type describes a menu. It contains the root item of the menu, the shortcut to open
 * the menu and a flag indicating whether the menu should be opened in the center of the
 * screen or at the mouse pointer.
 *
 * This type is used to describe one of the configured menus in the settings file.
 */
export declare const MENU_SCHEMA_V1: z.ZodObject<{
    /** The root item of the menu. */
    root: any;
    /**
     * The shortcut to open the menu. Something like 'Control+Space'.
     *
     * @todo: Add description of the format of the shortcut string.
     */
    shortcut: z.ZodDefault<z.ZodString>;
    /**
     * Some backends do not support direct binding of shortcuts. In this case, the user will
     * not be able to change the shortcut in the settings. Instead, the user provides an ID
     * for the shortcut and can then assign a key binding in the operating system.
     */
    shortcutID: z.ZodDefault<z.ZodString>;
    /**
     * If true, the menu will open in the screen's center. Else it will open at the mouse
     * pointer.
     */
    centered: z.ZodDefault<z.ZodBoolean>;
    /**
     * If true, the menu will be "anchored". This means that any submenus will be opened at
     * the same position as the parent menu.
     */
    anchored: z.ZodDefault<z.ZodBoolean>;
    /**
     * If true, the menu will be in "hover mode". This means that the menu items can be
     * selected by only hovering over them.
     */
    hoverMode: z.ZodDefault<z.ZodBoolean>;
    /**
     * Conditions are matched before showing a menu. The one that has more conditions and
     * met them all is selected.
     */
    conditions: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        /** Regex to match for a window name */
        windowName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        /** Regex to match for an application name. */
        appName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        /**
         * Cursor position to match. In pixels relative to the top-left corner of the primary
         * display.
         */
        screenArea: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            xMin: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            xMax: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            yMin: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            yMax: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            xMin?: number | null | undefined;
            xMax?: number | null | undefined;
            yMin?: number | null | undefined;
            yMax?: number | null | undefined;
        }, {
            xMin?: number | null | undefined;
            xMax?: number | null | undefined;
            yMin?: number | null | undefined;
            yMax?: number | null | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        windowName?: string | null | undefined;
        appName?: string | null | undefined;
        screenArea?: {
            xMin?: number | null | undefined;
            xMax?: number | null | undefined;
            yMin?: number | null | undefined;
            yMax?: number | null | undefined;
        } | null | undefined;
    }, {
        windowName?: string | null | undefined;
        appName?: string | null | undefined;
        screenArea?: {
            xMin?: number | null | undefined;
            xMax?: number | null | undefined;
            yMin?: number | null | undefined;
            yMax?: number | null | undefined;
        } | null | undefined;
    }>>>;
    /** Tags can be used to group and filter menus. */
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    shortcut: string;
    shortcutID: string;
    centered: boolean;
    anchored: boolean;
    hoverMode: boolean;
    tags: string[];
    root?: any;
    conditions?: {
        windowName?: string | null | undefined;
        appName?: string | null | undefined;
        screenArea?: {
            xMin?: number | null | undefined;
            xMax?: number | null | undefined;
            yMin?: number | null | undefined;
            yMax?: number | null | undefined;
        } | null | undefined;
    } | null | undefined;
}, {
    root?: any;
    shortcut?: string | undefined;
    shortcutID?: string | undefined;
    centered?: boolean | undefined;
    anchored?: boolean | undefined;
    hoverMode?: boolean | undefined;
    conditions?: {
        windowName?: string | null | undefined;
        appName?: string | null | undefined;
        screenArea?: {
            xMin?: number | null | undefined;
            xMax?: number | null | undefined;
            yMin?: number | null | undefined;
            yMax?: number | null | undefined;
        } | null | undefined;
    } | null | undefined;
    tags?: string[] | undefined;
}>;
/** The user can create menu collections to group menus according to their tags. */
export declare const MENU_COLLECTION_SCHEMA_V1: z.ZodObject<{
    /** The name of the collection. */
    name: z.ZodString;
    /** The icon of the collection. */
    icon: z.ZodString;
    /** The theme from which the above icon should be used. */
    iconTheme: z.ZodString;
    /** The tags which should be included in this collection. */
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    icon: string;
    iconTheme: string;
    tags: string[];
}, {
    name: string;
    icon: string;
    iconTheme: string;
    tags?: string[] | undefined;
}>;
/**
 * This type describes the content of the settings file. It contains the configured menus
 * as well as the templates.
 */
export declare const MENU_SETTINGS_SCHEMA_V1: z.ZodObject<{
    /**
     * The last version of Kando. This is used to determine whether the settings file needs
     * to be backed up and potentially migrated to a newer version.
     */
    version: z.ZodDefault<z.ZodString>;
    /** The currently configured menus. */
    menus: z.ZodDefault<z.ZodArray<z.ZodObject<{
        /** The root item of the menu. */
        root: any;
        /**
         * The shortcut to open the menu. Something like 'Control+Space'.
         *
         * @todo: Add description of the format of the shortcut string.
         */
        shortcut: z.ZodDefault<z.ZodString>;
        /**
         * Some backends do not support direct binding of shortcuts. In this case, the user will
         * not be able to change the shortcut in the settings. Instead, the user provides an ID
         * for the shortcut and can then assign a key binding in the operating system.
         */
        shortcutID: z.ZodDefault<z.ZodString>;
        /**
         * If true, the menu will open in the screen's center. Else it will open at the mouse
         * pointer.
         */
        centered: z.ZodDefault<z.ZodBoolean>;
        /**
         * If true, the menu will be "anchored". This means that any submenus will be opened at
         * the same position as the parent menu.
         */
        anchored: z.ZodDefault<z.ZodBoolean>;
        /**
         * If true, the menu will be in "hover mode". This means that the menu items can be
         * selected by only hovering over them.
         */
        hoverMode: z.ZodDefault<z.ZodBoolean>;
        /**
         * Conditions are matched before showing a menu. The one that has more conditions and
         * met them all is selected.
         */
        conditions: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            /** Regex to match for a window name */
            windowName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            /** Regex to match for an application name. */
            appName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            /**
             * Cursor position to match. In pixels relative to the top-left corner of the primary
             * display.
             */
            screenArea: z.ZodOptional<z.ZodNullable<z.ZodObject<{
                xMin: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                xMax: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                yMin: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                yMax: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                xMin?: number | null | undefined;
                xMax?: number | null | undefined;
                yMin?: number | null | undefined;
                yMax?: number | null | undefined;
            }, {
                xMin?: number | null | undefined;
                xMax?: number | null | undefined;
                yMin?: number | null | undefined;
                yMax?: number | null | undefined;
            }>>>;
        }, "strip", z.ZodTypeAny, {
            windowName?: string | null | undefined;
            appName?: string | null | undefined;
            screenArea?: {
                xMin?: number | null | undefined;
                xMax?: number | null | undefined;
                yMin?: number | null | undefined;
                yMax?: number | null | undefined;
            } | null | undefined;
        }, {
            windowName?: string | null | undefined;
            appName?: string | null | undefined;
            screenArea?: {
                xMin?: number | null | undefined;
                xMax?: number | null | undefined;
                yMin?: number | null | undefined;
                yMax?: number | null | undefined;
            } | null | undefined;
        }>>>;
        /** Tags can be used to group and filter menus. */
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        shortcut: string;
        shortcutID: string;
        centered: boolean;
        anchored: boolean;
        hoverMode: boolean;
        tags: string[];
        root?: any;
        conditions?: {
            windowName?: string | null | undefined;
            appName?: string | null | undefined;
            screenArea?: {
                xMin?: number | null | undefined;
                xMax?: number | null | undefined;
                yMin?: number | null | undefined;
                yMax?: number | null | undefined;
            } | null | undefined;
        } | null | undefined;
    }, {
        root?: any;
        shortcut?: string | undefined;
        shortcutID?: string | undefined;
        centered?: boolean | undefined;
        anchored?: boolean | undefined;
        hoverMode?: boolean | undefined;
        conditions?: {
            windowName?: string | null | undefined;
            appName?: string | null | undefined;
            screenArea?: {
                xMin?: number | null | undefined;
                xMax?: number | null | undefined;
                yMin?: number | null | undefined;
                yMax?: number | null | undefined;
            } | null | undefined;
        } | null | undefined;
        tags?: string[] | undefined;
    }>, "many">>;
    /** The currently configured menu collections. */
    collections: z.ZodDefault<z.ZodArray<z.ZodObject<{
        /** The name of the collection. */
        name: z.ZodString;
        /** The icon of the collection. */
        icon: z.ZodString;
        /** The theme from which the above icon should be used. */
        iconTheme: z.ZodString;
        /** The tags which should be included in this collection. */
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        icon: string;
        iconTheme: string;
        tags: string[];
    }, {
        name: string;
        icon: string;
        iconTheme: string;
        tags?: string[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    version: string;
    menus: {
        shortcut: string;
        shortcutID: string;
        centered: boolean;
        anchored: boolean;
        hoverMode: boolean;
        tags: string[];
        root?: any;
        conditions?: {
            windowName?: string | null | undefined;
            appName?: string | null | undefined;
            screenArea?: {
                xMin?: number | null | undefined;
                xMax?: number | null | undefined;
                yMin?: number | null | undefined;
                yMax?: number | null | undefined;
            } | null | undefined;
        } | null | undefined;
    }[];
    collections: {
        name: string;
        icon: string;
        iconTheme: string;
        tags: string[];
    }[];
}, {
    version?: string | undefined;
    menus?: {
        root?: any;
        shortcut?: string | undefined;
        shortcutID?: string | undefined;
        centered?: boolean | undefined;
        anchored?: boolean | undefined;
        hoverMode?: boolean | undefined;
        conditions?: {
            windowName?: string | null | undefined;
            appName?: string | null | undefined;
            screenArea?: {
                xMin?: number | null | undefined;
                xMax?: number | null | undefined;
                yMin?: number | null | undefined;
                yMax?: number | null | undefined;
            } | null | undefined;
        } | null | undefined;
        tags?: string[] | undefined;
    }[] | undefined;
    collections?: {
        name: string;
        icon: string;
        iconTheme: string;
        tags?: string[] | undefined;
    }[] | undefined;
}>;
export type MenuConditionsV1 = z.infer<typeof MENU_CONDITIONS_SCHEMA_V1>;
export type MenuItemV1 = z.infer<typeof MENU_ITEM_SCHEMA_V1>;
export type MenuV1 = z.infer<typeof MENU_SCHEMA_V1>;
export type MenuCollectionV1 = z.infer<typeof MENU_COLLECTION_SCHEMA_V1>;
export type MenuSettingsV1 = z.infer<typeof MENU_SETTINGS_SCHEMA_V1>;

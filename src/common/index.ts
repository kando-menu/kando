//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { MenuOptions } from '../renderer/menu/menu';
import { EditorOptions } from '../renderer/editor/editor';

/**
 * A simple 2D vector.
 *
 * You can find some vector math in the `src/renderer/math` directory.
 */
export interface IVec2 {
  x: number;
  y: number;
}

/** This interface describes some information about the currently used backend. */
export interface IBackendInfo {
  /**
   * The name of the backend. This is shown in the user interface so that users can see
   * which backend is currently active.
   */
  name: string;

  /**
   * Each backend should return a suitable window type here. The window type determines
   * how Kando's window is drawn. The most suitable type is dependent on the operating
   * system and the window manager. For example, on GNOME, the window type "dock" seems to
   * work best, on KDE "toolbar" provides a better experience. On Windows, "toolbar" is
   * the only type that works.
   * https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions
   *
   * @returns The window type to use for the pie menu window.
   */
  windowType: string;

  /**
   * There are some backends which do not support custom shortcuts. In this case, the user
   * will not be able to change the shortcuts in the settings. Instead, the user will set
   * a shortcut ID and then assign a shortcut in the operating system.
   */
  supportsShortcuts: boolean;

  /**
   * This hint is shown in the editor next to the shortcut-id input field if
   * supportsShortcuts is false. It should very briefly explain how to change the
   * shortcuts in the operating system. If supportsShortcuts is true, this is not
   * required.
   */
  shortcutHint?: string;
}

/** This interface describes some information about the current version of Kando. */
export interface IVersionInfo {
  kandoVersion: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
}

/**
 * The description of a menu theme. These are the properties which can be defined in the
 * JSON file of a menu theme.
 */
export interface IMenuThemeDescription {
  /**
   * The ID of the theme. This is used to identify the theme in the settings file. It is
   * also the directory name of the theme and is set by Kando when loading the theme.json
   * file. So the path to the theme.json file is this.directory/this.id/theme.json.
   */
  id: string;

  /**
   * The absolute path to the directory where the theme is stored. This is set by Kando
   * when loading the theme.json file.
   */
  directory: string;

  /** A human readable name of the theme. */
  name: string;

  /** The author of the theme. */
  author: string;

  /** The version of the theme. Should be a semantic version string like "1.0.0". */
  themeVersion: string;

  /** The version of the Kando theme engine this theme is compatible with. */
  engineVersion: number;

  /** The license of the theme. For instance "CC-BY-4.0". */
  license: string;

  /**
   * The maximum radius in pixels of a menu when using this theme. This is used to move
   * the menu away from the screen edges when it's opened too close to them.
   */
  maxMenuRadius: number;

  /** The width of the text wrap in the center of the menu in pixels. */
  centerTextWrapWidth: number;

  /**
   * If this is true, children of a menu item will be drawn below the parent. Otherwise
   * they will be drawn above.
   */
  drawChildrenBelow: boolean;

  /**
   * These colors will be available as var(--name) in the CSS file and can be adjusted by
   * the user in the settings. The map assigns a default CSS color to each name.
   */
  colors: Record<string, string>;

  /**
   * The layers which are drawn on top of each other for each menu item. Each layer will
   * be a html div element with a class defined in the theme file. Also, each layer can
   * have a `content` property which can be used to make the layer contain the item's icon
   * or name.
   */
  layers: {
    class: string;
    content: 'none' | 'name' | 'icon';
  }[];
}

/** This interface describes a icon theme consisting of a collection of icon files. */
export interface IFileIconThemeDescription {
  /**
   * The ID of the theme. This is used to identify the theme in the settings file. It is
   * also the directory name of the icon theme.
   */
  name: string;

  /**
   * The absolute path to the directory where the theme is stored, including the name as
   * the last part of the path.
   */
  directory: string;

  /**
   * A list of all available icons in this theme. These are the filenames of the icons
   * relative to the theme directory. In case of nested directories, the filenames can
   * actually be paths.
   */
  icons: string[];
}

/**
 * This interface is used to pass information about all available icon themes to the
 * renderer process.
 */
export interface IIconThemesInfo {
  /** The absolute path to the directory where the user may store custom icon themes. */
  userIconDirectory: string;

  /** All available file icon themes. */
  fileIconThemes: IFileIconThemeDescription[];
}

/**
 * Sound themes can define different sounds for different actions. This enum is used to
 * identify the different sounds.
 */
export enum SoundType {
  eOpenMenu = 'openMenu',
  eCloseMenu = 'closeMenu',
  eSelectItem = 'selectItem',
  eSelectSubmenu = 'selectSubmenu',
  eSelectParent = 'selectParent',
  eHoverItem = 'hoverItem',
  eHoverSubmenu = 'hoverSubmenu',
  eHoverParent = 'hoverParent',
}

/**
 * This interface is used to describe a sound effect. It contains the path to the sound
 * file and some optional properties like the volume and pitch shift.
 */
export interface ISoundEffect {
  /** The path to the sound file. */
  file: string;

  /** The volume of the sound. */
  volume?: number;

  /** The maximum pitch shift. */
  maxPitch?: number;

  /** The minimum pitch shift. */
  minPitch?: number;
}

/**
 * This interface is used to describe a sound theme. It contains the properties which can
 * be defined in the JSON file of a sound theme. All paths are relative to the theme
 * directory.
 */
export interface ISoundThemeDescription {
  /**
   * The ID of the theme. This is used to identify the theme in the settings file. It is
   * also the directory name of the theme and is set by Kando when loading the theme.json
   * file. So the path to the theme.json file is this.directory/this.id/theme.json.
   */
  id: string;

  /**
   * The absolute path to the directory where the theme is stored. This is set by Kando
   * when loading the theme.json file.
   */
  directory: string;

  /** A human readable name of the theme. */
  name: string;

  /** The author of the theme. */
  author: string;

  /** The version of the theme. Should be a semantic version string like "1.0.0". */
  themeVersion: string;

  /** The version of the Kando sound theme engine this theme is compatible with. */
  engineVersion: number;

  /** The license of the theme. For instance "CC-BY-4.0". */
  license: string;

  /**
   * All available sound effects. If a given sound is not defined here, no sound will be
   * played for the corresponding action.
   */
  sounds: Record<SoundType, ISoundEffect>;
}

/**
 * This interface is used to describe an element of a key sequence. It contains the DOM
 * name of the key, a boolean indicating whether the key is pressed or released and a
 * delay in milliseconds.
 */
export interface IKeyStroke {
  name: string;
  down: boolean;
  delay: number;
}

/**
 * This type is used to describe a sequence of key strokes. It is used to simulate
 * keyboard shortcuts.
 */
export type IKeySequence = Array<IKeyStroke>;

/**
 * There are different reasons why a menu should be shown. This interface is used to
 * describe the request to show a menu. A menu can be shown because a shortcut was pressed
 * (in this case `trigger` will be the shortcut or the shortcut ID) or because a menu was
 * requested by name.
 */
export interface IShowMenuRequest {
  trigger: string;
  name: string;
}

/**
 * This interface is used to describe the conditions under which a menu should be shown.
 * When a menu shall be shown, the conditions of all menus are checked. The menu with the
 * most conditions that are met is selected.
 */
export interface IMenuConditions {
  /** Regex to match for a window name */
  windowName?: string;

  /** Regex to match for an application name. */
  appName?: string;

  /**
   * Cursor position to match. In pixels relative to the top-left corner of the primary
   * display.
   */
  screenArea?: { xMin?: number; xMax?: number; yMin?: number; yMax?: number };
}

/** The menu consists of a tree of menu items. */
export interface IMenuItem {
  /** The type of the menu item. See `ItemActionRegistry` and `ItemTypeRegistry`. */
  type: string;

  /**
   * The data of the menu item. What this contains depends on the type. Usually, only leaf
   * menu items will have this field.
   */
  data?: unknown;

  /** The name of the menu item. This may be displayed with some kind of label. */
  name: string;

  /** The icon of the menu item. */
  icon: string;

  /** The theme from which the above icon should be used. */
  iconTheme: string;

  /**
   * The children of this menu item. If this property is set, the menu item represents a
   * submenu.
   */
  children?: Array<IMenuItem>;

  /**
   * The direction of the menu item in degrees. If not set, it will be computed when the
   * menu is opened. If set, it is considered to be a "fixed angle" and all siblings will
   * be distributed more or less evenly around.
   */
  angle?: number;
}

/**
 * This function creates a deep copy of an IMenuItem. It can also be used to strip all
 * properties from an menu item object which are not present in an IMenuItem. This is for
 * instance used before saving the menu settings.
 *
 * @param item The menu item to copy.
 * @returns The copied menu item.
 */
export function deepCopyMenuItem(item: IMenuItem): IMenuItem {
  return {
    type: item.type,
    data: structuredClone(item.data),
    name: item.name,
    icon: item.icon,
    iconTheme: item.iconTheme,
    children: item.children?.map(deepCopyMenuItem),
    angle: item.angle,
  };
}

/**
 * This interface describes a menu. It contains the root item of the menu, the shortcut to
 * open the menu and a flag indicating whether the menu should be opened in the center of
 * the screen or at the mouse pointer.
 *
 * This interface is used to describe one of the configured menus in the settings file.
 */
export interface IMenu {
  /** The root item of the menu. */
  root: IMenuItem;

  /**
   * The shortcut to open the menu. Something like 'Control+Space'.
   *
   * @todo: Add description of the format of the shortcut string.
   */
  shortcut: string;

  /**
   * Some backends do not support direct binding of shortcuts. In this case, the user will
   * not be able to change the shortcut in the settings. Instead, the user provides an ID
   * for the shortcut and can then assign a key binding in the operating system.
   */
  shortcutID: string;

  /**
   * If true, the menu will open in the screen's center. Else it will open at the mouse
   * pointer.
   */
  centered: boolean;

  /** If true, the mouse pointer will be warped to the center of the menu when necessary. */
  warpMouse: boolean;

  /**
   * If true, the menu will be "anchored". This means that any submenus will be opened at
   * the same position as the parent menu.
   */
  anchored: boolean;

  /**
   * Conditions are matched before showing a menu. The one that has more conditions and
   * met them all is selected.
   */
  conditions?: IMenuConditions;
}

/**
 * This function creates a deep copy of an IMenu.
 *
 * @param menu The menu to copy.
 * @returns The copied menu.
 */
export function deepCopyMenu(menu: IMenu): IMenu {
  return {
    root: deepCopyMenuItem(menu.root),
    shortcut: menu.shortcut,
    shortcutID: menu.shortcutID,
    centered: menu.centered,
    warpMouse: menu.warpMouse,
    anchored: menu.anchored,
    conditions: structuredClone(menu.conditions),
  };
}

/**
 * This interface is used to describe the additional information that is passed to the
 * Menu's `show()` method from the main to the renderer process.
 */
export interface IShowMenuOptions {
  /**
   * The position of the mouse cursor when the menu was opened. Relative to the top left
   * corner of the window.
   */
  mousePosition: IVec2;

  /**
   * The size of the window. Usually, this is the same as window.innerWidth and
   * window.innerHeight. However, when the window was just resized, this can be different.
   * Therefore, we need to pass it from the main process.
   */
  windowSize: IVec2;

  /**
   * The scale factor of the menu. This is required to compute the correct position of the
   * menu.
   */
  zoomFactor: number;

  /**
   * If this is set, the menu will be opened in the screen's center. Else it will be
   * opened at the mouse pointer.
   */
  centeredMode: boolean;

  /**
   * If this is set, the mouse pointer will be warped to the center of the menu when the
   * menu is opened.
   */
  warpMouse: boolean;

  /**
   * If this is set, the menu will be "anchored". This means that any submenus will be
   * opened at the same position as the parent menu.
   */
  anchoredMode: boolean;
}

/**
 * This interface is used to describe the additional information that is passed to the
 * Editor's `show()` method from the main to the renderer process.
 */
export interface IShowEditorOptions {
  /**
   * The name of the application that is currently focused. This will be used as a
   * condition example in the condition picker of the menu editor.
   */
  appName: string;

  /**
   * The name of the window that is currently focused. This will also be used as a
   * condition example in the condition picker of the menu editor.
   */
  windowName: string;

  /**
   * To compute the current mouse position in the condition picker, we need to know the
   * position of the window.
   */
  windowPosition: IVec2;
}

/**
 * This interface describes the content of the menu settings file. It contains the
 * configured menus as well as the templates.
 */
export interface IMenuSettings {
  menus: Array<IMenu>;

  /** The template menus and menu items. */
  templates: Array<IMenu | IMenuItem>;
}

/**
 * This interface describes the content of the app settings file. It contains the names of
 * the themes to use for the menu and the editor.
 */
export interface IAppSettings {
  /**
   * The locale to use. If set to 'auto', the system's locale will be used. If the locale
   * is not available, english will be used.
   */
  locale: string;

  /** The name of the theme to use for the menu. */
  menuTheme: string;

  /** The name of the theme which should be used for the dark mode. */
  darkMenuTheme: string;

  /**
   * The accent color overrides to use for menu themes. The outer key is the theme's ID,
   * the inner key is the color's name. The final value is the CSS color.
   */
  menuThemeColors: Record<string, Record<string, string>>;

  /**
   * The accent color overrides to use for the dark mode. The outer key is the theme's ID,
   * the inner key is the color's name. The final value is the CSS color.
   */
  darkMenuThemeColors: Record<string, Record<string, string>>;

  /**
   * If enabled, the dark menu theme and dark color variants will be used if the system is
   * in dark mode.
   */
  enableDarkModeForMenuThemes: boolean;

  /** The name of the current sound theme. */
  soundTheme: string;

  /** The overall volume of the sound effects. */
  soundVolume: number;

  /** Set this to false to disable the check for new versions. */
  enableVersionCheck: boolean;

  /** Whether to silently handle read-only config files. */
  ignoreWriteProtectedConfigFiles: boolean;

  /** The tray icon flavor. */
  trayIconFlavor: 'light' | 'dark' | 'color' | 'black' | 'white' | 'none';

  /** Whether the sidebar should be shown in the editor. */
  sidebarVisible: boolean;

  /** A scale factor for the menu. */
  zoomFactor: number;

  /** The options which are passed to the menu. */
  menuOptions: MenuOptions;

  /** The options which are passed to the menu editor. */
  editorOptions: EditorOptions;
}

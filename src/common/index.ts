//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * A simple 2D vector.
 *
 * Maybe we should turn this into a class and add some operations.
 */
export interface IVec2 {
  x: number;
  y: number;
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
 * The menu consists of a tree of nodes. Each node represents a menu item. Inner nodes
 * represent submenus, leaf nodes represent actual menu items.
 */
export interface INode {
  /**
   * The type of the menu item. This is primarily used to specify the action of this item,
   * but themes may also use it to style different types of menu items differently.
   */
  type: 'empty' | 'command' | 'uri' | 'hotkey' | 'submenu';

  /**
   * The data of the menu item. What this contains depends on the type. Usually, only leaf
   * nodes will have this field.
   */
  data?: unknown;

  /** The name of the menu item. This may be displayed with some kind of label. */
  name: string;

  /** The icon of the menu item. */
  icon: string;

  /** The theme from which the above icon should be used. */
  iconTheme: string;

  /**
   * The child nodes of this menu item. If this property is set, the node represents a
   * submenu.
   */
  children?: Array<INode>;

  /**
   * The direction of the menu item in degrees. If not set, it will be computed when the
   * menu is opened. If set, it is considered to be a "fixed angle" and all siblings will
   * be distributed more or less evenly around.
   */
  angle?: number;
}

/**
 * This interface describes a menu. It contains the root node of the menu, the shortcut to
 * open the menu and a flag indicating whether the menu should be opened in the center of
 * the screen or at the mouse pointer.
 *
 * This interface is used to describe one of the configured menus in the settings file.
 */
export interface IMenu {
  /** The root node of the menu. */
  nodes: INode;

  /** The shortcut to open the menu. */
  shortcut: string;

  /**
   * If true, the menu will open in the screen's center. Else it will open at the mouse
   * pointer.
   */
  centered: boolean;
}

/**
 * This interface describes the content of the menu settings file. It contains the
 * configured menus.
 */
export interface IMenuSettings {
  menus: Array<IMenu>;
}

/**
 * This interface describes the content of the app settings file. It contains the names of
 * the themes to use for the menu and the editor.
 */
export interface IAppSettings {
  /** The name of the theme to use for the menu. */
  menuTheme: string;

  /** The name of the theme to use for the editor. */
  editorTheme: string;

  /** Whether the sidebar should be shown in the editor. */
  sidebarVisible: boolean;
}

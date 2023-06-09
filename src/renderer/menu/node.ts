//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IVec2 } from '../../common';

/**
 * The menu consists of a tree of nodes. Each node represents a menu item. Inner nodes
 * represent submenus, leaf nodes represent actual menu items.
 */
export interface INode {
  /**
   * The name of the menu item. This may be displayed with some kind of label.
   */
  name: string;

  /**
   * The icon of the menu item. For now, this can be one of the material icon names.
   */
  icon: string;

  /**
   * The child nodes of this menu item. If this contains items, the node represents a
   * submenu.
   */
  children: Array<INode>;

  /**
   * The direction of the menu item in degrees. If not set, it will be computed when the
   * menu is opened. If set, it is considered to be a "fixed angle" and all siblings will
   * be distributed more or less evenly around.
   */
  angle?: number;

  /**
   * The beginning of the menu item's angular wedge in degrees. This will be computed and
   * set once the menu is opened.
   */
  startAngle?: number;

  /**
   * The end of the menu item's angular wedge in degrees. This will be computed and set
   * once the menu is opened.
   */
  endAngle?: number;

  /**
   * Once a menu item is selected, it will be drawn at a specific distance from the parent
   * menu. This property stores the relative position of the menu item.
   */
  position?: IVec2;

  /**
   * The visual representation of this menu item. This is a div element which is created
   * when the menu is opened.
   */
  itemDiv?: HTMLElement;

  /**
   * The visual representation of the connector between this menu item and its active
   * child. Only items with child items will have a connector.
   */
  connectorDiv?: HTMLElement;

  /**
   * The rotation of the connectors is transitioned using CSS. In order to avoid 360°
   * flips, we store an accumulated rotation here.
   */
  lastConnectorRotation?: number;
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IVec2, IMenuItem } from '../../common';

/**
 * The menu consists of a tree of menu items. This interface extends the IMenuItem
 * interface with properties which are only used by the Menu class in the renderer
 * process.
 */
export interface IRenderedMenuItem extends IMenuItem {
  /**
   * The chain of indices to get to this menu item. This will be computed and set once the
   * menu is opened. It is stored here to avoid recomputation during emission of events.
   * It will be '/' for the root item and something like '/0/1/2' for a menu item which is
   * the third child of the second child of the first child of the root menu item.
   */
  path?: string;

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
  nodeDiv?: HTMLElement;

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

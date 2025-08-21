//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { Vec2, MenuItem } from '../common';

/**
 * The menu consists of a tree of menu items. This type extends the MenuItem type with
 * properties which are only used by the Menu class in the renderer process.
 */
export type RenderedMenuItem = {
  /**
   * The chain of indices to get to this menu item. This will be computed and set once the
   * menu is opened. It is stored here to avoid recomputation during emission of events.
   * It will be '/' for the root item and something like '/0/1/2' for a menu item which is
   * the third child of the second child of the first child of the root menu item.
   */
  path?: string;

  /**
   * The beginning and end of the menu item's angular wedge in degrees. This will be
   * computed and set once the menu is opened.
   */
  wedge?: {
    start: number;
    end: number;
  };

  /**
   * If the menu item is a submenu and is not the root item (i.e. it has a parent), this
   * property will contain the wedge towards the parent item in degrees.
   */
  parentWedge?: {
    start: number;
    end: number;
  };

  /**
   * Once a menu item is selected, it will be drawn at a specific distance from the parent
   * menu. This property stores the relative position of the menu item.
   */
  position?: Vec2;

  /**
   * The tree of menu items consists of these `nodeDiv`s. The child items of a menu item
   * are directly appended to this div. There are other divs appended to this `nodeDiv`
   * for each layer of the menu theme and for the connector to the active child.
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
  lastConnectorAngle?: number;

  /**
   * The themes get the current angle towards the pointer in degrees. To avoid 360° flips,
   * we store the last angle here.
   */
  lastPointerAngle?: number;

  /**
   * The themes also get the current angle towards the currently hovered child item in
   * degrees. This can also be the angle towards the parent item. To avoid 360° flips, we
   * store the last angle here.
   */
  lastHoveredChildAngle?: number;
} & MenuItem;

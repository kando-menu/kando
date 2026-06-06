//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { Vec2, RootMenuItem, ChildMenuItem, MenuItem, SubmenuMenuItem } from '../common';

/**
 * In the renderer process, we need to store some additional information for each menu
 * item which is only relevant for rendering the menu. Further below, the normal MenuItem
 * types are extended with this additional information to create the RenderedMenuItem
 * types.
 *
 * Most of this information is created when the menu is shown.
 */
type RenderData = {
  /**
   * The chain of indices to get to this menu item. It will be empty for the root item and
   * something like [0, 1, 2] for a menu item which is the third child of the second child
   * of the first child of the root menu item.
   */
  path: number[];

  /** The parent menu item. This will be null for the root item. */
  parent: RenderedRootMenuItem | RenderedSubmenuMenuItem | null;

  /**
   * Once a menu item is selected, it will be drawn at a specific distance from the parent
   * menu. This property stores the relative position of the menu item or the center of
   * the menu item if it is the root item.
   */
  position: Vec2;

  /**
   * The menu item's angle with respect to the parent menu item. Zero means that the menu
   * item is at the top of the parent menu item, 90 means that it is to the right, and so
   * on. Not used for the root item.
   */
  computedAngle: number;

  /**
   * The tree of menu items consists of these `nodeDiv`s. The child items of a menu item
   * are directly appended to this div. There are other divs appended to this `nodeDiv`
   * for each layer of the menu theme and for the connector to the active child.
   */
  nodeDiv: HTMLElement;

  /**
   * The visual representation of the connector between this menu item and its active
   * child. Only items with child items will have a connector.
   */
  connectorDiv: HTMLElement;

  /**
   * The rotation of the connectors is transitioned using CSS. In order to avoid 360°
   * flips, we store an accumulated rotation here.
   */
  lastConnectorAngle: number;

  /**
   * The themes get the current angle towards the pointer in degrees. To avoid 360° flips,
   * we store the last angle here.
   */
  lastPointerAngle: number;

  /**
   * The themes also get the current angle towards the currently hovered child item in
   * degrees. This can also be the angle towards the parent item. To avoid 360° flips, we
   * store the last angle here.
   */
  lastHoveredChildAngle: number;

  /**
   * The beginning and end of the menu item's angular wedge in degrees. This will be
   * computed and set once the menu is opened. Not used for the root item.
   */
  wedge: {
    start: number;
    end: number;
  };

  /**
   * If the menu item is a submenu, this property will contain the wedge towards the
   * parent item in degrees. Not used for the root item.
   */
  parentWedge: {
    start: number;
    end: number;
  };
};

/**
 * This type extends the MenuItem type with properties which are only used by the Menu
 * class in the renderer process.
 */
export type RenderedMenuItem = {
  renderData?: RenderData;
} & MenuItem;

/**
 * This type extends the SubmenuMenuItem type with properties which are only used by the
 * Menu class in the renderer process.
 */
export type RenderedSubmenuMenuItem = {
  renderData?: RenderData;
} & SubmenuMenuItem;

/**
 * This type extends the RootMenuItem type with properties which are only used by the Menu
 * class in the renderer process.
 */
export type RenderedRootMenuItem = {
  renderData?: RenderData;
} & RootMenuItem;

/**
 * This type extends the ChildMenuItem type with properties which are only used by the
 * Menu class in the renderer process.
 */
export type RenderedChildMenuItem = {
  renderData?: RenderData;
} & ChildMenuItem;

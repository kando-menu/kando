//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { INode } from '../../common';

/**
 * The menu consists of a tree of nodes. Each node represents a menu item. Inner nodes
 * represent submenus, leaf nodes represent actual menu items. This interface extends the
 * INode interface with properties which are only used in the menu editor.
 */
export interface IEditorNode extends INode {
  /**
   * The visual representation of this menu item. This is a div element which is created
   * when the editor is opened.
   */
  itemDiv?: HTMLElement;

  /**
   * This specifies the angle at which this node is displayed in the editor. This is
   * computed by the editor and will not be saved. Only the 'angle' property of the INode
   * interface will be saved. The 'angle' property is considered to be a fixed angle and
   * if it is set, the 'computedAngle' will be identical to it.
   */
  computedAngle?: number;
}

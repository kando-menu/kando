//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IconThemeRegistry } from '../../common/icon-theme-registry';
import { IRenderedMenuItem } from './rendered-menu-item';

/**
 * Menu themes in Kando are responsible for rendering the menu items. A theme consists of
 * a JSON5 file, a CSS file, and potentially some assets like fonts or images.
 *
 * The JSON5 file contains a IMenuThemeDescription which defines some meta data and the
 * different layers which are drawn on top of each other for each menu item. Each layer
 * will be a html div element with a class defined in the theme file. Also, each layer can
 * have a `content` property which can be used to make the layer contain the item's icon
 * or name.
 *
 * The CSS file defines the appearance of the different layer divs. Kando assigns a class
 * to menu item's container div based on the current state of the menu item (child,
 * center, parent, hovered, etc). The overall tree structure of the menu may look like
 * this:
 *
 *     #kando-menu
 *     ├ .menu-node.level0.submenu.parent
 *     │  ├ .menu-node.level1.submenu.grandchild
 *     │  │  ├ .menu-node.level2.uri
 *     │  │  └ .menu-node.level2.command
 *     │  ├ .menu-node.level1.submenu.grandchild
 *     │  │  ├ .menu-node.level2.hotkey
 *     │  │  └ .menu-node.level2.macro
 *     │  └ .menu-node.level1.submenu.active
 *     │     ├ .menu-node.level2.child.uri
 *     │     ├ .menu-node.level2.submenu.child.hovered.dragged
 *     │     │  ├ .menu-node.level3.grandchild.command
 *     │     │  └ .menu-node.level3.grandchild.command
 *     │     ├ .menu-node.level2.submenu.child
 *     │     │  ├ .menu-node.level3.grandchild.command
 *     │     │  └ .menu-node.level3.grandchild.command
 *     │     └ .menu-node.level2.child.macro
 *     └ .center-text
 *
 * The menu container contains two elements: The center text and the root item of the
 * menu. The center text shows the name of the currently selected item. It is
 * automatically moved to the currently active menu item. In the above case, the root item
 * contains three submenus. The third child is a submenu which is currently open
 * (.active). Therefore the root item is a parent and the other two children are drawn as
 * grand children. The active child has four children itself, two of which have
 * grandchildren. The second child is currently dragged in marking mode and thus has the
 * classes .hovered and .dragged.
 *
 * In addition, each menu node has a class for the current level (level0, level1, level2,
 * etc). This can be used to style the menu items differently depending on their depth in
 * the menu tree. Only the root item has the class .level0.
 *
 * Furthermore, the menu node classes contain the type of the item (submenu, uri, command,
 * etc). This can be used to style different item types differently.
 *
 * Not depicted in the tree structure above are the connector lines between the menu items
 * and the layers added by the theme. The connector lines are long divs which are appended
 * to each submenu menu node. They have the class .connector and can be styled in the CSS
 * file.
 */

export enum LayerContentType {
  eNone = 'none',
  eIcon = 'icon',
  eName = 'name',
}

interface IMenuThemeDescription {
  name: string;
  author: string;
  themeVersion: string;
  engineVersion: number;
  license: string;
  maxMenuRadius: number;
  drawChildrenBelow: boolean;
  colors: {
    name: string;
    default: string;
  }[];
  layers: {
    class: string;
    content: LayerContentType;
  }[];
}

export class MenuTheme {
  constructor(private description: IMenuThemeDescription) {
    // Remove any old theme first.
    const oldTheme = document.getElementById('kando-menu-theme');
    if (oldTheme) {
      oldTheme.remove();
    }

    // Then add the new theme.
    const head = document.head;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `../assets/menu-themes/default/theme.css`;
    link.type = 'text/css';
    link.id = 'kando-menu-theme';
    head.appendChild(link);

    CSS.registerProperty({
      name: '--angle-diff',
      syntax: '<number>',
      inherits: false,
      initialValue: '0',
    });
  }

  public get maxMenuRadius() {
    return this.description.maxMenuRadius;
  }

  public get drawChildrenBelow() {
    return this.description.drawChildrenBelow;
  }

  public createItem(item: IRenderedMenuItem) {
    const nodeDiv = document.createElement('div');
    nodeDiv.classList.add('menu-node');

    this.description.layers.forEach((layer) => {
      const layerDiv = document.createElement('div');
      layerDiv.classList.add(layer.class);

      if (layer.content === LayerContentType.eName) {
        layerDiv.innerText = item.name;
      } else if (layer.content === LayerContentType.eIcon) {
        const icon = IconThemeRegistry.getInstance()
          .getTheme(item.iconTheme)
          .createDiv(item.icon);
        layerDiv.appendChild(icon);
      }

      nodeDiv.appendChild(layerDiv);
    });

    return nodeDiv;
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IMenuThemeDescription } from '../../common';
import { IconThemeRegistry } from '../../common/icon-theme-registry';
import { IRenderedMenuItem } from './rendered-menu-item';

/**
 * Menu themes in Kando are responsible for rendering the menu items. A theme consists of
 * a JSON file, a CSS file, and potentially some assets like fonts or images.
 *
 * The JSON file contains a IMenuThemeDescription which defines some meta data and the
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
 *     ├ .menu-node.level-0.submenu.parent
 *     │  ├ .menu-node.level-1.submenu.grandchild
 *     │  │  ├ .menu-node.level-2.uri
 *     │  │  └ .menu-node.level-2.command
 *     │  ├ .menu-node.level-1.submenu.grandchild
 *     │  │  ├ .menu-node.level-2.hotkey
 *     │  │  └ .menu-node.level-2.macro
 *     │  └ .menu-node.level-1.submenu.active
 *     │     ├ .menu-node.level-2.child.uri
 *     │     ├ .menu-node.level-2.submenu.child.hovered.dragged
 *     │     │  ├ .menu-node.level-3.grandchild.command
 *     │     │  └ .menu-node.level-3.grandchild.command
 *     │     ├ .menu-node.level-2.submenu.child
 *     │     │  ├ .menu-node.level-3.grandchild.command
 *     │     │  └ .menu-node.level-3.grandchild.command
 *     │     └ .menu-node.level-2.child.macro
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

/**
 * This class is responsible for loading a menu theme and creating the html elements for
 * the menu items.
 */
export class MenuTheme {
  /**
   * The current theme description. When the user changes the theme, this will be updated
   * via the `loadDescription` method.
   */
  private description: IMenuThemeDescription;

  /**
   * Returns the maximum radius in pixels of a menu when using this theme. This is used to
   * move the menu away from the screen edges when it's opened too close to them.
   */
  public get maxMenuRadius() {
    return this.description.maxMenuRadius;
  }

  /**
   * Returns true if children of a menu item should be drawn below the parent. Otherwise
   * they will be drawn above.
   */
  public get drawChildrenBelow() {
    return this.description.drawChildrenBelow;
  }

  /**
   * Loads the given theme description and applies it to the document. This will remove
   * any old theme first and then add the new theme to the document. It will also register
   * the colors defined in the theme description as CSS properties.
   */
  public loadDescription(description: IMenuThemeDescription) {
    this.description = description;

    // Remove any old theme first.
    const oldTheme = document.getElementById('kando-menu-theme');
    if (oldTheme) {
      oldTheme.remove();
    }

    // Then add the new theme.
    const head = document.head;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'file://' + description.cssFile;
    link.type = 'text/css';
    link.id = 'kando-menu-theme';
    head.appendChild(link);

    // Register the angular-difference CSS property. This is set each frame for each child
    // menu item to allow for cool zooming effects.
    CSS.registerProperty({
      name: '--angle-diff',
      syntax: '<number>',
      inherits: false,
      initialValue: '0',
    });

    // Register the colors as CSS properties.
    this.description.colors.forEach((color) => {
      CSS.registerProperty({
        name: `--${color.name}`,
        syntax: '<color>',
        inherits: true,
        initialValue: color.default,
      });
    });
  }

  /**
   * Creates the html elements for the given menu item. This will create a div element
   * with the class `menu-node` and append the layers defined in the theme description to
   * it.
   *
   * @param item The menu item to create the html elements for.
   * @returns The created html element.
   */
  public createItem(item: IRenderedMenuItem) {
    const nodeDiv = document.createElement('div');
    nodeDiv.classList.add('menu-node');

    this.description.layers.forEach((layer) => {
      const layerDiv = document.createElement('div');
      layerDiv.classList.add(layer.class);

      if (layer.content === 'name') {
        layerDiv.innerText = item.name;
      } else if (layer.content === 'icon') {
        const icon = IconThemeRegistry.getInstance()
          .getTheme(item.iconTheme)
          .createDiv(item.icon);
        layerDiv.appendChild(icon);
      }

      nodeDiv.appendChild(layerDiv);
    });

    return nodeDiv;
  }

  /** Sets the colors defined in the theme description as CSS properties. */
  public setColors(colors: Array<{ name: string; color: string }>) {
    colors.forEach((color) => {
      window.api.log(`Setting color ${color.name} to ${color.color}`);
      document.documentElement.style.setProperty(`--${color.name}`, color.color);
    });
  }
}

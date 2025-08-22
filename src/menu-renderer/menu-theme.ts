//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { MenuThemeDescription } from '../common';
import { IconThemeRegistry } from '../common/icon-themes/icon-theme-registry';
import { getClosestEquivalentAngle } from '../common/math';
import { RenderedMenuItem } from './rendered-menu-item';

/**
 * Menu themes in Kando are responsible for rendering the menu items. A theme consists of
 * a JSON file, a CSS file, and potentially some assets like fonts or images.
 *
 * The JSON file contains a MenuThemeDescription which defines some meta data and the
 * different layers which are drawn on top of each other for each menu item. Each layer
 * will be a html div element with a class defined in the theme file. Also, each layer can
 * have a `content` property which can be used to make the layer contain the item's icon
 * or name.
 *
 * The CSS file defines the appearance of the different layer divs. Kando assigns a class
 * to menu item's container div based on the current state of the menu item (child,
 * center, parent, hovered, etc).
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
  private description: MenuThemeDescription;

  /**
   * Creates a new MenuTheme. This will register the custom CSS properties used by the
   * theme.
   */
  constructor() {
    // Register the angular-difference CSS property. This is set each frame for each child
    // menu item to allow for cool zooming effects.
    CSS.registerProperty({
      name: '--angle-diff',
      syntax: '<number>',
      inherits: false,
      initialValue: '0',
    });

    // Register the angle CSS properties. These are set for each layer of the center item
    // to allow for cool effects when the user moves the pointer around. The pointer-angle
    // is the angle towards the mouse pointer, the hover-angle is the angle towards the
    // currently hovered child.

    // This will be set to the angle towards the mouse pointer in degrees, starting at the
    // top with 0° and going clockwise.
    CSS.registerProperty({
      name: '--pointer-angle',
      syntax: '<angle>',
      inherits: false,
      initialValue: '0deg',
    });

    // This will be set to the angle towards the currently hovered item in degrees,
    // starting at the top with 0° and going clockwise. If the center is hovered, this
    // will be the direction towards the parent item (if there is any).
    CSS.registerProperty({
      name: '--hover-angle',
      syntax: '<angle>',
      inherits: false,
      initialValue: '0deg',
    });

    // Same as above, but if the center is hovered, this will not be updated.
    CSS.registerProperty({
      name: '--hovered-child-angle',
      syntax: '<angle>',
      inherits: false,
      initialValue: '0deg',
    });
  }

  /**
   * Returns the maximum radius in pixels of a menu when using this theme. This is used to
   * move the menu away from the screen edges when it's opened too close to them.
   */
  public get maxMenuRadius() {
    return this.description.maxMenuRadius;
  }

  /** Returns the wrap-width of the center text. */
  public get centerTextWrapWidth() {
    return this.description.centerTextWrapWidth;
  }

  /**
   * Returns true if children of a menu item should be drawn below the parent. Otherwise
   * they will be drawn above.
   */
  public get drawChildrenBelow() {
    return this.description.drawChildrenBelow;
  }

  /** Returns true if the center text of the menu should be drawn. */
  public get drawCenterText() {
    return this.description.drawCenterText;
  }

  /** Returns true if the selection wedges should be visualized for this theme. */
  public get drawSelectionWedges() {
    return this.description.drawSelectionWedges;
  }

  /**
   * Returns true if the separator lines between selection wedges should be visualized for
   * this theme.
   */
  public get drawWedgeSeparators() {
    return this.description.drawWedgeSeparators;
  }

  /**
   * Loads the given theme description and applies it to the document. This will remove
   * any old theme first and then add the new theme to the document. It will also register
   * the colors defined in the theme description as CSS properties.
   */
  public loadDescription(description: MenuThemeDescription) {
    this.description = description;

    // Use defaults if some properties are not set.
    this.description.maxMenuRadius = this.description.maxMenuRadius || 150;
    this.description.centerTextWrapWidth = this.description.centerTextWrapWidth || 90;
    this.description.drawChildrenBelow = this.description.drawChildrenBelow ?? true;
    this.description.drawCenterText = this.description.drawCenterText ?? true;
    this.description.drawSelectionWedges = this.description.drawSelectionWedges ?? false;
    this.description.drawWedgeSeparators = this.description.drawWedgeSeparators ?? false;

    // Remove any old theme first.
    const oldTheme = document.getElementById('kando-menu-theme');
    if (oldTheme) {
      oldTheme.remove();
    }

    // Then add the new theme.
    const head = document.head;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'file://' + description.directory + '/' + description.id + '/theme.css';
    link.type = 'text/css';
    link.id = 'kando-menu-theme';
    head.appendChild(link);

    // Register the colors as CSS properties.
    Object.entries(this.description.colors).forEach(([name, color]) => {
      // Try to register the property. If this fails, we had registered it before and
      // can just set the value.
      try {
        CSS.registerProperty({
          name: `--${name}`,
          syntax: '<color>',
          inherits: true,
          initialValue: color,
        });
      } catch (e) {
        document.documentElement.style.setProperty(`--${name}`, color);
      }
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
  public createItem(item: RenderedMenuItem) {
    const nodeDiv = document.createElement('div');
    nodeDiv.classList.add('menu-node');

    // Add name property to the nodeDiv so that themes can style the items based on their
    // name.
    nodeDiv.dataset.name = item.name;

    // Iterate over the layers back to front to get the right stacking order.
    for (let i = this.description.layers.length - 1; i >= 0; i--) {
      const layer = this.description.layers[i];
      const layerDiv = document.createElement('div');
      layerDiv.classList.add(layer.class);

      if (layer.content === 'name') {
        layerDiv.innerText = item.name;
      } else if (layer.content === 'icon') {
        const icon = IconThemeRegistry.getInstance().createIcon(
          item.iconTheme,
          item.icon
        );
        layerDiv.appendChild(icon);
      }

      nodeDiv.appendChild(layerDiv);
    }

    return nodeDiv;
  }

  /** Sets the colors defined in the theme description as CSS properties. */
  public setColors(colors: Record<string, string>) {
    Object.entries(colors).forEach(([name, color]) => {
      document.documentElement.style.setProperty(`--${name}`, color);
    });
  }

  /**
   * Sets the custom CSS properties for the given child menu item. Currently, this is only
   * the `--angle-diff` property which is set to the angular difference between the child
   * and the pointer.
   *
   * @param item The menu item to set the properties for.
   * @param pointerAngle The angle towards the pointer.
   */
  public setChildProperties(item: RenderedMenuItem, pointerAngle: number) {
    let angleDiff = Math.abs(item.angle - pointerAngle) % 360;
    angleDiff = Math.min(angleDiff, 360 - angleDiff);
    item.nodeDiv.style.setProperty('--angle-diff', angleDiff.toString());
  }

  /**
   * Sets the custom CSS angle properties for the given center menu item.
   *
   * @param item The menu item to set the properties for.
   * @param pointerAngle The angle towards the pointer.
   * @param hoverAngle The angle towards the currently hovered child.
   * @param parentHovered True if the parent item is hovered.
   */
  public setCenterProperties(
    item: RenderedMenuItem,
    pointerAngle: number,
    hoverAngle: number,
    parentHovered: boolean
  ) {
    hoverAngle = getClosestEquivalentAngle(hoverAngle, item.lastHoveredChildAngle);
    pointerAngle = getClosestEquivalentAngle(pointerAngle, item.lastPointerAngle);

    // If both angles are set, we want to make sure that they are not 360° apart. This
    // ensures that themes can use both and transition between them smoothly.
    if (pointerAngle != null && hoverAngle != null) {
      hoverAngle = getClosestEquivalentAngle(hoverAngle, pointerAngle);
    }

    this.description.layers.forEach((layer) => {
      const div = item.nodeDiv.querySelector(`:scope > .${layer.class}`) as HTMLElement;

      // Sanity check.
      if (!div) {
        return;
      }

      if (pointerAngle != null) {
        div.style.setProperty('--pointer-angle', pointerAngle + 'deg');
      }

      if (hoverAngle != null) {
        div.style.setProperty('--hover-angle', hoverAngle + 'deg');

        if (!parentHovered) {
          div.style.setProperty('--hovered-child-angle', hoverAngle + 'deg');
        }
      }
    });

    if (pointerAngle != null) {
      item.lastPointerAngle = pointerAngle;
    }

    if (hoverAngle != null) {
      item.lastHoveredChildAngle = hoverAngle;
    }
  }
}

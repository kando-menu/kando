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
 * The JSON5 file defines some meta data and the different layers which are drawn on top
 * of each other for each menu item. Each layer is a div element with a class defined in
 * the theme file.
 *
 * The CSS file defines the appearance of the different layers. Kando assigns a class to
 * menu item's container div based on the current state of the menu item (child, center,
 * parent, hovered, etc).
 *
 * In the JSON5 file, each layer can get a `content` property which can be used to make
 * the layer contain the item's icon or name.
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
  css: string;
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
  constructor(private description: IMenuThemeDescription) {}

  public get centerRadius() {
    return 50;
  }

  public get childDistance() {
    return 100;
  }

  public get parentDistance() {
    return 150;
  }

  public get grandChildDistance() {
    return 25;
  }

  public get drawChildrenBelow() {
    return this.description.drawChildrenBelow;
  }

  public createItem(item: IRenderedMenuItem) {
    const nodeDiv = document.createElement('div');
    const menuItem = document.createElement('div');
    const icon = IconThemeRegistry.getInstance()
      .getTheme(item.iconTheme)
      .createDiv(item.icon);

    nodeDiv.classList.add('menu-node');
    menuItem.classList.add('menu-item');

    nodeDiv.appendChild(menuItem);
    menuItem.appendChild(icon);

    return nodeDiv;
  }
}

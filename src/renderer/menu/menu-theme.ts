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

export class MenuTheme {
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

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ToolbarDraggable } from './toolbar-draggable';
import { ItemTypeRegistry } from '../../../common/item-type-registry';
import { IconThemeRegistry } from '../../icon-themes/icon-theme-registry';
import { DnDManager } from '../common/dnd-manager';
import { IMenuItem } from '../../../common';

/**
 * This class represents the add-new-item tab in the toolbar. Users can drag new things
 * from here to the menu preview.
 */
export class AddItemsTab {
  /**
   * This constructor is called after the general toolbar DOM has been created.
   *
   * @param container The container is the HTML element which contains the entire toolbar.
   * @param dndManager This is used to manage drag'n'drop operations.
   */
  constructor(container: HTMLElement, dndManager: DnDManager) {
    // Compile the data for the Handlebars template. We add an entry for each item type.
    const data: Array<{
      name: string;
      description: string;
      icon: string;
      typeName: string;
    }> = [];

    const registry = ItemTypeRegistry.getInstance();
    registry.getAllTypes().forEach((type, typeName) => {
      data.push({
        name: type.defaultName,
        description: type.genericDescription,
        icon: IconThemeRegistry.getInstance().createIcon(
          type.defaultIconTheme,
          type.defaultIcon
        ).outerHTML,
        typeName,
      });
    });

    // Update the tab's content.
    const tab = container.querySelector('#kando-add-items-tab');
    const template = require('./templates/add-items-tab.hbs');
    tab.innerHTML = template({
      items: data,
    });

    // Add drag'n'drop logic to the buttons. Whenever a button is dropped somewhere, a new
    // item of the corresponding type is created.
    for (const item of data) {
      const div = tab.querySelector(`#new-item-${item.typeName}`) as HTMLElement;

      // We use the "ghost mode" of the ToolbarDraggable class. This way, a
      // semitransparent copy of the button stays at the original position while the user
      // drags it around. This emphasizes the affordance that the item is not dragged out
      // of the toolbar but copied to the menu preview.
      const draggable = new ToolbarDraggable(div, 'menu-item', true, () => {
        const type = registry.getType(item.typeName);
        const newItem: IMenuItem = {
          type: item.typeName,
          data: type.defaultData,
          name: type.defaultName,
          icon: type.defaultIcon,
          iconTheme: type.defaultIconTheme,
        };

        if (type.hasChildren) {
          newItem.children = [];
        }

        return newItem;
      });

      dndManager.registerDraggable(draggable);
    }
  }
}

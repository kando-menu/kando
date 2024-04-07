//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import Handlebars from 'handlebars';
import { ToolbarItemDragger } from '../common/toolbar-item-dragger';
import { EventEmitter } from 'events';
import { IMenu } from '../../../common';
import * as themedIcon from '../common/themed-icon';
import { IEditorNode } from '../common/editor-node';

/**
 * This class represents the trash tab in the toolbar. Users can drop menus and menu items
 * here to delete them. Dropped items are stored in the trash until the user restarts the
 * application.
 *
 * TODO: Deletion of menu items from the preview is not yet implemented.
 */
export class TrashTab extends EventEmitter {
  /** The container is the HTML element which contains the entire toolbar. */
  private container: HTMLElement = null;

  /** This is the HTML element which contains the trash tab's content. */
  private tab: HTMLElement = null;

  /**
   * This is used to drag'n'drop menus from the trash to the menus tab or to the menu
   * preview.
   */
  private dragger: ToolbarItemDragger<number> = null;

  /**
   * This constructor is called after the general toolbar DOM has been created.
   *
   * @param container The container is the HTML element which contains the entire toolbar.
   */
  constructor(container: HTMLElement) {
    super();

    // Store a reference to the container. We will attach menu buttons divs to it during
    // drag'n'drop operations.
    this.container = container;

    // Initialize the dragger. During the drag operation, the container will get the given
    // class name. This is used to highlight to the menus tab. When an item is dropped to
    // the menus tab, we emit the 'restore-menu' event.
    this.dragger = new ToolbarItemDragger(container, 'dragging-menu-item', [
      this.container.querySelector(".nav-link[data-bs-target='#kando-menus-tab']"),
    ]);
    this.dragger.on('drop', (index) => this.emit('restore-menu', index));

    // The tab has been created in the toolbar's constructor.
    this.tab = this.container.querySelector('#kando-trash-tab');

    // Initialize the trash tab with an empty list of trashed items.
    this.setTrashedItems([]);
  }

  /**
   * This method is called when the user drops a menu or a menu item on the trash tab. It
   * completely updates the trash tab's content.
   *
   * @param items The items which are currently in the trash.
   */
  public setTrashedItems(items: Array<IMenu | IEditorNode>) {
    this.dragger.removeAllDraggables();

    const template = Handlebars.compile(require('./templates/trash-tab.hbs').default);

    // Compile the data for the Handlebars template.
    const data = items.map((item, index) => {
      const menu = item as IMenu;

      // If the item is a menu, we need to extract the name, the shortcut and the icon.
      if (menu.nodes) {
        return {
          isMenu: true,
          name: menu.nodes.name,
          shortcut: menu.shortcut || 'Not bound',
          icon: themedIcon.createDiv(menu.nodes.icon, menu.nodes.iconTheme).outerHTML,
          index,
        };
      }

      // If the item is a menu node, we need to extract the name and the icon.
      const node = item as IEditorNode;
      return {
        isMenu: false,
        name: node.name,
        icon: themedIcon.createDiv(node.icon, node.iconTheme).outerHTML,
        index,
      };
    });

    // Update the tab's content.
    this.tab.innerHTML = template({
      placeholderHeading: 'You can delete menus and menu items by dropping them here!',
      placeholderSubheading: 'When you start Kando the next time, they will be gone.',
      items: data,
    });

    // Add drag'n'drop logic to the menu buttons.
    for (const item of data) {
      const div = document.getElementById(`trash-item-${item.index}`);
      this.dragger.addDraggable(div, item.index);
    }

    // Set the counter value.
    const counter = this.container.querySelector('#kando-trash-tab-counter');
    counter.textContent = items.length.toString();
  }
}
//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import Handlebars from 'handlebars';
import { ItemDragger } from '../common/item-dragger';
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
  private itemDragger = new ItemDragger();

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

    // The tab has been created in the toolbar's constructor.
    this.tab = this.container.querySelector('#kando-trash-tab');

    // During drag'n'drop operations, we need to append the dragged div to the outer
    // container to be able to drag it outside of the scrollable area. Here we set up
    // the drag'n'drop logic.

    let originalParent: HTMLElement;

    this.itemDragger.on('drag-start', (index, div) => {
      // Add a class to the toolbar area to indicate that we are dragging a deletable
      // item. This will make the trash tab more visible.
      document
        .getElementById('kando-editor-toolbar-area')
        .classList.add('dragging-menu-item');

      // Set fixed width and height for dragged item.
      const rect = div.getBoundingClientRect();
      div.style.width = `${rect.width}px`;
      div.style.height = `${rect.height}px`;

      // Remember the original parent so that we can reinsert the div later.
      originalParent = div.parentNode;

      // Append the div to the outer container. This is necessary because the div is
      // inside a scrollable container and we want to be able to drag it outside.
      div.classList.add('dragging');
      this.container.appendChild(div);
    });

    this.itemDragger.on(
      'drag-move',
      (index, div, relative, absolute, offset, grabOffset) => {
        div.style.transform = `translate(${absolute.x - grabOffset.x}px, ${absolute.y - grabOffset.y}px)`;
      }
    );

    // If the drag is canceled or ends, we need to clean up.
    const onDragEnd = (index: number, div: HTMLElement) => {
      div.classList.remove('dragging');
      div.style.transform = '';

      // Clear the fixed width and height.
      div.style.width = '';
      div.style.height = '';

      // Reinsert the div back to its original position.
      originalParent.appendChild(div);

      document
        .getElementById('kando-editor-toolbar-area')
        .classList.remove('dragging-menu-item');
    };

    this.itemDragger.on('drag-cancel', onDragEnd);

    // If the drag ends successfully, we emit the 'restore-menu' event if the menus tab is
    // hovered.
    this.itemDragger.on('drag-end', (index, div) => {
      onDragEnd(index, div);

      // Check if the menus tab is hovered.
      const tab = this.container.querySelector(
        ".nav-link[data-bs-target='#kando-menus-tab']"
      );

      // If so, we emit a 'restore-menu' event. This event is handled by the toolbar
      // which will restore the menu.
      if (tab.matches(':hover')) {
        this.emit('restore-menu', index);
      }
    });

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
    this.itemDragger.removeAllDraggables();

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
      this.itemDragger.addDraggable(div, item.index);
    }

    // Set the counter value.
    const counter = this.container.querySelector('#kando-trash-tab-counter');
    counter.textContent = items.length.toString();
  }
}

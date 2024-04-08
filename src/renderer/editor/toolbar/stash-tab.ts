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
import * as themedIcon from '../common/themed-icon';
import { IEditorNode } from '../common/editor-node';

/**
 * This class represents the stash tab in the toolbar. Users can drop menu items here to
 * stash them for later use.
 */
export class StashTab extends EventEmitter {
  /** The container is the HTML element which contains the entire toolbar. */
  private container: HTMLElement = null;

  /** This is the HTML element which contains the stash tab's content. */
  private tab: HTMLElement = null;

  /**
   * This is used to drag'n'drop menus from the stash to the trash tab or the menus
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
      this.container.querySelector(".nav-link[data-bs-target='#kando-trash-tab']"),
    ]);
    this.dragger.on('drop', (index) => this.emit('restore-item', index));

    // The tab has been created in the toolbar's constructor.
    this.tab = this.container.querySelector('#kando-stash-tab');

    // Initialize the trash tab with an empty list of trashed items.
    this.setStashedItems([]);
  }

  /**
   * This method is called when the user drops a menu or a menu item on the trash tab. It
   * completely updates the trash tab's content.
   *
   * @param items The items which are currently in the trash.
   */
  public setStashedItems(items: Array<IEditorNode>) {
    this.dragger.removeAllDraggables();

    const template = Handlebars.compile(
      require('./templates/stash-trash-tab.hbs').default
    );

    // Compile the data for the Handlebars template.
    const data = items.map((item, index) => {
      return {
        isMenu: false,
        name: item.name,
        icon: themedIcon.createDiv(item.icon, item.iconTheme).outerHTML,
        index,
      };
    });

    // Update the tab's content.
    this.tab.innerHTML = template({
      type: 'stash',
      placeholderHeading: 'You can temporarily store menu items here!',
      placeholderSubheading:
        'This is especially useful if you want to reorganize your menus.',
      items: data,
    });

    // Add drag'n'drop logic to the menu buttons.
    for (const item of data) {
      const div = document.getElementById(`stash-item-${item.index}`);
      this.dragger.addDraggable(div, item.index);
    }

    // Set the counter value.
    const counter = this.container.querySelector('#kando-stash-tab-counter');
    counter.textContent = items.length.toString();
  }
}

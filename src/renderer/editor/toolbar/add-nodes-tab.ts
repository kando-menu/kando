//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import Handlebars from 'handlebars';
import { ToolbarItemDragger } from './toolbar-item-dragger';
import { NodeTypeRegistry } from '../../../common/node-type-registry';
import { EventEmitter } from 'events';
import * as themedIcon from '../common/themed-icon';

/**
 * This class represents the add-new-item tab in the toolbar. Users can drag new things
 * from here to the menu preview. The class is an event emitter which emits the following
 * events:
 *
 * @fires add-item - This event is emitted when the user drags a menu item from the tab to
 *   the menu preview. The index of the newly added item type is passed as the first
 *   argument.
 */
export class AddNodesTab extends EventEmitter {
  /** The container is the HTML element which contains the entire toolbar. */
  private container: HTMLElement = null;

  /** This is the HTML element which contains the stash tab's content. */
  private tab: HTMLElement = null;

  /**
   * This is used to drag'n'drop menus from the stash to the trash tab or the menus
   * preview.
   */
  private dragger: ToolbarItemDragger = null;

  /**
   * These are all potential drop targets for dragged menu items. Menu items can be
   * dropped to the trash tab or to the menu preview.
   */
  private preview: HTMLElement = null;

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

    // Store a reference to the preview as potential drop target.
    this.preview = document.querySelector('#kando-menu-preview-area') as HTMLElement;

    // Initialize the dragger. This will be used to make the item buttons draggable.
    this.dragger = new ToolbarItemDragger();
    this.dragger.on('drop', (index) => {
      this.emit('add-item', index);
    });

    // The tab has been created in the toolbar's constructor.
    this.tab = this.container.querySelector('#kando-add-nodes-tab');

    // Initialize the stash tab with an empty list of items.
    this.loadTypes();
  }

  /** This method is called by the constructor and initializes the tab's content. */
  public loadTypes() {
    this.dragger.removeAllDraggables();

    const template = Handlebars.compile(require('./templates/add-nodes-tab.hbs').default);

    const registry = NodeTypeRegistry.getInstance();

    // Compile the data for the Handlebars template.
    const data = registry.getTypes().map((type, index) => {
      return {
        name: type.defaultName,
        description: type.genericDescription,
        icon: themedIcon.createDiv(type.defaultIcon, type.defaultIconTheme).outerHTML,
        index,
      };
    });

    // Update the tab's content.
    this.tab.innerHTML = template({
      items: data,
    });

    // Add drag'n'drop logic to the  buttons. The menu items can be dragged to the menu
    // preview.
    for (const item of data) {
      const div = this.tab.querySelector(`#new-node-${item.index}`) as HTMLElement;
      this.dragger.addDraggable(div, {
        index: item.index,
        ghostMode: true,
        dragClass: 'dragging-new-item-from-toolbar',
        dropTargets: [this.preview],
      });
    }
  }
}

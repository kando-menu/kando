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
import { ItemFactory } from '../../../common/item-factory';
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
export class AddItemsTab extends EventEmitter {
  /** The container is the HTML element which contains the entire toolbar. */
  private container: HTMLElement = null;

  /** This is the HTML element which contains the tab's content. */
  private tab: HTMLElement = null;

  /**
   * This is used to drag'n'drop new menu items from the tab or the menu preview. The
   * template parameter is the type name of the dragged item.
   */
  private dragger: ToolbarItemDragger<string> = null;

  /** We store a reference to the preview as potential drop target. */
  private preview: HTMLElement = null;

  /**
   * This constructor is called after the general toolbar DOM has been created.
   *
   * @param container The container is the HTML element which contains the entire toolbar.
   */
  constructor(container: HTMLElement) {
    super();

    // Store a reference to the container. We will attach divs to it during
    // drag'n'drop operations.
    this.container = container;

    // Store a reference to the preview as potential drop target.
    this.preview = document.querySelector('#kando-menu-preview-area') as HTMLElement;

    // Initialize the dragger. This will be used to make the item buttons draggable.
    this.dragger = new ToolbarItemDragger();
    this.dragger.on('drop', (typeName) => {
      this.emit('add-item', typeName);
    });

    // The tab has been created in the toolbar's constructor.
    this.tab = this.container.querySelector('#kando-add-items-tab');

    // Initialize the stash tab with an empty list of items.
    this.loadTypes();
  }

  /** This method is called by the constructor and initializes the tab's content. */
  public loadTypes() {
    this.dragger.removeAllDraggables();

    const template = Handlebars.compile(require('./templates/add-items-tab.hbs').default);

    const registry = ItemFactory.getInstance();

    // Compile the data for the Handlebars template.
    const data: Array<{
      name: string;
      description: string;
      icon: string;
      typeName: string;
    }> = [];

    registry.getAllTypes().forEach((meta, typeName) => {
      data.push({
        name: meta.defaultName,
        description: meta.genericDescription,
        icon: themedIcon.createDiv(meta.defaultIcon, meta.defaultIconTheme).outerHTML,
        typeName,
      });
    });

    // Update the tab's content.
    this.tab.innerHTML = template({
      items: data,
    });

    // Add drag'n'drop logic to the  buttons. The menu items can be dragged to the menu
    // preview.
    for (const item of data) {
      const div = this.tab.querySelector(`#new-item-${item.typeName}`) as HTMLElement;
      this.dragger.addDraggable(div, {
        data: item.typeName,
        ghostMode: true,
        dragClass: 'dragging-new-item-from-toolbar',
        dropTargets: [this.preview],
      });
    }
  }
}

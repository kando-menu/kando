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
import { EventEmitter } from 'events';
import * as themedIcon from '../common/themed-icon';
import { IEditorNode } from '../common/editor-node';
import { NodeTypeRegistry } from '../../../common/node-type-registry';

/**
 * This class represents the stash tab in the toolbar. Users can drop menu items here to
 * stash them for later use. The class is an event emitter which emits the following
 * events:
 *
 * @fires restore-item - This event is emitted when the user drags a menu item from the
 *   stash tab to the preview area. The index of the restored item is passed as the first
 *   argument.
 * @fires delete-item - This event is emitted when the user drags a menu item from the
 *   stash tab to the trash tab. The index of the deleted item is passed as the first
 *   argument.
 */
export class StashTab extends EventEmitter {
  /** The container is the HTML element which contains the entire toolbar. */
  private container: HTMLElement = null;

  /** This is the HTML element which contains the stash tab's content. */
  private tab: HTMLElement = null;

  /**
   * This is used to drag'n'drop menus from the stash to the trash tab or the menus
   * preview. The template argument is a number since the index of the dragged item is
   * stored of in the data field.
   */
  private dragger: ToolbarItemDragger<number> = null;

  /**
   * These are all potential drop targets for dragged menu items. Menu items can be
   * dropped to the trash tab or to the menu preview.
   */
  private trashTab: HTMLElement = null;
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

    // Store a reference to the potential drop targets.
    this.trashTab = this.container.querySelector(
      ".nav-link[data-bs-target='#kando-trash-tab']"
    ) as HTMLElement;

    this.preview = document.querySelector('#kando-menu-preview-area') as HTMLElement;

    // Initialize the dragger. This will be used to make the item buttons draggable. When
    // a menu item is dropped to the trash tab, we emit the 'delete-item' event. If a menu
    // item is dropped to the preview area, we emit the 'restore-item' event.
    this.dragger = new ToolbarItemDragger();
    this.dragger.on('drop', (index, dropTarget) => {
      if (dropTarget === this.preview) {
        this.emit('restore-item', index);
      } else {
        this.emit('delete-item', index);
      }
    });

    // The tab has been created in the toolbar's constructor.
    this.tab = this.container.querySelector('#kando-stash-tab');

    // Initialize the stash tab with an empty list of items.
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
      const type = NodeTypeRegistry.getInstance().getType(item.type);
      return {
        isMenu: false,
        name: item.name,
        description: type.getDescription(item),
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

    // Add drag'n'drop logic to the menu buttons. The menu items can be dragged to the
    // trash tab or to the menu preview.
    for (const item of data) {
      const div = document.getElementById(`stash-item-${item.index}`);
      this.dragger.addDraggable(div, {
        data: item.index,
        ghostMode: false,
        dragClass: 'dragging-item-from-stash-tab',
        dropTargets: [this.trashTab, this.preview],
      });
    }

    // Set the counter value.
    const counter = this.container.querySelector('#kando-stash-tab-counter');
    counter.textContent = items.length.toString();
  }
}

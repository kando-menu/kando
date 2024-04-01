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

/**
 * This class is responsible for the menus tab in the toolbar. It is an event emitter
 * which emits the following events:
 *
 * - 'select-menu': This event is emitted when the user selects a menu in the toolbar. The
 *   index of the selected menu is passed as the first argument.
 * - 'add-menu': This event is emitted when the user clicks the "Add Menu" button.
 * - 'delete-menu': This event is emitted when the user drags a menu to the trash tab.
 */
export class MenusTab extends EventEmitter {
  /** The container is the HTML element which contains the entire toolbar. */
  private container: HTMLElement = null;

  /** This is the HTML element which contains the menus tab's content. */
  private tab: HTMLElement = null;

  /** This is used to drag'n'drop menus from the toolbar to the trash. */
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
    this.tab = this.container.querySelector('#kando-menus-tab');

    // If a menu button is clicked, we emit the 'select-menu' event. If the "Add Menu"
    // button is clicked, we emit the 'add-menu' event.
    this.tab.addEventListener('click', (event) => {
      const input = event.target as HTMLInputElement;
      if (input && input.name === 'menu-selection-button') {
        this.emit('select-menu', input.dataset.index);
      }

      const button = event.target as HTMLButtonElement;
      if (button && button.classList.contains('add-menu-button')) {
        this.emit('add-menu');
      }
    });

    // During drag'n'drop operations, we need to append the dragged div to the outer
    // container to be able to drag it outside of the scrollable area. Here we set up
    // the drag'n'drop logic.

    let originalParent: HTMLElement;

    this.itemDragger.on('drag-start', (index, div) => {
      // Add a class to the toolbar area to indicate that we are dragging a deletable
      // item. This will make the trash tab more visible.
      document
        .getElementById('kando-editor-toolbar-area')
        .classList.add('dragging-deletable-item');

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
        .classList.remove('dragging-deletable-item');
    };

    this.itemDragger.on('drag-cancel', onDragEnd);

    // If the drag ends successfully, we emit the 'delete-menu' event if the trash tab is
    // hovered.
    this.itemDragger.on('drag-end', (index, div) => {
      onDragEnd(index, div);

      // Check if the trash tab is hovered.
      const tab = this.container.querySelector(
        ".nav-link[data-bs-target='#kando-trash-tab']"
      );

      if (tab.matches(':hover')) {
        this.emit('delete-menu', index);
      }
    });
  }

  /**
   * This method is called by the toolbar whenever the list of menus changes. It
   * completely rebuilds the menus tab.
   *
   * @param menus A list of menus.
   * @param currentMenu The index of the currently selected menu.
   */
  public setMenus(menus: Array<IMenu>, currentMenu: number) {
    this.itemDragger.removeAllDraggables();

    const template = Handlebars.compile(require('./templates/menus-tab.hbs').default);

    // Compile the data for the Handlebars template.
    const data = menus.map((menu, index) => ({
      name: menu.nodes.name,
      active: index === currentMenu,
      shortcut: menu.shortcut || 'Not bound',
      icon: themedIcon.createDiv(menu.nodes.icon, menu.nodes.iconTheme).outerHTML,
      index,
    }));

    this.tab.innerHTML = template({ menus: data });

    // Add drag'n'drop logic to the menu buttons.
    for (const menu of data) {
      const div = document.getElementById(`menu-button-${menu.index}`);
      this.itemDragger.addDraggable(div, menu.index);
    }
  }
}

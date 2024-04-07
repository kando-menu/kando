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
    // class name. This is used to highlight to the trash tab. When an item is dropped to
    // the trash tab, we emit the 'delete-menu' event.
    this.dragger = new ToolbarItemDragger(container, 'dragging-deletable-item', [
      this.container.querySelector(".nav-link[data-bs-target='#kando-trash-tab']"),
    ]);
    this.dragger.on('drop', (index) => this.emit('delete-menu', index));

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
  }

  /**
   * This method is called by the toolbar whenever the list of menus changes. It
   * completely rebuilds the menus tab.
   *
   * @param menus A list of menus.
   * @param currentMenu The index of the currently selected menu.
   */
  public setMenus(menus: Array<IMenu>, currentMenu: number) {
    this.dragger.removeAllDraggables();

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
      this.dragger.addDraggable(div, menu.index);
    }
  }
}

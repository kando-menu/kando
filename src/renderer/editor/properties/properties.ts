//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';
import Handlebars from 'handlebars';

import { IEditorMenuItem } from '../common/editor-menu-item';
import { IMenu } from '../../../common';
import { IconPicker } from './icon-picker';
import { IconThemeRegistry } from '../../../common/icon-theme-registry';

/**
 * This class is responsible for displaying the properties of the currently edited menu
 * item. It emits events when the user changes one of the properties of the currently
 * edited menu item. The new values are stored in the menu item object before the
 * corresponding event is emitted, so you can access the new values by accessing the
 * properties of the menu item object. It is an event emitter which emits the following
 * events:
 *
 * @fires changed-name - When the user changed the name of the current menu item.
 * @fires changed-icon - When the user changed the icon of the current menu item.
 * @fires changed-icon-theme - When the user changed the theme of the current menu item.
 */
export class Properties extends EventEmitter {
  // The container is the HTML element which contains the currently edited menu's
  // properties. It is created in the constructor and returned by the getContainer()
  // method.
  private container: HTMLElement = null;

  private iconPicker: IconPicker = null;

  private nameInput: HTMLInputElement = null;
  private iconButton: HTMLButtonElement = null;

  private activeItem: IEditorMenuItem = null;

  /**
   * This constructor creates the HTML elements for the menu properties view and wires up
   * all the functionality.
   */
  constructor() {
    super();

    const template = Handlebars.compile(require('./templates/properties.hbs').default);

    const div = document.createElement('div');
    div.innerHTML = template({
      areaId: 'kando-menu-properties-area',
    });

    this.nameInput = div.querySelector('#kando-menu-properties-name') as HTMLInputElement;
    this.nameInput.addEventListener('input', () => {
      if (this.activeItem) {
        this.activeItem.name = this.nameInput.value;
        this.emit('changed-name');
      }
    });

    this.iconButton = div.querySelector(
      '#kando-menu-properties-icon-button'
    ) as HTMLButtonElement;

    this.container = div.firstElementChild as HTMLElement;

    this.iconPicker = new IconPicker(
      div.querySelector('#kando-menu-properties-icon-picker')
    );
    this.iconPicker.on('changed-icon', (icon) => {
      if (this.activeItem) {
        this.activeItem.icon = icon;
        this.emit('changed-icon');
      }
    });
    this.iconPicker.on('changed-icon-theme', (iconTheme) => {
      if (this.activeItem) {
        this.activeItem.iconTheme = iconTheme;
        this.emit('changed-icon-theme');
      }
    });
  }

  /** This method returns the container of the menu preview. */
  public getContainer(): HTMLElement {
    return this.container;
  }

  public show() {
    this.container.classList.add('visible');
  }

  public hide() {
    this.container.classList.remove('visible');
  }

  public setMenu(menu: IMenu) {
    this.setItem(menu.nodes);
  }

  public setItem(item: IEditorMenuItem) {
    this.activeItem = item;
    this.nameInput.value = item.name;
    this.iconButton.innerHTML = IconThemeRegistry.getInstance()
      .getTheme(item.iconTheme)
      .createDiv(item.icon).outerHTML;

    this.iconPicker.selectIcon(item.icon, item.iconTheme);
  }
}

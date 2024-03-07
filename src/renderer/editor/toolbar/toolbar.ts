//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import Handlebars from 'handlebars';
import { EventEmitter } from 'events';
import { IMenu } from '../../../common';

/**
 * This class is responsible for the toolbar on the bottom of the editor screen. It is an
 * event emitter which emits the following events:
 *
 * - 'enter-edit-mode': This event is emitted when the user enters edit mode.
 * - 'leave-edit-mode': This event is emitted when the user leaves edit mode.
 */
export class Toolbar extends EventEmitter {
  /**
   * The container is the HTML element which contains the toolbar. It is created in the
   * constructor and returned by the getContainer() method.
   */
  private container: HTMLElement = null;

  /**
   * This constructor creates the HTML elements for the toolbar and wires up all the
   * functionality.
   */
  constructor() {
    super();

    this.loadContent();
    this.initVisibility();
    this.initTabs();
  }

  /** This method returns the container of the editor toolbar. */
  public getContainer(): HTMLElement {
    return this.container;
  }

  public setMenus(menus: Array<IMenu>, currentMenu: number) {
    window.api.log('Toolbar.setMenus ' + menus.length + ' ' + currentMenu);

    const menuTab = this.container.querySelector('#kando-menus-tab');

    const button = Handlebars.compile(require('./templates/menu-button.hbs').default);
  }

  /** This method loads the HTML content of the toolbar. */
  private loadContent() {
    const emptyTab = Handlebars.compile(require('./templates/empty-tab.hbs').default);
    const menusTab = Handlebars.compile(require('./templates/menus-tab.hbs').default);
    const toolbar = Handlebars.compile(require('./templates/toolbar.hbs').default);

    this.container = document.createElement('div');
    this.container.innerHTML = toolbar({
      tabs: [
        {
          id: 'kando-menus-tab',
          icon: 'apps',
          title: 'Menus',
          active: true,
          content: menusTab({}),
        },
        {
          id: 'kando-add-items-tab',
          icon: 'add',
          title: 'Menu Items',
          content: emptyTab({
            heading: 'Here will be a list of things which you can add to your menus!',
            subheading: 'In the future, you can simply drag them to the editor above.',
          }),
        },
        {
          id: 'kando-stash-tab',
          icon: 'content_paste',
          title: 'Stash',
          hasCounter: true,
          content: emptyTab({
            heading: 'In the future, you can temporarily store menu items here!',
            subheading: 'This is especially useful if you want to reorganize your menus.',
          }),
        },
        {
          id: 'kando-trash-tab',
          icon: 'delete',
          title: 'Trash',
          hasCounter: true,
          content: emptyTab({
            heading: 'In the future, you can delete items by dropping them here!',
            subheading: 'When you start Kando the next time, they will be gone.',
          }),
        },
        {
          id: 'kando-menu-themes-tab',
          icon: 'palette',
          title: 'Menu Themes',
          gapBefore: true,
          content: emptyTab({
            heading: 'Here will be a list of available menu themes!',
            subheading:
              'There will be preview images and the possibility to download new themes from the web.',
          }),
        },
        {
          id: 'kando-editor-themes-tab',
          icon: 'palette',
          title: 'Editor Themes',
          content: emptyTab({
            heading: 'Here will be a list of available editor themes!',
            subheading:
              'In the future, it will be possible to theme the entire menu editor.',
          }),
        },
      ],
    });
  }

  /**
   * There are two buttons in the toolbar which are used to enter and leave edit mode.
   * This method wires up the functionality of these buttons.
   */
  private initVisibility() {
    this.container
      .querySelector('#enter-edit-mode-button')
      .addEventListener('click', () => this.emit('enter-edit-mode'));

    this.container
      .querySelector('#leave-edit-mode-button')
      .addEventListener('click', () => this.emit('leave-edit-mode'));
  }

  /**
   * Some of the tabs should cover the entire editor. This method wires up the
   * functionality which makes this possible.
   */
  private initTabs() {
    const tabs = [
      { id: 'kando-menus-tab', large: false },
      { id: 'kando-add-items-tab', large: false },
      { id: 'kando-stash-tab', large: false },
      { id: 'kando-trash-tab', large: false },
      { id: 'kando-editor-themes-tab', large: true },
      { id: 'kando-menu-themes-tab', large: true },
    ];

    for (const tab of tabs) {
      const element = this.container.querySelector(`button[data-bs-target="#${tab.id}"]`);
      element.addEventListener('shown.bs.tab', () => {
        if (tab.large) {
          this.container.querySelector('#kando-editor-toolbar').classList.add('large');
          this.emit('expand');
        } else {
          this.container.querySelector('#kando-editor-toolbar').classList.remove('large');
          this.emit('collapse');
        }
      });
    }
  }
}

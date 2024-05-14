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
import { AddItemsTab } from './add-items-tab';
import { MenusTab } from './menus-tab';
import { TrashTab } from './trash-tab';
import { StashTab } from './stash-tab';
import { IEditorMenuItem } from '../common/editor-menu-item';

/**
 * This class is responsible for the toolbar on the bottom of the editor screen. It is an
 * event emitter which emits the following events:
 *
 * @fires enter-edit-mode - This event is emitted when the user enters edit mode.
 * @fires leave-edit-mode - This event is emitted when the user leaves edit mode.
 * @fires expand - This event is emitted when a tab is selected which should cover the
 *   entire editor.
 * @fires collapse - This event is emitted when a tab is selected which should not cover
 *   the entire editor.
 * @fires add-menu - This event is emitted when the user clicks the "Add Menu" button.
 * @fires select-menu - This event is emitted when the user selects a menu in the toolbar.
 *   The index of the selected menu is passed as the first argument.
 * @fires delete-menu - This event is emitted when the user drags a menu to the trash tab.
 * @fires restore-deleted-menu - This event is emitted when the user drags a menu from the
 *   trash tab to the menus tab.
 * @fires restore-deleted-item - This event is emitted when the user drags a menu item
 *   from the trash tab to the preview area.
 * @fires stash-deleted-item - This event is emitted when the user drags a menu item from
 *   the trash tab to the stash tab.
 * @fires restore-stashed-item - This event is emitted when the user drags a menu item
 *   from the stash tab to the preview area.
 * @fires delete-stashed-item - This event is emitted when the user drags a menu item from
 *   the stash tab to the trash tab.
 */
export class Toolbar extends EventEmitter {
  /**
   * The container is the HTML element which contains the toolbar. It is created in the
   * constructor and returned by the getContainer() method.
   */
  private container: HTMLElement = null;

  /** This manages the first tab of the toolbar. */
  private menusTab: MenusTab = null;

  /** This manages the second tab of the toolbar. */
  private addItemsTab: AddItemsTab = null;

  /** This manages the trash tab of the toolbar. */
  private trashTab: TrashTab = null;

  /** This manages the stash tab of the toolbar. */
  private stashTab: StashTab = null;

  /**
   * This constructor creates the HTML elements for the toolbar and wires up all the
   * functionality.
   */
  constructor() {
    super();

    this.loadContent();
    this.initVisibility();
    this.initTabs();

    // Initialize the menus tab and forward its events.
    this.menusTab = new MenusTab(this.container);
    this.menusTab.on('add-menu', () => this.emit('add-menu'));
    this.menusTab.on('select-menu', (index) => this.emit('select-menu', index));
    this.menusTab.on('delete-menu', (index) => this.emit('delete-menu', index));

    // Initialize the add-items tab and forward its events.
    this.addItemsTab = new AddItemsTab(this.container);
    this.addItemsTab.on('add-item', (typeName) => this.emit('add-item', typeName));

    // Initialize the trash tab and forward its events.
    this.trashTab = new TrashTab(this.container);
    this.trashTab.on('restore-menu', (index) => this.emit('restore-deleted-menu', index));
    this.trashTab.on('restore-item', (index) => this.emit('restore-deleted-item', index));
    this.trashTab.on('stash-item', (index) => this.emit('stash-deleted-item', index));

    // Initialize the stash tab and forward its events.
    this.stashTab = new StashTab(this.container);
    this.stashTab.on('restore-item', (index) => this.emit('restore-stashed-item', index));
    this.stashTab.on('delete-item', (index) => this.emit('delete-stashed-item', index));
  }

  /** This method returns the container of the editor toolbar. */
  public getContainer(): HTMLElement {
    return this.container;
  }

  /**
   * Whenever a menu is added or removed, the menus tab needs to be updated.
   *
   * @param menus A list of all menus.
   * @param currentMenu The index of the currently selected menu.
   * @param showShortcuts If true, menu buttons will show the shortcuts, else they will
   *   show the shortcut names.
   */
  public setMenus(menus: Array<IMenu>, currentMenu: number, showShortcuts: boolean) {
    this.menusTab.setMenus(menus, currentMenu, showShortcuts);
  }

  /**
   * Whenever the content of the trash changes, the trash tab needs to be updated.
   *
   * @param items A list of all trashed menus and menu items.
   * @param showShortcuts If true, menu buttons will show the shortcuts, else they will
   *   show the shortcut names.
   */
  public setTrashedThings(items: Array<IMenu | IEditorMenuItem>, showShortcuts: boolean) {
    this.trashTab.setTrashedThings(items, showShortcuts);
  }

  /**
   * Whenever the content of the stash changes, the stash tab needs to be updated.
   *
   * @param items A list of all stashed menu items.
   */
  public setStashedItems(items: Array<IEditorMenuItem>) {
    this.stashTab.setStashedItems(items);
  }

  /**
   * This method updates the button which represents the menu at the given index in the
   * given menu list. It is called by the editor whenever the user changed a property of
   * the currently edited menu in the properties view.
   */
  public updateMenu(menus: Array<IMenu>, index: number) {
    this.menusTab.updateMenu(menus, index);
  }

  /** This method loads the HTML content of the toolbar. */
  private loadContent() {
    const emptyTab = Handlebars.compile(require('./templates/empty-tab.hbs').default);
    const toolbar = Handlebars.compile(require('./templates/toolbar.hbs').default);

    this.container = document.createElement('div');
    this.container.id = 'kando-editor-toolbar-area';
    this.container.innerHTML = toolbar({
      tabs: [
        {
          id: 'kando-menus-tab',
          icon: 'apps',
          title: 'Menus',
          active: true,
          content: '',
        },
        {
          id: 'kando-add-items-tab',
          icon: 'add',
          title: 'Menu Items',
          content: '',
        },
        {
          id: 'kando-stash-tab',
          icon: 'content_paste',
          title: 'Stash',
          hasCounter: true,
          content: '',
        },
        {
          id: 'kando-trash-tab',
          icon: 'delete',
          title: 'Trash',
          hasCounter: true,
          content: '',
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
          document.getElementById('kando-editor-toolbar').classList.add('large');
          this.emit('expand');
        } else {
          document.getElementById('kando-editor-toolbar').classList.remove('large');
          this.emit('collapse');
        }
      });
    }
  }
}

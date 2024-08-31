//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { EventEmitter } from 'events';
import { IBackendInfo, IMenuSettings } from '../../../common';
import { AddItemsTab } from './add-items-tab';
import { MenusTab } from './menus-tab';
import { TrashTab } from './trash-tab';
import { TemplatesTab } from './templates-tab';
import { DnDManager } from '../common/dnd-manager';
import { MenuThemesTab } from './menu-themes-tab';

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
 * @fires select-menu - This event is emitted when the user selects a menu in the toolbar.
 *   The index of the selected menu is passed as the first argument.
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

  /** This manages the templates tab of the toolbar. */
  private templatesTab: TemplatesTab = null;

  /** This manages the menu themes tab of the toolbar. */
  private menuThemesTab: MenuThemesTab = null;

  /**
   * This constructor creates the HTML elements for the toolbar and wires up all the
   * functionality.
   *
   * @param backend The backend info is used to determine if the backend supports
   *   shortcuts.
   * @param dndManager The DnDManager is used to handle drag and drop operations.
   */
  constructor(backend: IBackendInfo, dndManager: DnDManager) {
    super();

    this.loadContent();
    this.initVisibility();
    this.initTabs();

    // Initialize the menus tab and forward its events.
    this.menusTab = new MenusTab(this.container, !backend.supportsShortcuts, dndManager);
    this.menusTab.on('select-menu', (index) => this.emit('select-menu', index));

    // Initialize the add-items tab and forward its events.
    this.addItemsTab = new AddItemsTab(this.container, dndManager);

    // Initialize the trash tab and forward its events.
    this.trashTab = new TrashTab(this.container, !backend.supportsShortcuts, dndManager);

    // Initialize the templates tab and forward its events.
    this.templatesTab = new TemplatesTab(
      this.container,
      !backend.supportsShortcuts,
      dndManager
    );

    // Initialize the menu themes tab and forward its events.
    this.menuThemesTab = new MenuThemesTab(this.container);
  }

  /** This method returns the container of the editor toolbar. */
  public getContainer(): HTMLElement {
    return this.container;
  }

  /**
   * This method is called initially when the editor is opened. It is used to set the
   * menus and the templates content.
   *
   * @param menuSettings The current menu settings.
   * @param currentMenu The index of the currently selected menu.
   */
  public init(menuSettings: IMenuSettings, currentMenu: number) {
    this.menusTab.init(menuSettings, currentMenu);
    this.templatesTab.init(menuSettings);
    this.menuThemesTab.init();
  }

  /**
   * This method updates the button which represents the currently edited menu. It is
   * called by the editor whenever the user changed a property of the currently edited
   * menu in the properties view.
   */
  public updateMenu() {
    this.menusTab.updateMenu();
  }

  /** This method loads the HTML content of the toolbar. */
  private loadContent() {
    const emptyTab = require('./templates/empty-tab.hbs');
    const toolbar = require('./templates/toolbar.hbs');

    this.container = document.createElement('div');
    this.container.id = 'kando-editor-toolbar-area';
    this.container.innerHTML = toolbar({
      tabs: [
        {
          id: 'kando-menus-tab',
          icon: 'apps',
          title: i18next.t('toolbar.menus-tab.label'),
          active: true,
          content: '',
        },
        {
          id: 'kando-add-items-tab',
          icon: 'control_point_duplicate',
          title: i18next.t('toolbar.add-items-tab.label'),
          content: '',
        },
        {
          id: 'kando-templates-tab',
          icon: 'content_copy',
          title: i18next.t('toolbar.templates-tab.label'),
          hasCounter: true,
          content: '',
        },
        {
          id: 'kando-trash-tab',
          icon: 'delete',
          title: i18next.t('toolbar.trash-tab.label'),
          hasCounter: true,
          content: '',
        },
        {
          id: 'kando-menu-themes-tab',
          icon: 'palette',
          title: i18next.t('toolbar.menu-themes-tab.label'),
          gapBefore: true,
          content: '',
        },
        {
          id: 'kando-editor-themes-tab',
          icon: 'palette',
          title: i18next.t('toolbar.editor-themes-tab.label'),
          content: emptyTab({
            heading: i18next.t('toolbar.editor-themes-tab.heading'),
            subheading: i18next.t('toolbar.editor-themes-tab.subheading'),
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
      { id: 'kando-templates-tab', large: false },
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

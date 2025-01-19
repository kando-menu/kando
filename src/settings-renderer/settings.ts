//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { Tooltip } from 'bootstrap';

import { Sidebar } from './sidebar/sidebar';
import { Toolbar } from './toolbar/toolbar';
import { Preview } from './preview/preview';
import { Properties } from './properties/properties';
import { IAppSettings, IBackendInfo, IMenuSettings, IVersionInfo } from '../common';
import { DnDManager } from './common/dnd-manager';

/** These options can be given to the constructor of the settings. */
export class SettingsOptions {
  /**
   * Set this to false to hide the show-sidebar button. It will still be clickable,
   * though.
   */
  showSidebarButtonVisible = true;

  /**
   * Set this to false to hide the show-settings button. It will still be clickable,
   * though.
   */
  showEditorButtonVisible = true;
}

/**
 * This class is responsible for the entire settings. It contains the preview, the
 * properties view, the sidebar and the toolbar.
 */
export class Settings {
  /** The container is the HTML element which contains the settings. */
  private container: HTMLElement = null;

  /** This is the backend info which is retrieved from the main process. */
  private backend: IBackendInfo = null;

  /**
   * This holds some global options for the settings. These options can be set when the
   * settings is created and will be used to configure it's behavior.
   */
  private options: SettingsOptions = null;

  /**
   * The preview is shown in the center of the screen. It allows the user to edit one
   * level of the menu.
   */
  private preview: Preview = null;

  /**
   * The properties view is shown on the right side of the screen. It allows the user to
   * edit the properties of the currently selected menu item.
   */
  private properties: Properties = null;

  /**
   * The sidebar is displayed on the left screen edge. It contains some information about
   * Kando in general.
   */
  private sidebar: Sidebar = null;

  /**
   * The toolbar is displayed on the bottom of the screen. It allows the user to switch
   * between different menus, add new items, etc.
   */
  private toolbar: Toolbar = null;

  /** This is used to manage drag'n'drop operations. */
  private dndManager: DnDManager = new DnDManager();

  /**
   * These are the current settings. They are retrieved from the main process when the
   * user enters edit mode. It will modified by the user and then sent back to the main
   * process when the user leaves edit mode.
   */
  private menuSettings: IMenuSettings = null;

  /**
   * This is the index of the currently selected menu. It is used to keep track of the
   * current menu when the user switches between menus.
   */
  private currentMenu: number = 0;

  /**
   * This will be set to true when the user currently edits a menu. I.e. when the root
   * item is selected in the preview.
   */
  private editingMenu: boolean = true;

  /**
   * This constructor creates the HTML elements for the settings and wires up all the
   * functionality.
   *
   * @param container All the settings components will be appended to this container.
   * @param menuSettings The current menu settings.
   * @param currentMenu The index of the currently selected menu.
   * @param backend Provides information on the currently used backend of Kando.
   * @param version The version string will be displayed in the sidebar.
   */
  constructor(
    container: HTMLElement,
    appSettings: IAppSettings,
    menuSettings: IMenuSettings,
    currentMenu: number,
    backend: IBackendInfo,
    version: IVersionInfo
  ) {
    this.container = container;
    this.backend = backend;

    if (appSettings.transparentSettingsWindow) {
      this.container.classList.add('transparent');
    }

    // Initialize the preview.
    this.preview = new Preview(this.dndManager);
    this.container.appendChild(this.preview.getContainer());

    this.preview.on('select-root', () => {
      this.editingMenu = true;
      this.properties.setMenu(this.menuSettings.menus[this.currentMenu]);
    });

    this.preview.on('select-item', (item) => {
      this.editingMenu = false;
      this.properties.setItem(item);
    });

    // Initialize the properties view.
    this.properties = new Properties(this.backend);
    this.container.appendChild(this.properties.getContainer());

    const handleItemChange = () => {
      this.preview.updateActiveItem();

      if (this.editingMenu) {
        this.toolbar.updateMenu();
      }
    };

    this.properties.on('changed-name', handleItemChange);
    this.properties.on('changed-icon', handleItemChange);
    this.properties.on('changed-shortcut', handleItemChange);

    // Initialize the sidebar.
    this.sidebar = new Sidebar(backend, version);
    this.container.appendChild(this.sidebar.getContainer());

    // Initialize the toolbar. The toolbar also brings the buttons for entering and
    // leaving edit mode. We wire up the corresponding events here.
    this.toolbar = new Toolbar(backend, this.dndManager);
    this.container.appendChild(this.toolbar.getContainer());

    this.toolbar.on('expand', () => {
      this.preview.hide();
      this.properties.hide();
    });

    this.toolbar.on('collapse', () => {
      this.preview.show();
      this.properties.show();
    });

    this.toolbar.on('select-menu', (index: number) => {
      this.currentMenu = index;
      this.properties.setMenu(this.menuSettings.menus[index]);
      this.preview.setMenu(this.menuSettings.menus[index]);
    });

    // Initialize all tooltips.
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((elem) => {
      new Tooltip(elem, {
        delay: { show: 500, hide: 0 },
      });
    });

    this.properties.setOptions({
      appName: 'foo',
      windowName: 'bar',
      windowPosition: { x: 0, y: 0 },
    });

    this.menuSettings = menuSettings;
    this.currentMenu = currentMenu;
    this.preview.setMenu(menuSettings.menus[currentMenu]);
    this.toolbar.init(menuSettings, currentMenu);
  }
}

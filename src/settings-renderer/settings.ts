//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { WindowWithAPIs } from './settings-window-api';
declare const window: WindowWithAPIs;

import { Tooltip } from 'bootstrap';

import { Sidebar } from './sidebar/sidebar';
import { Toolbar } from './toolbar/toolbar';
import { Background } from './background/background';
import { Preview } from './preview/preview';
import { Properties } from './properties/properties';
import {
  IBackendInfo,
  IMenu,
  IMenuItem,
  IMenuSettings,
  IShowSettingsOptions,
  deepCopyMenu,
  deepCopyMenuItem,
  IVersionInfo,
} from '../common';
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
   * The background is an opaque div which is shown when the settings is open. It
   * effectively hides the normal menu.
   */
  private background: Background = null;

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
   * @param backend Provides information on the currently used backend of Kando.
   * @param version The version string will be displayed in the sidebar.
   */
  constructor(container: HTMLElement, backend: IBackendInfo, version: IVersionInfo) {
    this.container = container;
    this.backend = backend;

    // Initialize the background.
    this.background = new Background();
    this.container.appendChild(this.background.getContainer());

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

    this.toolbar.on('enter-edit-mode', () => this.enterEditMode());
    this.toolbar.on('leave-edit-mode', () => this.leaveEditMode());

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
  }

  /**
   * This is used to show the entire settings. Most likely, this will only show the
   * sidebar, the other components are hidden by default and will only be shown when
   * enterEditMode() is called.
   */
  public show(options: IShowSettingsOptions) {
    this.properties.setOptions(options);
    this.container.classList.add('visible');
  }

  /**
   * This is used to hide the entire settings, including the sidebar. We also leave edit
   * mode if it is currently active. Else, the settings would be shown right away when the
   * user opens the menu again.
   */
  public hide() {
    this.container.classList.remove('visible');
    this.leaveEditMode();
  }

  /**
   * This shows the other components of the settings, such as the toolbar and the
   * background. To make sure that enough space is available, the sidebar is hidden.
   */
  public enterEditMode() {
    if (this.isInEditMode()) {
      return;
    }

    this.container.classList.add('edit-mode');
    this.sidebar.setVisibility(false);

    // Get the current settings from the main process and pass them to the respective
    // components.
    Promise.all([
      window.commonAPI.menuSettings.get(),
      window.commonAPI.menuSettings.getCurrentMenu(),
    ]).then(([menuSettings, currentMenu]) => {
      this.menuSettings = menuSettings;
      this.currentMenu = currentMenu;
      this.preview.setMenu(menuSettings.menus[currentMenu]);
      this.toolbar.init(menuSettings, currentMenu);
    });
  }

  /**
   * This hides the edit-mode components of the settings, such as the toolbar and the
   * background. The sidebar will remain visible if it is currently shown. The current
   * settings will be sent back to the main process and saved to disc over there.
   */
  public leaveEditMode() {
    if (!this.isInEditMode()) {
      return;
    }

    // We remove the menu from the preview. Else it will be visible for a split second
    // when the settings is opened the next time.
    this.preview.setMenu(null);

    // We remove the edit-mode class from the container. This will trigger some fade-out
    // animations. As most elements are set to 'display: none' when the edit-mode class is
    // not present (for performance reasons), we temporarily add the 'leaving-edit-mode'
    // class which elements can use to keep their visibility until the animations are
    // done.
    this.container.classList.remove('edit-mode');
    this.container.classList.add('leaving-edit-mode');
    setTimeout(() => this.container.classList.remove('leaving-edit-mode'), 500);

    // Send the settings to the main process.
    if (this.menuSettings) {
      // Before sending the settings back to the main process, we have to make sure
      // that the menu items are converted back to IMenuItem objects. This is because
      // ISettingsMenuItem objects contain properties (such as DOM nodes) which neither need to
      // be saved to disc nor can they be cloned using the structured clone algorithm
      // which is used by Electron for IPC.
      this.menuSettings.menus.forEach((menu) => {
        menu.root = deepCopyMenuItem(menu.root);
      });

      // Also the templates needs to be converted back to IMenu and IMenuItem objects.
      this.menuSettings.templates = this.menuSettings.templates.map((thing) => {
        if ((thing as IMenu).root) {
          return deepCopyMenu(thing as IMenu);
        } else {
          return deepCopyMenuItem(thing as IMenuItem);
        }
      });

      window.commonAPI.menuSettings.set(this.menuSettings);
      this.menuSettings = null;
    }
  }

  /** This method returns true if the settings is currently in edit mode. */
  public isInEditMode(): boolean {
    return this.container.classList.contains('edit-mode');
  }
}

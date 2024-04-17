//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { Tooltip } from 'bootstrap';
import { EventEmitter } from 'events';

import { Sidebar } from './sidebar/sidebar';
import { Toolbar } from './toolbar/toolbar';
import { Background } from './background/background';
import { Preview } from './preview/preview';
import { Properties } from './properties/properties';
import { IMenu, IMenuSettings } from '../../common';
import { IEditorNode, toINode } from './common/editor-node';

/**
 * This class is responsible for the entire editor. It contains the preview, the
 * properties view, the sidebar and the toolbar. It is an event emitter and will emit the
 * following events:
 *
 * @fires enter-edit-mode - This is emitted when the user enters edit mode.
 * @fires leave-edit-mode - This is emitted when the user leaves edit mode.
 */
export class Editor extends EventEmitter {
  /** The container is the HTML element which contains the menu editor. */
  private container: HTMLElement = null;

  /**
   * The background is an opaque div which is shown when the editor is open. It
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

  /**
   * These are the current menu settings. They are retrieved from the main process when
   * the user enters edit mode. It will modified by the user and then sent back to the
   * main process when the user leaves edit mode.
   */
  private menuSettings: IMenuSettings = null;

  /**
   * This is the index of the currently selected menu. It is used to keep track of the
   * current menu when the user switches between menus.
   */
  private currentMenu: number = 0;

  /**
   * This array is used to store items which have been deleted by the user. They can be
   * restored by dragging them back to the menus tab or the menu preview. They will not be
   * saved to disc.
   */
  private trashedItems: Array<IMenu | IEditorNode> = [];

  /**
   * This constructor creates the HTML elements for the menu editor and wires up all the
   * functionality.
   */
  constructor(container: HTMLElement) {
    super();

    this.container = container;

    // Initialize the background.
    this.background = new Background();
    this.container.appendChild(this.background.getContainer());

    // Initialize the preview.
    this.preview = new Preview();

    this.preview.on('delete-item', (item) => {
      this.trashedItems.push(item);
      this.toolbar.setTrashedItems(this.trashedItems);
    });

    this.preview.on('stash-item', (item) => {
      this.menuSettings.stash.push(item);
      this.toolbar.setStashedItems(this.menuSettings.stash);
    });

    this.container.appendChild(this.preview.getContainer());

    // Initialize the properties view.
    this.properties = new Properties();
    this.container.appendChild(this.properties.getContainer());

    // Initialize the sidebar.
    this.sidebar = new Sidebar();
    this.container.appendChild(this.sidebar.getContainer());

    // Initialize the toolbar. The toolbar also brings the buttons for entering and
    // leaving edit mode. We wire up the corresponding events here.
    this.toolbar = new Toolbar();

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

    this.toolbar.on('add-menu', () => {
      // Choose a random icon for the new menu.
      const icons = [
        'favorite',
        'star',
        'kid_star',
        'home',
        'cycle',
        'public',
        'rocket_launch',
        'mood',
        'sunny',
        'target',
      ];

      const icon = icons[Math.floor(Math.random() * icons.length)];

      // Choose a new name for the menu. We will start with "New Menu" and append a
      // number if this name is already taken.
      let name = 'New Menu';
      let i = 1;

      if (this.menuSettings.menus.find((menu) => menu.nodes.name === name)) {
        do {
          name = `New Menu ${i}`;
          i++;
        } while (this.menuSettings.menus.find((menu) => menu.nodes.name === name));
      }

      const newMenu: IMenu = {
        nodes: {
          type: 'submenu',
          name,
          icon,
          iconTheme: 'material-symbols-rounded',
          children: [],
        },
        shortcut: '',
        centered: false,
      };

      this.menuSettings.menus.push(newMenu);
      this.toolbar.setMenus(this.menuSettings.menus, this.menuSettings.menus.length - 1);
      this.preview.setMenu(newMenu);
    });

    this.toolbar.on('select-menu', (index: number) => {
      this.currentMenu = index;
      this.preview.setMenu(this.menuSettings.menus[index]);
    });

    this.toolbar.on('delete-menu', (index: number) => {
      this.trashedItems.push(this.menuSettings.menus.splice(index, 1)[0]);
      this.currentMenu = Math.min(this.currentMenu, this.menuSettings.menus.length - 1);
      this.toolbar.setMenus(this.menuSettings.menus, this.currentMenu);
      this.preview.setMenu(this.menuSettings.menus[this.currentMenu]);
      this.toolbar.setTrashedItems(this.trashedItems);
    });

    this.toolbar.on('restore-deleted-menu', (index: number) => {
      this.menuSettings.menus.push(this.trashedItems.splice(index, 1)[0] as IMenu);
      this.toolbar.setMenus(this.menuSettings.menus, this.currentMenu);
      this.toolbar.setTrashedItems(this.trashedItems);
    });

    this.toolbar.on('restore-deleted-item', (index: number) => {
      const node = this.trashedItems.splice(index, 1)[0] as IEditorNode;
      this.preview.insertNode(node);
      this.toolbar.setTrashedItems(this.trashedItems);
    });

    this.toolbar.on('stash-deleted-item', (index: number) => {
      this.menuSettings.stash.push(this.trashedItems.splice(index, 1)[0] as IEditorNode);
      this.toolbar.setTrashedItems(this.trashedItems);
      this.toolbar.setStashedItems(this.menuSettings.stash);
    });

    this.toolbar.on('restore-stashed-item', (index: number) => {
      const node = this.menuSettings.stash.splice(index, 1)[0];
      this.preview.insertNode(node);
      this.toolbar.setStashedItems(this.menuSettings.stash);
    });

    this.toolbar.on('delete-stashed-item', (index: number) => {
      this.trashedItems.push(this.menuSettings.stash.splice(index, 1)[0]);
      this.toolbar.setTrashedItems(this.trashedItems);
      this.toolbar.setStashedItems(this.menuSettings.stash);
    });

    this.container.appendChild(this.toolbar.getContainer());

    // Initialize all tooltips.
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((elem) => {
      new Tooltip(elem, {
        delay: { show: 500, hide: 0 },
      });
    });
  }

  /**
   * This is used to show the entire editor. Most likely, this will only show the sidebar,
   * the other components are hidden by default and will only be shown when
   * enterEditMode() is called.
   */
  public show() {
    this.container.classList.add('visible');
  }

  /**
   * This is used to hide the entire editor, including the sidebar. We also leave edit
   * mode if it is currently active. Else, the editor would be shown right away when the
   * user opens the menu again.
   */
  public hide() {
    this.container.classList.remove('visible');
    this.leaveEditMode();
  }

  /**
   * This shows the other components of the editor, such as the toolbar and the
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
      window.api.menuSettings.get(),
      window.api.menuSettings.getCurrentMenu(),
    ]).then(([settings, currentMenu]) => {
      this.menuSettings = settings;
      this.currentMenu = currentMenu;
      this.preview.setMenu(settings.menus[currentMenu]);
      this.toolbar.setMenus(settings.menus, currentMenu);
      this.toolbar.setStashedItems(settings.stash);
    });

    this.emit('enter-edit-mode');
  }

  /**
   * This hides the edit-mode components of the editor, such as the toolbar and the
   * background. The sidebar will remain visible if it is currently shown. The current
   * menu settings will be sent back to the main process and saved to disc over there.
   */
  public leaveEditMode() {
    if (!this.isInEditMode()) {
      return;
    }

    this.container.classList.remove('edit-mode');

    if (this.menuSettings) {
      // Before sending the menu settings back to the main process, we have to make sure
      // that the menu nodes are converted back to INode objects. This is because
      // IEditorNode objects contain properties (such as DOM nodes) which neither need to
      // be saved to disc nor can they be cloned using the structured clone algorithm
      // which is used by Electron for IPC.
      this.menuSettings.menus.forEach((menu) => {
        menu.nodes = toINode(menu.nodes);
      });

      // Also the stash needs to be converted back to INode objects.
      this.menuSettings.stash = this.menuSettings.stash.map(toINode);

      window.api.menuSettings.set(this.menuSettings);
      this.menuSettings = null;
    }

    this.emit('leave-edit-mode');
  }

  /** This method returns true if the editor is currently in edit mode. */
  public isInEditMode(): boolean {
    return this.container.classList.contains('edit-mode');
  }
}

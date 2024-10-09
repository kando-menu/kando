//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { ToolbarDraggable } from './toolbar-draggable';
import { DropTargetTab } from './drop-target-tab';
import { IMenu, IMenuSettings, deepCopyMenu } from '../../../common';
import { IconThemeRegistry } from '../../icon-themes/icon-theme-registry';
import { IDraggable } from '../common/draggable';
import { DnDManager } from '../common/dnd-manager';

/**
 * This class is responsible for the menus tab in the toolbar. It is an event emitter
 * which emits the following events:
 *
 * @fires select-menu - This event is emitted when the user selects a menu in the toolbar.
 *   The index of the selected menu is passed as the first argument.
 */
export class MenusTab extends DropTargetTab {
  /**
   * This contains all configured menus. When a menu is added or removed, we directly
   * update the settings. When the editor is closed, the settings are saved to disc.
   */
  private menuSettings: IMenuSettings = null;

  /** This is the index of the currently selected menu. */
  private currentMenu: number = 0;

  /** This list contains a draggable for each menu button. */
  private draggables: IDraggable[] = [];

  /**
   * This constructor is called after the general toolbar DOM has been created.
   *
   * @param container The container is the HTML element which contains the entire toolbar.
   * @param showShortcutIDs If true, menu buttons will show the shortcut IDs, instead of
   *   the shortcuts.
   */
  constructor(
    private container: HTMLElement,
    private showShortcutIDs: boolean,
    private dndManager: DnDManager
  ) {
    super(
      dndManager,
      ['trashed-menu', 'template-menu'],
      container.querySelector('#kando-menus-tab-header'),
      container.querySelector('#kando-menus-tab')
    );

    // If the "Add Menu" button is clicked, we emit the 'add-menu' event.
    this.tabContent.addEventListener('click', (event) => {
      const button = event.target as HTMLButtonElement;
      if (button && button.classList.contains('add-menu-button')) {
        this.addMenu();
      }
    });
  }

  /**
   * This method is called initially to set the menus. It is called by the toolbar
   * whenever the editor is opened.
   *
   * @param menuSettings The menu settings contain all menus and their properties.
   * @param currentMenu This is the index of the currently selected menu.
   */
  public init(menuSettings: IMenuSettings, currentMenu: number) {
    this.menuSettings = menuSettings;
    this.currentMenu = currentMenu;
    this.redraw();
  }

  /**
   * This method updates the currently selected button. It is called by the toolbar
   * whenever the user changed a property of the currently edited menu in the properties
   * view.
   */
  public updateMenu() {
    const menu = this.menuSettings.menus[this.currentMenu];
    const id = `#menu-button-${this.currentMenu}`;

    // Update the name.
    const name = this.container.querySelector(`${id} .name`);
    if (name) {
      name.textContent = menu.root.name;
    }

    // Update the icon.
    const icon = this.container.querySelector(`${id} .icon-container`);
    const parent = icon.parentElement;
    icon.remove();
    parent.append(
      IconThemeRegistry.getInstance().createIcon(menu.root.iconTheme, menu.root.icon)
    );

    // Update the shortcut.
    const description = this.container.querySelector(`${id} .description`);
    if (description) {
      description.textContent =
        (this.showShortcutIDs ? menu.shortcutID : menu.shortcut) || 'Not bound.';
    }
  }

  // IDropTarget implementation ----------------------------------------------------------

  /** @inheritdoc */
  override onDrop(draggable: IDraggable) {
    super.onDrop(draggable);

    // Add the dropped menu to the list menus. We drop a copy of the item to the menus.
    this.menuSettings.menus.push(deepCopyMenu(draggable.getData() as IMenu));
    this.currentMenu = this.menuSettings.menus.length - 1;
    this.redraw();
    this.emit('select-menu', this.currentMenu);
  }

  // Private Methods ---------------------------------------------------------------------

  /**
   * This method is called whenever a menu is added or removed. It updates the entire
   * menus tab.
   */
  private redraw() {
    // First, we remove all draggables.
    this.draggables.forEach((draggable) =>
      this.dndManager.unregisterDraggable(draggable)
    );
    this.draggables = [];

    // Compile the data for the Handlebars template.
    const data = this.menuSettings.menus.map((menu, index) => ({
      name: menu.root.name,
      checked: index === this.currentMenu,
      description:
        (this.showShortcutIDs ? menu.shortcutID : menu.shortcut) ||
        i18next.t('properties.common.not-bound'),
      icon: IconThemeRegistry.getInstance().createIcon(
        menu.root.iconTheme,
        menu.root.icon
      ).outerHTML,
      index,
    }));

    const template = require('./templates/menus-tab.hbs');
    this.tabContent.innerHTML = template({
      menus: data,
      strings: {
        createMenuButton: i18next.t('toolbar.menus-tab.create-menu-button'),
      },
    });

    // Add drag'n'drop logic to the menu buttons.
    this.menuSettings.menus.forEach((menu, index) => {
      const div = this.tabContent.querySelector(`#menu-button-${index}`) as HTMLElement;

      const draggable = new ToolbarDraggable(div, 'menu', false, () => menu);
      this.dndManager.registerDraggable(draggable);

      draggable.on('drop', (target, shouldCopy) => {
        if (!shouldCopy) {
          // Remove the dropped menu from the menus.
          this.menuSettings.menus = this.menuSettings.menus.filter((m) => m !== menu);
          this.currentMenu = Math.min(
            this.currentMenu,
            this.menuSettings.menus.length - 1
          );

          // Redraw the menus tab.
          this.redraw();
          this.emit('select-menu', this.currentMenu);
        }
      });

      draggable.on('select', () => {
        // Remove the "checked" class from all buttons.
        this.tabContent.querySelectorAll('.toolbar-menu-button').forEach((button) => {
          button.classList.remove('checked');
        });

        // Add the "checked" class to the clicked button.
        div.classList.add('checked');

        this.currentMenu = index;
        this.emit('select-menu', this.currentMenu);
      });

      this.draggables.push(draggable);
    });
  }

  /**
   * This method is called when the user clicks the "Add Menu" button. It adds a new
   * random menu to the menu list.
   */
  private addMenu() {
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

    if (this.menuSettings.menus.find((menu) => menu.root.name === name)) {
      do {
        name = `New Menu ${i}`;
        i++;
      } while (this.menuSettings.menus.find((menu) => menu.root.name === name));
    }

    const newMenu: IMenu = {
      root: {
        type: 'submenu',
        name,
        icon,
        iconTheme: 'material-symbols-rounded',
        children: [],
      },
      shortcut: '',
      shortcutID: '',
      centered: false,
      warpMouse: false,
      anchored: false,
    };

    this.menuSettings.menus.push(newMenu);

    this.currentMenu = this.menuSettings.menus.length - 1;
    this.redraw();
    this.emit('select-menu', this.currentMenu);
  }
}

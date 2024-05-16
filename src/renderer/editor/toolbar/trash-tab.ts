//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ToolbarItemDragger } from './toolbar-item-dragger';
import { EventEmitter } from 'events';
import { IMenu } from '../../../common';
import { IEditorMenuItem } from '../common/editor-menu-item';
import { ItemTypeRegistry } from '../../../common/item-type-registry';
import { IconThemeRegistry } from '../../../common/icon-theme-registry';

/**
 * This class represents the trash tab in the toolbar. Users can drop menus and menu items
 * here to delete them. Dropped items are stored in the trash until the user restarts the
 * application. The class is an event emitter which emits the following events:
 *
 * @fires restore-menu - This event is emitted when the user drags a menu from the trash
 *   tab to the menus tab. The index of the restored menu is passed as the first
 *   argument.
 * @fires restore-item - This event is emitted when the user drags a menu item from the
 *   trash tab to the preview area. The index of the restored item is passed as the first
 *   argument.
 * @fires stash-item - This event is emitted when the user drags a menu item from the
 *   trash tab to the stash tab. The index of the stashed item is passed as the first
 *   argument.
 */
export class TrashTab extends EventEmitter {
  /** The container is the HTML element which contains the entire toolbar. */
  private container: HTMLElement = null;

  /** If true, menu buttons will show the shortcut IDs, instead of the shortcuts. */
  private showShortcutIDs: boolean = false;

  /** This is the HTML element which contains the trash tab's content. */
  private tab: HTMLElement = null;

  /**
   * This is used to drag'n'drop menus from the trash to the menus tab or to the menu
   * preview. The template argument is a number since the index of the dragged item is
   * stored of in the data field.
   */
  private dragger: ToolbarItemDragger<number> = null;

  /**
   * These are all potential drop targets for dragged menus and menu items. Depending on
   * the type of the dragged item, different drop targets are possible.
   */
  private stashTab: HTMLElement = null;
  private menusTab: HTMLElement = null;
  private preview: HTMLElement = null;

  /**
   * This constructor is called after the general toolbar DOM has been created.
   *
   * @param container The container is the HTML element which contains the entire toolbar.
   * @param showShortcutIDs If true, menu buttons will show the shortcut IDs, instead of
   *   the shortcuts.
   */
  constructor(container: HTMLElement, showShortcutIDs: boolean) {
    super();

    // Store a reference to the container. We will attach menu buttons divs to it during
    // drag'n'drop operations.
    this.container = container;

    // Store the showShortcutIDs flag.
    this.showShortcutIDs = showShortcutIDs;

    // Store a reference to the potential drop targets.
    this.stashTab = this.container.querySelector(
      ".nav-link[data-bs-target='#kando-stash-tab']"
    ) as HTMLElement;

    this.menusTab = this.container.querySelector(
      ".nav-link[data-bs-target='#kando-menus-tab']"
    ) as HTMLElement;

    this.preview = document.querySelector('#kando-menu-preview-area') as HTMLElement;

    // Initialize the dragger. This will be used to make the menu and item buttons
    // draggable. When a menu is dropped to the menus tab, we emit the 'restore-menu'
    // event, when a menu item is dropped to the stash tab, we emit the 'stash-item'
    // event. Finally, when a menu item is dropped to the preview area, we emit the
    // 'restore-item' event.
    this.dragger = new ToolbarItemDragger();
    this.dragger.on('drop', (index, dropTarget) => {
      if (dropTarget == this.menusTab) {
        this.emit('restore-menu', index);
      } else if (dropTarget == this.stashTab) {
        this.emit('stash-item', index);
      } else {
        this.emit('restore-item', index);
      }
    });

    // The tab has been created in the toolbar's constructor.
    this.tab = this.container.querySelector('#kando-trash-tab');

    // Initialize the trash tab with an empty list of trashed items.
    this.setTrashedThings([]);
  }

  /**
   * This method is called when the user drops a menu or a menu item on the trash tab. It
   * completely updates the trash tab's content.
   *
   * @param things The menus or menu items which are currently in the trash.
   */
  public setTrashedThings(things: Array<IMenu | IEditorMenuItem>) {
    this.dragger.removeAllDraggables();

    const template = require('./templates/stash-trash-tab.hbs');
    // Compile the data for the Handlebars template.
    const data = things.map((thing, index) => {
      const menu = thing as IMenu;

      // If the item is a menu, we need to extract the name, the shortcut and the icon.
      if (menu.nodes) {
        return {
          isMenu: true,
          name: menu.nodes.name,
          description:
            (this.showShortcutIDs ? menu.shortcutID : menu.shortcut) || 'Not bound.',
          icon: IconThemeRegistry.getInstance()
            .getTheme(menu.nodes.iconTheme)
            .createDiv(menu.nodes.icon).outerHTML,
          index,
        };
      }

      // If the item is a menu item, we need to extract the name and the icon.
      const item = thing as IEditorMenuItem;
      const typeInfo = ItemTypeRegistry.getInstance().getType(item.type);
      return {
        isMenu: false,
        name: item.name,
        description: typeInfo?.getDescription(item),
        icon: IconThemeRegistry.getInstance()
          .getTheme(item.iconTheme)
          .createDiv(item.icon).outerHTML,
        index,
      };
    });

    // Update the tab's content.
    this.tab.innerHTML = template({
      type: 'trash',
      placeholderHeading: 'You can delete menus and menu items by dropping them here!',
      placeholderSubheading: 'When you restart Kando, they will be gone.',
      items: data,
    });

    // Add drag'n'drop logic to the things in the trash. Depending on the type, different
    // drop targets are possible.
    // - Menus can only be dragged to the menus tab.
    // - Menu items can be dragged to the stash tab or to the menu preview.
    for (const item of data) {
      const div = document.getElementById(`trash-item-${item.index}`);
      this.dragger.addDraggable(div, {
        data: item.index,
        ghostMode: false,
        dragClass: item.isMenu
          ? 'dragging-menu-from-trash-tab'
          : 'dragging-item-from-trash-tab',
        dropTargets: item.isMenu ? [this.menusTab] : [this.stashTab, this.preview],
      });
    }

    // Set the counter value.
    const counter = this.container.querySelector('#kando-trash-tab-counter');
    counter.textContent = things.length.toString();
  }
}

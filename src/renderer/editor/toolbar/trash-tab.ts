//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { DropTargetTab } from './drop-target-tab';
import { ToolbarDraggable } from './toolbar-draggable';
import { IMenu } from '../../../common';
import { IEditorMenuItem } from '../common/editor-menu-item';
import { ItemTypeRegistry } from '../../../common/item-type-registry';
import { IconThemeRegistry } from '../../../common/icon-theme-registry';
import { IDraggable } from '../common/draggable';
import { DnDManager } from '../common/dnd-manager';

/**
 * This class represents the trash tab in the toolbar. Users can drop menus and menu items
 * here to delete them. Dropped items are stored in the trash until the user restarts the
 * application.
 */
export class TrashTab extends DropTargetTab {
  /**
   * This array is used to store menus and menu items which have been deleted by the user.
   * They can be restored by dragging them back to the stash, to the menus tab, or the
   * menu preview. They will not be saved to disc.
   */
  private trashedThings: Array<{
    thing: IMenu | IEditorMenuItem;
    draggable: IDraggable;
  }> = [];

  /**
   * This constructor is called after the general toolbar DOM has been created.
   *
   * @param container The container is the HTML element which contains the entire toolbar.
   * @param showShortcutIDs If true, menu buttons will show the shortcut IDs, instead of
   *   the shortcuts.
   * @param dndManager This is used to manage the drag'n'drop operations.
   */
  constructor(
    private container: HTMLElement,
    private showShortcutIDs: boolean,
    private dndManager: DnDManager
  ) {
    super(
      dndManager,
      ['menu', 'menu-item'],
      container.querySelector('#kando-trash-tab-header'),
      container.querySelector('#kando-trash-tab')
    );

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
    // First remove all existing trash items.
    this.trashedThings.forEach((thing) => {
      this.dndManager.unregisterDraggable(thing.draggable);
    });

    this.trashedThings = [];

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
    const template = require('./templates/stash-trash-tab.hbs');
    this.tabContent.innerHTML = template({
      type: 'trash',
      placeholderHeading: 'You can delete menus and menu items by dropping them here!',
      placeholderSubheading: 'When you restart Kando, they will be gone.',
      items: data,
    });

    // Add drag'n'drop logic to the things in the trash.
    things.forEach((thing, index) => {
      const div = this.tabContent.querySelector(`#trash-item-${index}`) as HTMLElement;
      const dataType = data[index].isMenu ? 'trashed-menu' : 'trashed-menu-item';

      const draggable = new ToolbarDraggable(div, dataType, false, () => thing);
      this.dndManager.registerDraggable(draggable);

      draggable.on('drop', () => {
        // Remove the dropped item from the trash.
        this.trashedThings = this.trashedThings.filter((t) => t.thing !== thing);

        // Redraw the trash tab.
        this.setTrashedThings(this.trashedThings.map((t) => t.thing));
      });

      this.trashedThings.push({ thing, draggable });
    });

    // Set the counter value.
    const counter = this.container.querySelector('#kando-trash-tab-counter');
    counter.textContent = things.length.toString();
  }

  /** @inheritdoc */
  override onDrop(draggable: IDraggable) {
    super.onDrop(draggable);

    // Add the dropped thing to the trash.
    this.setTrashedThings([
      ...this.trashedThings.map((thing) => thing.thing),
      draggable.getData() as IMenu | IEditorMenuItem,
    ]);
  }
}

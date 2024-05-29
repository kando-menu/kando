//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ToolbarDraggable } from './toolbar-draggable';
import { IMenu, IVec2 } from '../../../common';
import { IEditorMenuItem } from '../common/editor-menu-item';
import { ItemTypeRegistry } from '../../../common/item-type-registry';
import { IconThemeRegistry } from '../../../common/icon-theme-registry';
import { IDropTarget } from '../common/drop-target';
import { IDraggable } from '../common/draggable';
import { DnDManager } from '../common/dnd-manager';

/**
 * This class represents the trash tab in the toolbar. Users can drop menus and menu items
 * here to delete them. Dropped items are stored in the trash until the user restarts the
 * application.
 */
export class TrashTab implements IDropTarget {
  /** The container is the HTML element which contains the entire toolbar. */
  private container: HTMLElement = null;

  /** This is used to manage drag'n'drop operations. */
  private dndManager: DnDManager = null;

  /** If true, menu buttons will show the shortcut IDs, instead of the shortcuts. */
  private showShortcutIDs: boolean = false;

  /** This is the trash tab's HTML element. */
  private tabHeader: HTMLElement = null;

  /** This is the HTML element which contains the trash tab's content. */
  private tabContent: HTMLElement = null;

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
   */
  constructor(container: HTMLElement, showShortcutIDs: boolean, dndManager: DnDManager) {
    this.container = container;
    this.showShortcutIDs = showShortcutIDs;
    this.dndManager = dndManager;

    this.dndManager.registerDropTarget(this);

    // If a menu or menu item is started to be dragged, we highlight the trash tab.
    this.dndManager.on('drag-start', (draggable) => {
      if (draggable.getDataType() === 'menu' || draggable.getDataType() === 'menu-item') {
        this.tabHeader.classList.add('highlight-drop-target');
      }
    });

    // And remove the highlight when the drag operation ends.
    this.dndManager.on('drag-end', () => {
      this.tabHeader.classList.remove('highlight-drop-target');
    });

    // The tab has been created in the toolbar's constructor.
    this.tabHeader = this.container.querySelector('#kando-trash-tab-header');
    this.tabContent = this.container.querySelector('#kando-trash-tab');

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
      const dataType = data[index].isMenu ? 'menu' : 'menu-item';

      const draggable = new ToolbarDraggable(div, dataType, false, () => thing);
      this.dndManager.registerDraggable(draggable);

      draggable.on('drop', (target) => {
        this.trashedThings = this.trashedThings.filter((t) => t.thing !== thing);

        // If the target is the trash tab itself, we redraw the trash tab. Else this is
        // not necessary as this will happen in the `onDrop` method further down.
        if (target !== this) {
          this.setTrashedThings(this.trashedThings.map((t) => t.thing));
        }
      });

      this.trashedThings.push({ thing, draggable });
    });

    // Set the counter value.
    const counter = this.container.querySelector('#kando-trash-tab-counter');
    counter.textContent = things.length.toString();
  }

  // IDropTarget implementation ----------------------------------------------------------

  /** @inheritdoc */
  accepts(draggable: IDraggable, coords: IVec2) {
    // We only accept menus and menu items.
    if (draggable.getDataType() !== 'menu' && draggable.getDataType() !== 'menu-item') {
      return false;
    }

    // If the coords are inside the trash tab content, we accept the draggable.
    const rect = this.tabContent.getBoundingClientRect();
    if (
      coords.x >= rect.left &&
      coords.x <= rect.right &&
      coords.y >= rect.top &&
      coords.y <= rect.bottom
    ) {
      return true;
    }

    // Also accept the draggable if the coords are inside the trash tab header.
    const headerRect = this.tabHeader.getBoundingClientRect();
    if (
      coords.x >= headerRect.left &&
      coords.x <= headerRect.right &&
      coords.y >= headerRect.top &&
      coords.y <= headerRect.bottom
    ) {
      return true;
    }

    return false;
  }

  /** @inheritdoc */
  onDragEnter() {
    // If the trash tab is currently shown, we highlight it.
    if (this.tabContent.classList.contains('active')) {
      this.tabContent.classList.add('drop-target');
      return;
    }

    // Else we highlight the trash tab header.
    this.tabHeader.classList.add('drop-target');
  }

  /** @inheritdoc */
  onDragLeave() {
    this.tabContent.classList.remove('drop-target');
    this.tabHeader.classList.remove('drop-target');
  }

  /** @inheritdoc */
  onDropMove() {}

  /** @inheritdoc */
  onDropCancel() {
    this.tabContent.classList.remove('drop-target');
    this.tabHeader.classList.remove('drop-target');
  }

  /** @inheritdoc */
  onDrop(draggable: IDraggable) {
    this.tabContent.classList.remove('drop-target');
    this.tabHeader.classList.remove('drop-target');

    // Add the dropped thing to the trash.
    this.setTrashedThings([
      ...this.trashedThings.map((thing) => thing.thing),
      draggable.getData() as IMenu | IEditorMenuItem,
    ]);
  }
}

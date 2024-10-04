//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { DropTargetTab } from './drop-target-tab';
import { ToolbarDraggable } from './toolbar-draggable';
import { IMenu, IMenuItem, deepCopyMenu, deepCopyMenuItem } from '../../../common';
import { IEditorMenuItem } from '../common/editor-menu-item';
import { ItemTypeRegistry } from '../../../common/item-type-registry';
import { IconThemeRegistry } from '../../icon-themes/icon-theme-registry';
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
   * They can be restored by dragging them back to the templates, to the menus tab, or the
   * menu preview. They will not be saved to disc.
   */
  private trash: Array<IMenu | IEditorMenuItem> = [];

  /** This list contains a draggable for each trashed item. */
  private draggables: IDraggable[] = [];

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
      ['menu', 'menu-item', 'template-menu', 'template-menu-item'],
      container.querySelector('#kando-trash-tab-header'),
      container.querySelector('#kando-trash-tab')
    );

    this.redraw();
  }

  /** @inheritdoc */
  override onDrop(draggable: IDraggable) {
    super.onDrop(draggable);

    // Add the dropped thing to the trash. We need to deep copy it to avoid side effects.
    const menu = draggable.getData() as IMenu;
    if (menu.root) {
      this.trash.push(deepCopyMenu(menu));
    } else {
      this.trash.push(deepCopyMenuItem(draggable.getData() as IMenuItem));
    }

    this.redraw();
  }

  /**
   * This method is called when the user drops a menu or a menu item on the trash tab or
   * when an item is removed from the trash. It completely updates the trash tab's
   * content.
   */
  private redraw() {
    // First remove all existing trash items.
    this.draggables.forEach((draggable) => {
      this.dndManager.unregisterDraggable(draggable);
    });

    this.draggables = [];

    // Compile the data for the Handlebars template.
    const data = this.trash.map((thing, index) => {
      const menu = thing as IMenu;

      // If the item is a menu, we need to extract the name, the shortcut and the icon.
      if (menu.root) {
        return {
          isMenu: true,
          name: menu.root.name,
          description:
            (this.showShortcutIDs ? menu.shortcutID : menu.shortcut) || 'Not bound.',
          icon: IconThemeRegistry.getInstance().createIcon(
            menu.root.iconTheme,
            menu.root.icon
          ).outerHTML,
          index,
        };
      }

      // If the item is a menu item, we need to extract the name and the icon.
      const item = thing as IMenuItem;
      const typeInfo = ItemTypeRegistry.getInstance().getType(item.type);
      return {
        isMenu: false,
        name: item.name,
        description: typeInfo?.getDescription(item),
        icon: IconThemeRegistry.getInstance().createIcon(item.iconTheme, item.icon)
          .outerHTML,
        index,
      };
    });

    // Update the tab's content.
    const template = require('./templates/templates-trash-tab.hbs');
    this.tabContent.innerHTML = template({
      type: 'trash',
      placeholderHeading: i18next.t('toolbar.trash-tab.heading'),
      placeholderSubheading: i18next.t('toolbar.trash-tab.subheading'),
      items: data,
    });

    // Add drag'n'drop logic to the things in the trash.
    this.trash.forEach((thing, index) => {
      const div = this.tabContent.querySelector(`#trash-item-${index}`) as HTMLElement;
      const dataType = data[index].isMenu ? 'trashed-menu' : 'trashed-menu-item';

      const draggable = new ToolbarDraggable(div, dataType, false, () => thing);
      this.dndManager.registerDraggable(draggable);

      // Remove the dropped item from the trash.
      draggable.on('drop', (target, shouldCopy) => {
        if (!shouldCopy) {
          this.trash = this.trash.filter((t) => t !== thing);
          this.redraw();
        }
      });

      this.draggables.push(draggable);
    });

    // Set the counter value.
    const counter = this.container.querySelector('#kando-trash-tab-counter');
    counter.textContent = this.trash.length.toString();
  }
}

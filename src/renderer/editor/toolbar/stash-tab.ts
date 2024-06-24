//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { DropTargetTab } from './drop-target-tab';
import { IMenuItem, IMenuSettings, deepCopyMenuItem } from '../../../common';
import { ItemTypeRegistry } from '../../../common/item-type-registry';
import { IconThemeRegistry } from '../../../common/icon-theme-registry';
import { IDraggable } from '../common/draggable';
import { DnDManager } from '../common/dnd-manager';
import { ToolbarDraggable } from './toolbar-draggable';

/**
 * This class represents the stash tab in the toolbar. Users can drop menu items here to
 * stash them for later use.
 */
export class StashTab extends DropTargetTab {
  /**
   * This is used to access the stash. When the editor is closed, the settings are saved
   * to disc.
   */
  private menuSettings: IMenuSettings = null;

  /** This list contains a draggable for each stashed item. */
  private draggables: IDraggable[] = [];

  /**
   * This constructor is called after the general toolbar DOM has been created.
   *
   * @param container The container is the HTML element which contains the entire toolbar.
   * @param dndManager This is used to manage the drag'n'drop operations.
   */
  constructor(
    private container: HTMLElement,
    private dndManager: DnDManager
  ) {
    super(
      dndManager,
      ['menu-item', 'trashed-menu-item'],
      container.querySelector('#kando-stash-tab-header'),
      container.querySelector('#kando-stash-tab')
    );
  }

  /**
   * This method is called initially to set the stash. It is called by the toolbar
   * whenever the editor is opened.
   *
   * @param menuSettings The menu settings contains the stash.
   */
  public init(menuSettings: IMenuSettings) {
    this.menuSettings = menuSettings;
    this.redraw();
  }

  /** @inheritdoc */
  override onDrop(draggable: IDraggable) {
    super.onDrop(draggable);

    // Add the dropped thing to the trash. We drop a copy of the item to the stash.
    this.menuSettings.stash.push(deepCopyMenuItem(draggable.getData() as IMenuItem));
    this.redraw();
  }

  // Private Methods ---------------------------------------------------------------------

  /**
   * This method is called whenever a stash item is added or removed. It updates the
   * entire stash tab.
   */
  private redraw() {
    // First remove all existing stash items.
    this.draggables.forEach((draggable) => {
      this.dndManager.unregisterDraggable(draggable);
    });

    this.draggables = [];

    // Compile the data for the Handlebars template.
    const data = this.menuSettings.stash.map((item, index) => {
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
      type: 'stash',
      placeholderHeading: 'You can temporarily store menu items here!',
      placeholderSubheading:
        'This is useful if you want to reorganize your menus. They will be saved.',
      items: data,
    });

    // Add drag'n'drop logic to the items in the stash.
    this.menuSettings.stash.forEach((item, index) => {
      const div = this.tabContent.querySelector(`#stash-item-${index}`) as HTMLElement;

      const draggable = new ToolbarDraggable(div, 'stashed-menu-item', false, () => item);
      this.dndManager.registerDraggable(draggable);

      // Remove the dropped item from the stash.
      draggable.on('drop', (target, shouldCopy) => {
        if (!shouldCopy) {
          this.menuSettings.stash = this.menuSettings.stash.filter((i) => i !== item);
          this.redraw();
        }
      });

      this.draggables.push(draggable);
    });

    // Set the counter value.
    const counter = this.container.querySelector('#kando-stash-tab-counter');
    counter.textContent = this.menuSettings.stash.length.toString();
  }
}

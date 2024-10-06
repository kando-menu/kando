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
import {
  IMenu,
  IMenuItem,
  IMenuSettings,
  deepCopyMenu,
  deepCopyMenuItem,
} from '../../../common';
import { ItemTypeRegistry } from '../../../common/item-type-registry';
import { IconThemeRegistry } from '../../icon-themes/icon-theme-registry';
import { IDraggable } from '../common/draggable';
import { DnDManager } from '../common/dnd-manager';
import { ToolbarDraggable } from './toolbar-draggable';
import { TrashTab } from './trash-tab';

/**
 * This class represents the templates tab in the toolbar. Users can drop menus and menu
 * items here to store them as templates. Templates can be used to quickly create new
 * menus or menu items. They are stored in the settings and will be available after
 * restarting the application.
 */
export class TemplatesTab extends DropTargetTab {
  /**
   * This is used to access the templates. When the editor is closed, the settings are
   * saved to disc.
   */
  private menuSettings: IMenuSettings = null;

  /** This list contains a draggable for each template. */
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
      ['menu', 'menu-item', 'trashed-menu-item'],
      container.querySelector('#kando-templates-tab-header'),
      container.querySelector('#kando-templates-tab')
    );
  }

  /**
   * This method is called initially to set the templates. It is called by the toolbar
   * whenever the editor is opened.
   *
   * @param menuSettings The menu settings contain the templates.
   */
  public init(menuSettings: IMenuSettings) {
    this.menuSettings = menuSettings;
    this.redraw();
  }

  /** @inheritdoc */
  override onDrop(draggable: IDraggable) {
    super.onDrop(draggable);

    // Add the dropped thing to the templates. We need to deep copy it to avoid side effects.
    const menu = draggable.getData() as IMenu;
    if (menu.root) {
      this.menuSettings.templates.push(deepCopyMenu(menu));
    } else {
      this.menuSettings.templates.push(
        deepCopyMenuItem(draggable.getData() as IMenuItem)
      );
    }

    this.redraw();
  }

  // Private Methods ---------------------------------------------------------------------

  /**
   * This method is called whenever a template item is added or removed. It updates the
   * entire template tab.
   */
  private redraw() {
    // First remove all existing template items.
    this.draggables.forEach((draggable) => {
      this.dndManager.unregisterDraggable(draggable);
    });

    this.draggables = [];

    // Compile the data for the Handlebars template.
    const data = this.menuSettings.templates.map((thing, index) => {
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
      type: 'template',
      placeholderHeading: i18next.t('toolbar.templates-tab.heading'),
      placeholderSubheading: i18next.t('toolbar.templates-tab.subheading'),
      items: data,
    });

    // Add drag'n'drop logic to the template items.
    this.menuSettings.templates.forEach((thing, index) => {
      const div = this.tabContent.querySelector(`#template-item-${index}`) as HTMLElement;
      const dataType = data[index].isMenu ? 'template-menu' : 'template-menu-item';

      const draggable = new ToolbarDraggable(div, dataType, true, () => {
        if (data[index].isMenu) {
          return deepCopyMenu(thing as IMenu);
        } else {
          return deepCopyMenuItem(thing as IMenuItem);
        }
      });
      this.dndManager.registerDraggable(draggable);

      // Remove the dropped item from the templates tab when it is dropped on the trash
      // tab.
      draggable.on('drop', (target, shouldCopy) => {
        if (!shouldCopy && target instanceof TrashTab) {
          this.menuSettings.templates = this.menuSettings.templates.filter(
            (i) => i !== thing
          );
          this.redraw();
        }
      });

      this.draggables.push(draggable);
    });

    // Set the counter value.
    const counter = this.container.querySelector('#kando-templates-tab-counter');
    counter.textContent = this.menuSettings.templates.length.toString();
  }
}

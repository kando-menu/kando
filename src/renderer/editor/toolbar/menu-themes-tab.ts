//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';
import { IMenuThemeDescription } from '../../../common';

/**
 * This class is responsible for the menu-theme selection tab in the toolbar. It is an
 * event emitter which emits the following events:
 *
 * @fires select-theme - This event is emitted when the user selects a menu theme. The
 *   folder name of the selected theme is passed as an argument.
 */
export class MenuThemesTab extends EventEmitter {
  /**
   * This constructor is called after the general toolbar DOM has been created.
   *
   * @param container The container is the HTML element which contains the entire toolbar.
   */
  constructor(private container: HTMLElement) {
    super();
  }

  /**
   * This method is called initially to set the menu themes. It is called by the toolbar
   * whenever the editor is opened.
   *
   * @param allMenuThemes An array of all available menu themes.
   * @param currentMenu The currently selected menu theme.
   */
  public init(
    allMenuThemes: Array<IMenuThemeDescription>,
    currentMenu: IMenuThemeDescription
  ) {
    // Compile the data for the Handlebars template.
    // const data = this.menuThemes.map((menu, index) => ({
    //   name: menu.root.name,
    //   checked: index === this.currentMenu,
    //   description:
    //     (this.showShortcutIDs ? menu.shortcutID : menu.shortcut) || 'Not bound.',
    //   icon: IconThemeRegistry.getInstance()
    //     .getTheme(menu.root.iconTheme)
    //     .createDiv(menu.root.icon).outerHTML,
    //   index,
    // }));
    // const template = require('./templates/menus-tab.hbs');
    // this.tabContent.innerHTML = template({ menus: data });
  }
}

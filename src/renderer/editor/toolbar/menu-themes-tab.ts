//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { Tooltip } from 'bootstrap';
import { EventEmitter } from 'events';

import { IAppSettings, IMenuThemeDescription } from '../../../common';

/**
 * This class is responsible for the menu-theme selection tab in the toolbar. It is an
 * event emitter which emits the following events:
 *
 * @fires select-theme - This event is emitted when the user selects a menu theme. The
 *   folder name of the selected theme is passed as an argument.
 */
export class MenuThemesTab extends EventEmitter {
  /** This is the HTML element which contains the tab's content. */
  private tabContent: HTMLElement;

  /**
   * This constructor is called after the general toolbar DOM has been created.
   *
   * @param container The container is the HTML element which contains the entire toolbar.
   */
  constructor(container: HTMLElement) {
    super();

    this.tabContent = container.querySelector('#kando-menu-themes-tab');
  }

  /**
   * This method is called initially to set the menu themes. It is called by the toolbar
   * whenever the editor is opened.
   *
   * @param appSettings The app settings object.
   * @param allMenuThemes An array of all available menu themes.
   * @param currentTheme The currently selected menu theme.
   */
  public init(
    appSettings: IAppSettings,
    allMenuThemes: Array<IMenuThemeDescription>,
    currentTheme: IMenuThemeDescription
  ) {
    // Compile the data for the Handlebars template.
    const data = allMenuThemes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      author: theme.author,
      checked: theme.id === currentTheme.id,
      preview: 'file://' + theme.directory + '/' + theme.id + '/preview.jpg',
      colors: theme.colors,
    }));

    const template = require('./templates/menu-themes-tab.hbs');
    this.tabContent.innerHTML = template({ themes: data });

    // Initialize all tooltips.
    this.tabContent.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((elem) => {
      new Tooltip(elem, {
        delay: { show: 500, hide: 0 },
      });
    });

    const allThemeButtons = this.tabContent.querySelectorAll('.toolbar-theme-button');
    allThemeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        allThemeButtons.forEach((button) => {
          button.classList.remove('checked');
        });
        button.classList.add('checked');
        this.emit('select-theme', button.getAttribute('data-theme-id'));
      });
    });

    const darkMode = this.tabContent.querySelector(
      '#kando-menu-theme-enable-dark-mode'
    ) as HTMLInputElement;
    darkMode.addEventListener('change', () => {
      window.api.appSettings.setKey('enableDarkModeForMenuThemes', darkMode.checked);
    });
    darkMode.checked = appSettings.enableDarkModeForMenuThemes;
  }
}

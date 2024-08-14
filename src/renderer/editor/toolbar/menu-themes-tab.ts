//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { Tooltip } from 'bootstrap';
import iro from '@jaames/iro';

import { IMenuThemeDescription } from '../../../common';

/**
 * This class is responsible for the menu-theme selection tab in the toolbar. It directly
 * interacts with the main process to set the menu theme.
 */
export class MenuThemesTab {
  /** This is the HTML element which contains the tab's content. */
  private tabContent: HTMLElement;

  /** This is an array of all available menu themes. */
  private allMenuThemes: Array<IMenuThemeDescription>;

  /** This is a flag which is set to true if the dark mode is currently enabled. */
  private darkMode: boolean;

  /**
   * This constructor is called after the general toolbar DOM has been created.
   *
   * @param container The container is the HTML element which contains the entire toolbar.
   */
  constructor(container: HTMLElement) {
    this.tabContent = container.querySelector('#kando-menu-themes-tab');

    window.api.darkModeChanged((darkMode) => {
      this.darkMode = darkMode;
      this.redraw();
    });

    window.api.appSettings.onChange('enableDarkModeForMenuThemes', () => this.redraw());
  }

  /**
   * This method is called initially to set the menu themes. It is called by the toolbar
   * whenever the editor is opened.
   *
   * @param allMenuThemes An array of all available menu themes.
   */
  public init(allMenuThemes: Array<IMenuThemeDescription>) {
    this.allMenuThemes = allMenuThemes;
    window.api.getIsDarkMode().then((darkMode) => {
      this.darkMode = darkMode;
      this.redraw();
    });
  }

  private async redraw() {
    const enableDarkMode = await window.api.appSettings.getKey(
      'enableDarkModeForMenuThemes'
    );

    const [currentTheme, colorOverrides] = await Promise.all([
      window.api.getMenuTheme(),
      window.api.appSettings.getKey(
        this.darkMode && enableDarkMode ? 'darkMenuThemeColors' : 'menuThemeColors'
      ),
    ]);

    // Compile the data for the Handlebars template.
    const data = this.allMenuThemes.map((theme) => {
      const colors = theme.colors.map((color) => {
        const themeOverride = colorOverrides.find((c) => c.theme === theme.id);
        const colorOverride = themeOverride?.colors.find((c) => c.name === color.name);
        return {
          name: color.name,
          value: colorOverride?.color || color.default,
        };
      });

      return {
        id: theme.id,
        name: theme.name,
        author: theme.author,
        checked: theme.id === currentTheme.id,
        preview: 'file://' + theme.directory + '/' + theme.id + '/preview.jpg',
        colors,
      };
    });

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
        const theme = button.getAttribute('data-theme-id');

        if (this.darkMode && enableDarkMode) {
          window.api.appSettings.setKey('darkMenuTheme', theme);
        } else {
          window.api.appSettings.setKey('menuTheme', theme);
        }
      });
    });

    const darkModeCheckbox = this.tabContent.querySelector(
      '#kando-menu-theme-enable-dark-mode'
    ) as HTMLInputElement;
    darkModeCheckbox.addEventListener('change', () => {
      window.api.appSettings.setKey(
        'enableDarkModeForMenuThemes',
        darkModeCheckbox.checked
      );
    });
    darkModeCheckbox.checked = enableDarkMode;

    this.allMenuThemes.forEach((theme) => {
      const container = this.tabContent.querySelector(
        `div[data-theme-id="${theme.id}"] .color-picker`
      ) as HTMLElement;
      const colorPicker = iro.ColorPicker(container, {
        layoutDirection: 'horizontal',
        width: 200,
        layout: [
          {
            component: iro.ui.Wheel,
          },
          {
            component: iro.ui.Slider,
            options: {
              sliderType: 'value',
            },
          },
          {
            component: iro.ui.Slider,
            options: {
              sliderType: 'alpha',
            },
          },
        ],
      });
    });
  }
}

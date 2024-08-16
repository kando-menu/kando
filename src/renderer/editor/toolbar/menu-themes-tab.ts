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

  /** This is an array of all color overrides. */
  private colorOverrides: Array<{
    theme: string;
    colors: Array<{
      name: string;
      color: string;
    }>;
  }>;

  /** This is a flag which is set to true if the system is currently in dark mode. */
  private darkMode: boolean;

  /**
   * This is a flag which is set to true if a separate theme and colors are used in dark
   * mode.
   */
  private enableDarkMode: boolean;

  /** This is an array of all color pickers. There's one for each theme card. */
  private colorPickers: Array<{
    wrapper: HTMLElement;
    picker: iro.ColorPicker;
    themeID: string;
    currentColor: string;
    textEntry: HTMLInputElement;
    resetButton: HTMLButtonElement;
    doneButton: HTMLButtonElement;
  }> = [];

  /** This timeout is used to avoid submitting changes too often. */
  private submitChangesTimeout: NodeJS.Timeout;

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
    this.enableDarkMode = await window.api.appSettings.getKey(
      'enableDarkModeForMenuThemes'
    );

    const [currentTheme, colorOverrides] = await Promise.all([
      window.api.getMenuTheme(),
      window.api.appSettings.getKey(
        this.darkMode && this.enableDarkMode ? 'darkMenuThemeColors' : 'menuThemeColors'
      ),
    ]);

    this.colorOverrides = colorOverrides;

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

    // Select the theme if the entire card is clicked.
    const allThemeButtons = this.tabContent.querySelectorAll('.toolbar-theme-button');
    allThemeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        allThemeButtons.forEach((button) => {
          button.classList.remove('checked');
        });
        button.classList.add('checked');
        const theme = button.getAttribute('data-theme-id');

        if (this.darkMode && this.enableDarkMode) {
          window.api.appSettings.setKey('darkMenuTheme', theme);
        } else {
          window.api.appSettings.setKey('menuTheme', theme);
        }
      });
    });

    // Toggle the separate theme-in-dark-mode setting.
    const darkModeCheckbox = this.tabContent.querySelector(
      '#kando-menu-theme-enable-dark-mode'
    ) as HTMLInputElement;
    darkModeCheckbox.addEventListener('change', () => {
      window.api.appSettings.setKey(
        'enableDarkModeForMenuThemes',
        darkModeCheckbox.checked
      );
    });
    darkModeCheckbox.checked = this.enableDarkMode;

    // Add all color pickers.
    this.colorPickers = [];
    this.allMenuThemes.forEach((theme) => {
      const card = this.tabContent.querySelector(
        `div[data-theme-id="${theme.id}"]`
      ) as HTMLElement;

      const pickerContainer = card.querySelector('.color-picker') as HTMLElement;
      const wrapper = pickerContainer.parentElement.parentElement;
      const textEntry = card.querySelector('input') as HTMLInputElement;
      const [resetButton, doneButton] = card.querySelectorAll('button');

      const picker = iro.ColorPicker(pickerContainer, {
        layoutDirection: 'horizontal',
        width: 200,
        padding: 5,
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

      const colorPickerInfo = {
        wrapper,
        picker,
        themeID: theme.id,
        currentColor: '',
        textEntry,
        resetButton: resetButton as HTMLButtonElement,
        doneButton: doneButton as HTMLButtonElement,
      };

      doneButton.addEventListener('click', () => {
        wrapper.classList.add('hidden');
      });

      picker.on('color:change', (color: iro.Color) => {
        textEntry.value = color.rgbaString;

        const button = card.querySelector(
          `.color-button[data-color-name="${colorPickerInfo.currentColor}"]`
        ) as HTMLElement;

        button.style.backgroundColor = color.rgbaString;

        colorOverrides.forEach((themeOverride) => {
          if (themeOverride.theme === theme.id) {
            themeOverride.colors.forEach((colorOverride) => {
              if (colorOverride.name === colorPickerInfo.currentColor) {
                colorOverride.color = color.rgbaString;
              }
            });
          }
        });

        this.submitChanges();
      });

      textEntry.addEventListener('input', () => {
        picker.color.set(textEntry.value);
      });

      resetButton.addEventListener('click', () => {
        const colors = this.allMenuThemes.find((t) => t.id === theme.id).colors;
        const color = colors.find((c) => c.name === colorPickerInfo.currentColor);
        picker.color.set(color.default);
      });

      this.colorPickers.push(colorPickerInfo);
    });

    // Show the color picker when a color button is clicked.
    this.tabContent.querySelectorAll('.color-button').forEach((button) => {
      button.addEventListener('click', () => {
        const themeID = button.getAttribute('data-theme-id');
        const colorName = button.getAttribute('data-color-name');
        const colorPicker = this.colorPickers.find(
          (picker) => picker.themeID === themeID
        );
        colorPicker.currentColor = colorName;
        colorPicker.wrapper.classList.remove('hidden');
        colorPicker.picker.color.set((button as HTMLElement).style.backgroundColor);
        colorPicker.textEntry.value = colorPicker.picker.color.rgbaString;
      });
    });
  }

  /**
   * We submit changes to the main process not too often to avoid unnecessary IPC calls.
   * After the user has stopped interacting with the color picker for 500ms, we submit the
   * changes.
   */
  private submitChanges() {
    if (this.submitChangesTimeout) {
      clearTimeout(this.submitChangesTimeout);
    }
    this.submitChangesTimeout = setTimeout(() => {
      this.submitChangesTimeout = null;

      if (this.darkMode && this.enableDarkMode) {
        window.api.appSettings.setKey('darkMenuThemeColors', this.colorOverrides);
      } else {
        window.api.appSettings.setKey('menuThemeColors', this.colorOverrides);
      }
    }, 500);
  }
}

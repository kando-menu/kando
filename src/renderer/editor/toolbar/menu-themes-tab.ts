//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { Tooltip } from 'bootstrap';
import iro from '@jaames/iro';
import lodash from 'lodash';

import { IMenuThemeDescription } from '../../../common';

/**
 * This class is responsible for the menu-theme selection tab in the toolbar. It directly
 * interacts with the main process to set the menu theme and the colors of the menu
 * theme.
 */
export class MenuThemesTab {
  /** This is the HTML element which contains the tab's content. */
  private tabContent: HTMLElement;

  /**
   * This is an array of all available menu themes. It is retrieved once when the editor
   * is opened.
   */
  private allMenuThemes: Array<IMenuThemeDescription>;

  /**
   * This is an array of all color overrides. This is updated whenever the user changes a
   * color. Also, when the system switches between dark and light mode, the colors are
   * reloaded from the main process.
   */
  private colorOverrides: Record<string, Record<string, string>>;

  /** `true` if the system is currently in dark mode. */
  private darkMode: boolean;

  /** `true` if a separate theme and colors should be used in dark mode. */
  private enableDarkMode: boolean;

  /**
   * This is an array with information on each color pickers. There's one color picker for
   * each theme card.
   */
  private colorPickers: Array<{
    /** This is the actual color picker. */
    picker: iro.ColorPicker;

    /** This is the ID of the theme the color picker is for. */
    themeID: string;

    /** This is the name of the currently selected color. */
    currentColor: string;

    /** This is the text entry field which shows the current color. */
    textEntry: HTMLInputElement;

    /** This is the div which shows the color's name. */
    colorName: HTMLElement;
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

    // Redraw the tab whenever the system switches between dark and light mode.
    window.api.darkModeChanged((darkMode) => {
      this.darkMode = darkMode;
      this.redraw();
    });

    // We also have to redraw the tab whenever the user changes the separate-theme-and-
    // colors-for-dark-mode setting.
    window.api.appSettings.onChange('enableDarkModeForMenuThemes', (enableDarkMode) => {
      this.enableDarkMode = enableDarkMode;
      this.redraw();
    });
  }

  /** This method is called initially by the toolbar whenever the editor is opened. */
  public async init() {
    [this.allMenuThemes, this.darkMode, this.enableDarkMode] = await Promise.all([
      window.api.getAllMenuThemes(),
      window.api.getIsDarkMode(),
      window.api.appSettings.getKey('enableDarkModeForMenuThemes'),
    ]);

    this.redraw();
  }

  /**
   * This method is called whenever the system switches between dark and light mode. It
   * completely redraws the tab and wires up all event listeners.
   */
  private async redraw() {
    // We need the current theme and the color overrides. Both may depend on the dark mode
    // system setting.
    const [currentTheme, colorOverrides] = await Promise.all([
      window.api.getMenuTheme(),
      window.api.appSettings.getKey(
        this.darkMode && this.enableDarkMode ? 'darkMenuThemeColors' : 'menuThemeColors'
      ),
    ]);

    this.colorOverrides = colorOverrides;

    // Compile the data for the Handlebars template and render it. We pass the current
    // theme information and the list of colors for each theme. We have to check for
    // each color if there is a color override.
    const themeData = this.allMenuThemes.map((theme) => {
      let previewPath = 'file://' + theme.directory + '/' + theme.id + '/preview.jpg';

      // On Windows, we have to replace backslashes with slashes to make the path work.
      if (cIsWindows) {
        previewPath = previewPath.replace(/\\/g, '/');
      }

      return {
        id: theme.id,
        name: theme.name,
        author: i18next.t('toolbar.menu-themes-tab.author', {
          author: theme.author,
        }),
        checked: theme.id === currentTheme.id,
        preview: encodeURI(previewPath),
        colors: lodash.merge({}, theme.colors, colorOverrides[theme.id]),
      };
    });

    let subheading = i18next.t('toolbar.menu-themes-tab.system-mode-subheading');
    if (this.enableDarkMode) {
      subheading = this.darkMode
        ? i18next.t('toolbar.menu-themes-tab.system-mode-subheading-dark')
        : i18next.t('toolbar.menu-themes-tab.system-mode-subheading-light');
    }

    const template = require('./templates/menu-themes-tab.hbs');
    this.tabContent.innerHTML = template({
      themes: themeData,
      darkMode: this.enableDarkMode,
      strings: {
        hint: i18next.t('toolbar.menu-themes-tab.hint', {
          repositoryLink: 'target=_blank href=https://github.com/kando-menu/menu-themes',
          tutorialLink: 'target=_blank href=https://kando.menu/create-menu-themes/',
          discordLink: 'target=_blank href=https://discord.gg/hZwbVSDkhy',
        }),
        editColors: i18next.t('toolbar.menu-themes-tab.edit-colors'),
        darkMode: i18next.t('toolbar.menu-themes-tab.dark-mode'),
        darkModeHint: subheading,
        closeColorPicker: i18next.t('toolbar.menu-themes-tab.close-color-picker'),
        resetColorPicker: i18next.t('toolbar.menu-themes-tab.reset-color-picker'),
      },
    });

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
        // Unselect all theme cards and select the clicked one.
        allThemeButtons.forEach((button) => {
          button.classList.remove('checked');
        });
        button.classList.add('checked');

        // Set the new theme in the main process. This will directly write to the
        // settings file.
        const theme = button.getAttribute('data-theme-id');
        if (this.darkMode && this.enableDarkMode) {
          window.api.appSettings.setKey('darkMenuTheme', theme);
        } else {
          window.api.appSettings.setKey('menuTheme', theme);
        }
      });
    });

    // Toggle the separate-theme-in-dark-mode setting.
    const checkbox = this.tabContent.querySelector(
      '#kando-menu-theme-enable-dark-mode'
    ) as HTMLInputElement;
    checkbox.addEventListener('change', () => {
      window.api.appSettings.setKey('enableDarkModeForMenuThemes', checkbox.checked);
    });

    // Add all color pickers. There's one color picker for each theme card.
    this.colorPickers = this.allMenuThemes.map((theme) => {
      const card = this.tabContent.querySelector(
        `div[data-theme-id="${theme.id}"]`
      ) as HTMLElement;

      // This is a bit hard-coded here. We could use individual classes to retrieve the
      // elements, but it also works this way. You can have a look at the Handlebars
      // template to see how the elements are structured.
      const pickerContainer = card.querySelector('.color-picker') as HTMLElement;
      const textEntry = card.querySelector('input') as HTMLInputElement;
      const [resetButton, doneButton] = card.querySelectorAll('button');
      const editColorsButton = card.querySelector('.edit-colors-button') as HTMLElement;
      const colorName = card.querySelector('.color-name') as HTMLElement;

      const picker = iro.ColorPicker(pickerContainer, {
        width: 150,
        padding: 5,
        handleRadius: 10,
        layoutDirection: 'horizontal',
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

      // Prevent clicks on the color picker from selecting the theme.
      pickerContainer.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // This will be stored in the colorPickers info object.
      const colorPickerInfo = {
        picker,
        themeID: theme.id,
        currentColor: '',
        textEntry,
        colorName,
      };

      // Show the color picker when the edit colors button is clicked.
      editColorsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.add('color-picker-visible');
        this.editColor(theme.id, Object.keys(theme.colors)[0]);
      });

      // Hide the color picker when the done button is clicked.
      doneButton.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.remove('color-picker-visible');
      });

      // Reset all colors to the default value when the reset button is clicked. For this,
      // we have to manually reset the background color of all color buttons, updated the
      // color picker's current color and remove the entire set of color overrides for the
      // current theme.
      resetButton.addEventListener('click', (e) => {
        e.stopPropagation();

        const overrides = this.colorOverrides[theme.id];
        if (overrides) {
          Object.keys(overrides).forEach((colorName) => {
            const defaultColor = theme.colors[colorName];

            if (colorName === colorPickerInfo.currentColor) {
              picker.color.set(defaultColor);
            }

            const button = card.querySelector(
              `.color-button[data-color-name="${colorName}"]`
            ) as HTMLElement;
            button.style.backgroundColor = defaultColor;
          });

          delete this.colorOverrides[theme.id];

          this.submitChanges();
        }
      });

      // Set the color when the text entry field is changed.
      textEntry.addEventListener('input', () => {
        picker.color.set(textEntry.value);
      });

      // Prevent clicks on the text entry field from selecting the theme.
      textEntry.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // Submit changes when the color is changed. We update the color of the color
      // button, the text entry field and the value stored in our colorOverrides array.
      // Finally, the changes are submitted to the main process.
      picker.on('color:change', (color: iro.Color) => {
        const button = card.querySelector(
          `.color-button[data-color-name="${colorPickerInfo.currentColor}"]`
        ) as HTMLElement;

        button.style.backgroundColor = color.rgbaString;
        textEntry.value = color.rgbaString;

        this.colorOverrides[theme.id] = this.colorOverrides[theme.id] || {};
        this.colorOverrides[theme.id][colorPickerInfo.currentColor] = color.rgbaString;

        this.submitChanges();
      });

      return colorPickerInfo;
    });

    // Show the color picker when a color button is clicked.
    this.tabContent.querySelectorAll('.color-button').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const themeID = button.getAttribute('data-theme-id');
        const colorName = button.getAttribute('data-color-name');
        this.editColor(themeID, colorName);
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

  /**
   * This method is called when the user clicks on one of the color buttons. It updates
   * the color picker and the text entry field to reflect the new color.
   *
   * @param themeID The ID of the theme the color belongs to.
   * @param colorName The name of the color which was clicked.
   */
  private editColor(themeID: string, colorName: string) {
    const card = this.tabContent.querySelector(
      `div[data-theme-id="${themeID}"]`
    ) as HTMLElement;

    const colorPicker = this.colorPickers.find((picker) => picker.themeID === themeID);
    colorPicker.currentColor = colorName;
    colorPicker.textEntry.value = colorPicker.picker.color.rgbaString;
    colorPicker.colorName.innerText = colorName;

    const buttons = card.querySelectorAll('.color-button') as NodeListOf<HTMLElement>;
    buttons.forEach((button) => {
      if (button.getAttribute('data-color-name') === colorName) {
        button.classList.add('selected');
        colorPicker.picker.color.set(button.style.backgroundColor);
      } else {
        button.classList.remove('selected');
      }
    });
  }
}

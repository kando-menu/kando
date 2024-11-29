//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';
import { EventEmitter } from 'events';

import { IconThemeRegistry, IIconPicker } from '../../icon-themes/icon-theme-registry';

/**
 * This class is responsible for displaying the icon picker of the menu editor. It emits
 * events when the user chooses a new icon. Whenever an icon is clicked at, the `select`
 * event is emitted. Clicking the Done button will only close the icon picker. The cancel
 * button will also emit the close event, but right before the 'close' event a 'select'
 * event is emitted with the original icon and theme.
 *
 * @fires hide - When the user closes the icon picker via one of the two buttons.
 * @fires select - When the user selected an icon. The event contains the icon and the
 *   theme of the selected icon as arguments.
 */
export class IconPicker extends EventEmitter {
  /** The container to which the icon picker is appended. */
  private container: HTMLElement = null;

  /** This contains the actual icon picker. */
  private pickerContainer: HTMLElement = null;

  /** The icon picker implementation depends on the selected theme. */
  private picker: IIconPicker = null;

  /** The select field for choosing the icon theme. */
  private themeSelect: HTMLSelectElement = null;

  /** The icon and theme that were selected when the icon picker was opened. */
  private initialTheme: string = null;
  private initialIcon: string = null;

  /**
   * Creates a new IconPicker and appends it to the given container.
   *
   * @param container - The container to which the icon picker will be appended.
   */
  constructor(container: HTMLElement) {
    super();

    this.container = container;

    // The contents of the icon-theme select field are generated using the Handlebars
    // template below. The data object contains an array of objects with the keys `name`
    // and `key`. The `name` is the display name of the theme and the `key` is the key
    // that is used to identify the theme in the IconThemeRegistry.
    const data = {
      strings: {
        heading: i18next.t('properties.icon-picker.heading'),
        subheading: i18next.t('properties.icon-picker.subheading', {
          path: IconThemeRegistry.getInstance().userIconThemeDirectory,
          link: 'href="https://kando.menu/icon-themes/" target="_blank"',
        }),
        cancel: i18next.t('properties.common.cancel'),
        done: i18next.t('properties.common.done'),
      },
      themes: new Array<{ name: string; key: string }>(),
    };
    const themes = IconThemeRegistry.getInstance().getThemes();
    themes.forEach((theme, key) => {
      data.themes.push({ name: theme.name, key });
    });

    const template = require('./templates/icon-picker.hbs');
    container.classList.value = 'd-flex flex-column justify-content-center hidden';
    container.innerHTML = template(data);

    // Store a reference to the icon picker container and the theme select field.
    this.pickerContainer = container.querySelector('#kando-properties-icon-picker');

    this.themeSelect = container.querySelector(
      '#kando-properties-icon-theme-select'
    ) as HTMLSelectElement;

    this.themeSelect.addEventListener('change', () => this.initPicker());

    // Close the icon picker when the user clicks the close button.
    const okButton = container.querySelector('#kando-properties-icon-picker-ok');
    okButton.addEventListener('click', () => this.hide());

    // Also close the icon picker when the user clicks the cancel button. But before
    // closing the icon picker, emit a select event with the original icon and theme.
    const cancelButton = container.querySelector('#kando-properties-icon-picker-cancel');
    cancelButton.addEventListener('click', () => {
      this.emit('select', this.initialIcon, this.initialTheme);
      this.hide();
    });
  }

  /**
   * Shows the icon picker. The icon picker will open with the given icon and theme
   * selected.
   *
   * @param icon - The icon that should be selected.
   * @param theme - The theme that should be selected.
   */
  public show(icon: string, theme: string) {
    this.container.classList.remove('hidden');
    this.initialIcon = icon;
    this.initialTheme = theme;

    this.themeSelect.value = theme;

    this.initPicker();
  }

  /** Hides the icon picker. */
  public hide() {
    if (this.picker) {
      this.picker.deinit();
    }

    this.container.classList.add('hidden');

    this.emit('hide');
  }

  /** Initializes the icon picker. */
  private initPicker() {
    const theme = this.themeSelect.value;

    if (this.picker) {
      this.picker.deinit();
    }

    this.picker = IconThemeRegistry.getInstance().createIconPicker(theme);

    this.pickerContainer.innerHTML = '';
    this.pickerContainer.appendChild(this.picker.getFragment());

    this.picker.init(this.initialIcon);
    this.picker.onSelect((icon) => this.emit('select', icon, theme));
    this.picker.onClose(() => this.hide());
  }
}

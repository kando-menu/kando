//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import Handlebars from 'handlebars';
import { EventEmitter } from 'events';
import { IconThemeRegistry } from '../../../common/icon-theme-registry';

/**
 * This class is responsible for displaying an icon picker. It emits events when the user
 * selects a new icon. In fact, whenever a new icon is selected, the `select-icon` event
 * is emitted. Clicking the Done button will only close the icon picker. The cancel button
 * will also emit the close event. but before a final select event is emitted with the
 * initial icon and theme.
 *
 * @fires close - When the user closes the icon picker via one of the two buttons.
 * @fires select - When the user selected an icon. The event contains the icon and the
 *   theme of the selected icon as arguments.
 */
export class IconPicker extends EventEmitter {
  private filterInput: HTMLInputElement = null;
  private themeSelect: HTMLSelectElement = null;
  private iconGrid: HTMLElement = null;

  private initialTheme: string = null;
  private initialIcon: string = null;

  constructor(container: HTMLElement) {
    super();

    const data: { themes: { name: string; key: string }[] } = { themes: [] };
    const themes = IconThemeRegistry.getInstance().getIconThemes();
    themes.forEach((theme, key) => {
      data.themes.push({ name: theme.name, key });
    });

    const template = Handlebars.compile(require('./templates/icon-picker.hbs').default);
    container.innerHTML = template(data);

    this.iconGrid = container.querySelector('#kando-properties-icon-picker-grid');

    this.filterInput = container.querySelector(
      '#kando-properties-icon-filter'
    ) as HTMLInputElement;

    this.themeSelect = container.querySelector(
      '#kando-properties-icon-theme-select'
    ) as HTMLSelectElement;

    this.filterInput.addEventListener('input', () => this.loadIcons());
    this.themeSelect.addEventListener('change', () => this.loadIcons());

    const okButton = container.querySelector('#kando-properties-icon-picker-ok');
    okButton.addEventListener('click', () => this.emit('close'));

    const cancelButton = container.querySelector('#kando-properties-icon-picker-cancel');
    cancelButton.addEventListener('click', () => {
      this.emit('select', this.initialIcon, this.initialTheme);
      this.emit('close');
    });

    this.loadIcons();
  }

  public selectIcon(icon: string, theme: string) {
    this.initialIcon = icon;
    this.initialTheme = theme;

    this.themeSelect.value = theme;
  }

  private loadIcons() {
    const theme = IconThemeRegistry.getInstance().getIconTheme(this.themeSelect.value);
    const icons = theme.listIcons(this.filterInput.value);

    const div = document.createElement('div');
    icons.forEach((icon) => {
      div.appendChild(theme.createDiv(icon));
    });

    this.iconGrid.innerHTML = div.innerHTML;
  }
}

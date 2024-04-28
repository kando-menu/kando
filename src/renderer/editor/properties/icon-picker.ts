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
 * This class is responsible for displaying the icon picker of the menu editor. It emits
 * events when the user chooses a new icon. In fact, whenever an icon is clicked at, the
 * `select-icon` event is emitted. Clicking the Done button will only close the icon
 * picker. The cancel button will also emit the close event, but right before the 'close'
 * event a 'select' event is emitted with the original icon and theme.
 *
 * @fires close - When the user closes the icon picker via one of the two buttons.
 * @fires select - When the user selected an icon. The event contains the icon and the
 *   theme of the selected icon as arguments.
 */
export class IconPicker extends EventEmitter {
  /** The input field for filtering icons. */
  private filterInput: HTMLInputElement = null;

  /** The select field for choosing the icon theme. */
  private themeSelect: HTMLSelectElement = null;

  /** The div containing the grid of icons. */
  private iconGrid: HTMLElement = null;

  /** When a new loadIcons operation is started, the previous one is aborted. */
  private loadAbortController: AbortController = null;

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

    // The contents of the icon-theme select field are generated using the Handlebars
    // template below. The data object contains an array of objects with the keys `name`
    // and `key`. The `name` is the display name of the theme and the `key` is the key
    // that is used to identify the theme in the IconThemeRegistry.
    const data: { themes: { name: string; key: string }[] } = { themes: [] };
    const themes = IconThemeRegistry.getInstance().getIconThemes();
    themes.forEach((theme, key) => {
      data.themes.push({ name: theme.name, key });
    });

    const template = Handlebars.compile(require('./templates/icon-picker.hbs').default);
    container.innerHTML = template(data);

    // Store a reference to the icon grid, the filter input and the theme select field.
    this.iconGrid = container.querySelector('#kando-properties-icon-picker-grid');

    this.filterInput = container.querySelector(
      '#kando-properties-icon-filter'
    ) as HTMLInputElement;

    this.themeSelect = container.querySelector(
      '#kando-properties-icon-theme-select'
    ) as HTMLSelectElement;

    this.filterInput.addEventListener('input', () => this.loadIcons());
    this.themeSelect.addEventListener('change', () => this.loadIcons());

    // Close the icon picker when the user clicks the close button.
    const okButton = container.querySelector('#kando-properties-icon-picker-ok');
    okButton.addEventListener('click', () => this.emit('close'));

    // Also close the icon picker when the user clicks the cancel button. But before
    // closing the icon picker, emit a select event with the original icon and theme.
    const cancelButton = container.querySelector('#kando-properties-icon-picker-cancel');
    cancelButton.addEventListener('click', () => {
      this.emit('select', this.initialIcon, this.initialTheme);
      this.emit('close');
    });

    this.loadIcons();
  }

  /**
   * Selects the given icon and theme in the icon picker. The icon picker will open with
   * the given icon and theme selected.
   *
   * @param icon - The icon that should be selected.
   * @param theme - The theme that should be selected.
   */
  public selectIcon(icon: string, theme: string) {
    this.initialIcon = icon;
    this.initialTheme = theme;

    this.themeSelect.value = theme;
  }

  /**
   * Loads the icons of the currently selected theme and updates the icon grid.
   *
   * @returns A promise that resolves when all icons have been loaded or the operation has
   *   been aborted.
   */
  private async loadIcons() {
    // Check if there is a previous loadIcons operation in progress. If so, abort it.
    if (this.loadAbortController) {
      this.loadAbortController.abort();
      this.loadAbortController = null;
    }

    // Create a new AbortController for the current operation.
    const abortController = new AbortController();
    this.loadAbortController = abortController;

    // Clear existing icons.
    this.iconGrid.innerHTML = '';

    const theme = IconThemeRegistry.getInstance().getIconTheme(this.themeSelect.value);
    const icons = await theme.listIcons(this.filterInput.value);

    // Create a new Promise for the current operation. This promise will resolve when all
    // icons have been loaded or the operation has been aborted.
    return new Promise<void>((resolve) => {
      // We add the icons in batches to avoid blocking the UI thread for too long.
      const batchSize = 100;
      let startIndex = 0;

      const addBatch = () => {
        const endIndex = Math.min(startIndex + batchSize, icons.length);
        const fragment = document.createDocumentFragment();
        for (let i = startIndex; i < endIndex; i++) {
          fragment.appendChild(theme.createDiv(icons[i]));
        }

        // Before modifying the DOM, check if the operation has been aborted.
        if (abortController.signal.aborted) {
          resolve();
          return;
        }

        this.iconGrid.appendChild(fragment);

        startIndex = endIndex;

        // If there are still icons pending, yield to let the UI thread continue a bit and
        // then add the next batch of icons. Else resolve the promise.
        if (startIndex < icons.length) {
          requestAnimationFrame(addBatch);
        } else {
          this.loadAbortController = null;
          resolve();
        }
      };

      // Start adding the first batch of icons.
      addBatch();
    });
  }
}

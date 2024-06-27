//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';
import { Tooltip } from 'bootstrap';

import { IconThemeRegistry } from '../../../common/icon-theme-registry';

/**
 * This class is responsible for displaying the icon picker of the menu editor. It emits
 * events when the user chooses a new icon. In fact, whenever an icon is clicked at, the
 * `select-icon` event is emitted. Clicking the Done button will only close the icon
 * picker. The cancel button will also emit the close event, but right before the 'close'
 * event a 'select' event is emitted with the original icon and theme.
 *
 * @fires hide - When the user closes the icon picker via one of the two buttons.
 * @fires select - When the user selected an icon. The event contains the icon and the
 *   theme of the selected icon as arguments.
 */
export class IconPicker extends EventEmitter {
  /** The container to which the icon picker is appended. */
  private container: HTMLElement = null;

  /** The input field for filtering icons. */
  private filterInput: HTMLInputElement = null;

  /** The select field for choosing the icon theme. */
  private themeSelect: HTMLSelectElement = null;

  /** The div containing the grid of icons. */
  private iconGrid: HTMLElement = null;

  /** The icon that is currently selected. */
  private selectedIcon: string = null;
  private selectedIconDiv: HTMLElement = null;

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

    this.container = container;

    // The contents of the icon-theme select field are generated using the Handlebars
    // template below. The data object contains an array of objects with the keys `name`
    // and `key`. The `name` is the display name of the theme and the `key` is the key
    // that is used to identify the theme in the IconThemeRegistry.
    const data: { themes: { name: string; key: string }[] } = { themes: [] };
    const themes = IconThemeRegistry.getInstance().getThemes();
    themes.forEach((theme, key) => {
      data.themes.push({ name: theme.name, key });
    });

    const template = require('./templates/icon-picker.hbs');
    container.classList.value = 'd-flex flex-column justify-content-center hidden';
    container.innerHTML = template(data);

    // Store a reference to the icon grid, the filter input and the theme select field.
    this.iconGrid = container.querySelector('#kando-properties-icon-picker-grid');

    this.filterInput = container.querySelector(
      '#kando-properties-icon-filter'
    ) as HTMLInputElement;

    this.themeSelect = container.querySelector(
      '#kando-properties-icon-theme-select'
    ) as HTMLSelectElement;

    this.filterInput.addEventListener('input', () => this.updateIconGrid());
    this.themeSelect.addEventListener('change', () => this.updateIconGrid());

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
    this.selectedIcon = icon;
    this.initialTheme = theme;

    this.themeSelect.value = theme;

    this.updateIconGrid();
  }

  /** Hides the icon picker. */
  public hide() {
    if (this.loadAbortController) {
      this.loadAbortController.abort();
      this.loadAbortController = null;
    }

    this.container.classList.add('hidden');

    this.emit('hide');
  }

  /**
   * Reloads the icons of the currently selected theme and updates the icon grid. The grid
   * will scroll to the selected icon.
   */
  private updateIconGrid() {
    this.loadIcons().then((fullyLoaded) => {
      if (fullyLoaded && this.selectedIconDiv) {
        const scrollbox = this.iconGrid.parentElement.parentElement;
        scrollbox.scrollTop = this.selectedIconDiv.offsetTop - scrollbox.clientHeight / 2;
      }
    });
  }

  /**
   * Loads the icons of the currently selected theme and updates the icon grid.
   *
   * @returns A promise that resolves when all icons have been loaded or the operation has
   *   been aborted. The promise resolves to `true` if all icons have been loaded and to
   *   `false` if the operation has been aborted.
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
    this.container.classList.add('loading');

    const theme = IconThemeRegistry.getInstance().getTheme(this.themeSelect.value);
    const icons = await theme.listIcons(this.filterInput.value);

    // Create a new Promise for the current operation. This promise will resolve when all
    // icons have been loaded or the operation has been aborted.
    return new Promise<boolean>((resolve) => {
      // We add the icons in batches to avoid blocking the UI thread for too long.
      const batchSize = 150;
      let startIndex = 0;

      const addBatch = () => {
        const endIndex = Math.min(startIndex + batchSize, icons.length);
        const fragment = document.createDocumentFragment();
        for (let i = startIndex; i < endIndex; i++) {
          const iconName = icons[i];
          const iconDiv = theme.createDiv(iconName);
          iconDiv.setAttribute('data-bs-toggle', 'tooltip');
          iconDiv.setAttribute('title', iconName);
          if (iconName === this.selectedIcon) {
            iconDiv.classList.add('selected');

            this.selectedIconDiv = iconDiv;
          }
          fragment.appendChild(iconDiv);

          // Initialize the tooltip for the newly created icon
          new Tooltip(iconDiv, {
            delay: { show: 500, hide: 0 }, // Adjust delay as needed
          });

          // When the user clicks an icon, emit the select-icon event and add the
          // selected class to the icon.
          iconDiv.addEventListener('click', () => {
            if (this.selectedIconDiv) {
              this.selectedIconDiv.classList.remove('selected');
            }
            iconDiv.classList.add('selected');

            this.selectedIcon = iconName;
            this.selectedIconDiv = iconDiv;

            this.emit('select', iconName, this.themeSelect.value);
          });

          // When the user double-clicks an icon, emit the close event.
          iconDiv.addEventListener('dblclick', () => {
            this.hide();
          });
        }

        // Before modifying the DOM, check if the operation has been aborted.
        if (abortController.signal.aborted) {
          resolve(false);
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
          this.container.classList.remove('loading');
          resolve(true);
        }
      };

      // Start adding the first batch of icons.
      addBatch();
    });
  }
}

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
import { Tooltip } from 'bootstrap';

import { IconThemeRegistry } from '../../../common/icon-theme-registry';

// Extend the IntersectionObserverInit interface to allow for a delay option. This delay
// was introduced in IntersectionObserver v2 and is for some reason not yet part of the
// TypeScript definitions.
declare global {
  interface IntersectionObserverInit {
    delay?: number;
  }
}

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

  /** The observer that is used to detect when icons are scrolled into view. */
  private observer: IntersectionObserver = null;

  /**
   * The tooltips of the icons in the grid. We need to keep track of them to remove them
   * when the icon grid is reloaded.
   */
  private tooltips: Tooltip[] = [];

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
          link: 'href="https://github.com/kando-menu/kando/blob/main/docs/configuring.md#adding-custom-icon-themes-sparkles" target="_blank"',
        }),
        placeholder: i18next.t('properties.icon-picker.placeholder'),
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

    this.loadIcons();
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
   * will scroll to the selected icon. The loading happens in batches to avoid blocking
   * the UI thread for too long. When a previous loadIcons operation is still in progress,
   * it is aborted.
   */
  private async loadIcons() {
    // Check if there is a previous loadIcons operation in progress. If so, abort it.
    if (this.loadAbortController) {
      this.loadAbortController.abort();
    }

    // Create a new AbortController for the current operation.
    const abortController = new AbortController();
    this.loadAbortController = abortController;

    // Clear existing icons.
    this.iconGrid.innerHTML = '';
    this.container.classList.add('loading');

    if (this.observer) {
      this.observer.disconnect();
    }

    // Clear the tooltips.
    this.tooltips.forEach((tooltip) => tooltip.dispose());
    this.tooltips = [];

    const theme = IconThemeRegistry.getInstance().getTheme(this.themeSelect.value);
    const icons = await theme.listIcons(this.filterInput.value);

    // We add the icons in batches to avoid blocking the UI thread for too long.
    const batchSize = 150;
    let startIndex = 0;

    const addBatch = () => {
      const endIndex = Math.min(startIndex + batchSize, icons.length);
      const fragment = document.createDocumentFragment();
      for (let i = startIndex; i < endIndex; i++) {
        const iconName = icons[i];

        const iconButton = document.createElement('div');

        // Add the attributes required for the tooltip.
        iconButton.setAttribute('data-bs-toggle', 'tooltip');
        iconButton.setAttribute('title', iconName);

        // The icon-name attribute is used when loading the icon when the button becomes
        // visible.
        iconButton.setAttribute('icon-name', iconName);

        if (iconName === this.selectedIcon) {
          iconButton.classList.add('selected');
          this.selectedIconDiv = iconButton;
        }

        fragment.appendChild(iconButton);

        // Initialize the tooltip for the newly created icon.
        const tooltip = new Tooltip(iconButton, {
          delay: { show: 500, hide: 0 },
        });
        this.tooltips.push(tooltip);

        // When the user clicks an icon, emit the select-icon event and add the
        // selected class to the icon.
        iconButton.addEventListener('click', () => {
          if (this.selectedIconDiv) {
            this.selectedIconDiv.classList.remove('selected');
          }
          iconButton.classList.add('selected');

          this.selectedIcon = iconName;
          this.selectedIconDiv = iconButton;

          this.emit('select', iconName, this.themeSelect.value);
        });

        // When the user double-clicks an icon, emit the close event.
        iconButton.addEventListener('dblclick', () => {
          this.hide();
        });
      }

      // Before actually modifying the DOM, check if the operation has been aborted.
      if (abortController.signal.aborted) {
        return;
      }

      this.iconGrid.appendChild(fragment);

      startIndex = endIndex;

      // If there are still icons pending, yield to let the UI thread continue a bit and
      // then add the next batch of icons.
      if (startIndex < icons.length) {
        requestAnimationFrame(addBatch);
      } else {
        // The loading operation is finished. Clean up and scroll to the selected icon.
        this.loadAbortController = null;
        this.container.classList.remove('loading');

        const scrollbox = this.iconGrid.parentElement.parentElement;
        if (this.selectedIconDiv) {
          scrollbox.scrollTop =
            this.selectedIconDiv.offsetTop - scrollbox.clientHeight / 2 - 150;
        }

        // Create the observer that is used to detect when icons are scrolled into view.
        // Once an icon is visible, the icon is loaded into the button. This is done to
        // avoid loading all icons at once.
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const iconButton = entry.target;
              const iconName = iconButton.attributes.getNamedItem('icon-name').value;

              if (entry.isIntersecting) {
                iconButton.appendChild(theme.createDiv(iconName));
              } else {
                iconButton.innerHTML = '';
              }
            });
          },
          { root: scrollbox, delay: 250, rootMargin: '250px' }
        );

        // Observe all icons in the grid. We get the icons by querying the grid for all
        // divs having the icon-name attribute.
        const icons = this.iconGrid.querySelectorAll('div[icon-name]');
        icons.forEach((icon) => this.observer.observe(icon));
      }
    };

    // Start adding the first batch of icons.
    addBatch();
  }
}

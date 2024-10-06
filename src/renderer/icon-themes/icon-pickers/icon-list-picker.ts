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

import { IIconPicker } from '../icon-theme-registry';
import { IconListTheme } from '../icon-list-theme';

// Extend the IntersectionObserverInit interface to allow for a delay option. This delay
// was introduced in IntersectionObserver v2 and is for some reason not yet part of the
// TypeScript definitions.
declare global {
  interface IntersectionObserverInit {
    delay?: number;
  }
}

/**
 * An icon picker for icon themes which consist of a larger list of icons. The icons are
 * loaded asynchronously in batches to avoid blocking the UI thread. Also, icons are only
 * shown when they are scrolled into view. Overall, this allows for decent performance
 * even with a large number of icons.
 */
export class IconListPicker implements IIconPicker {
  /** The HTML elements of the icon picker. */
  private fragment: DocumentFragment = null;

  /** This callback is called when the user selects an icon. */
  private onSelectCallback: (icon: string) => void = null;

  /** This callback is called when the user wants to close the icon picker. */
  private onCloseCallback: () => void = null;

  /** The input field for filtering icons. */
  private filterInput: HTMLInputElement = null;

  /** The div containing the grid of icons. */
  private iconGrid: HTMLElement = null;

  /** The spinner. */
  private spinner: HTMLElement = null;

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

  /**
   * Creates a new IconPicker for the given theme.
   *
   * @param theme The theme for which the icon picker is created.
   */
  constructor(private theme: IconListTheme) {
    const data = {
      strings: {
        placeholder: i18next.t('properties.icon-picker.placeholder'),
      },
    };

    const template = require('./templates/icon-list-picker.hbs');
    this.fragment = document.createRange().createContextualFragment(template(data));

    // Store a reference to the icon grid, the spinner, the filter input, and the theme
    // select field.
    this.iconGrid = this.fragment.querySelector('.icon-list-picker-grid');
    this.spinner = this.fragment.querySelector('.icon-list-picker-spinner');

    this.filterInput = this.fragment.querySelector(
      '.icon-list-picker-filter'
    ) as HTMLInputElement;

    this.filterInput.addEventListener('input', () => this.loadIcons());
  }

  /** Returns the HTML fragment of the icon picker. */
  public getFragment() {
    return this.fragment;
  }

  /** Registers a callback that is called when the user selects an icon. */
  public onSelect(callback: (icon: string) => void) {
    this.onSelectCallback = callback;
  }

  /** Registers a callback that is called when the icon picker should be closed. */
  public onClose(callback: () => void) {
    this.onCloseCallback = callback;
  }

  /**
   * Initializes the icon picker. This method will be called after the icon picker is
   * appended to the DOM.
   *
   * @param selectedIcon The icon that is currently selected.
   */
  public init(selectedIcon: string) {
    this.selectedIcon = selectedIcon;
    this.loadIcons();
  }

  /** Cancels the loading of icons. */
  public deinit() {
    if (this.loadAbortController) {
      this.loadAbortController.abort();
      this.loadAbortController = null;
    }
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
    this.iconGrid.classList.add('loading');
    this.spinner.classList.add('loading');

    if (this.observer) {
      this.observer.disconnect();
    }

    // Clear the tooltips.
    this.tooltips.forEach((tooltip) => tooltip.dispose());
    this.tooltips = [];

    const icons = await this.theme.listIcons(this.filterInput.value);

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

          this.onSelectCallback(iconName);
        });

        // When the user double-clicks an icon, emit the close event.
        iconButton.addEventListener('dblclick', () => {
          this.onCloseCallback();
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
        this.iconGrid.classList.remove('loading');
        this.spinner.classList.remove('loading');

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
                iconButton.appendChild(this.theme.createIcon(iconName));
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

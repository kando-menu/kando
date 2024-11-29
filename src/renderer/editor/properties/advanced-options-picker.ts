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
import { IMenu } from '../../../common';

/**
 * This class implements a picker that allows the user to tweak the behavior of a menu.
 * The properties of the menu are directly updated when the user changes the values in the
 * picker.
 *
 * @fires close - When the user closes the picker via the 'Done' buttons.
 */
export class AdvancedOptionsPicker extends EventEmitter {
  /** The container to which the picker is appended. */
  private container: HTMLElement = null;

  /**
   * The open at pointer checkbox is a checkbox that allows the user to toggle whether the
   * menu should open at the pointer position.
   */
  private centeredModeCheckbox: HTMLInputElement = null;

  /**
   * The anchored mode checkbox is a checkbox that allows the user to toggle whether
   * submenus should open at the same position as the parent menu.
   */
  private anchoredModeCheckbox: HTMLInputElement = null;

  /**
   * The warp mouse checkbox is a checkbox that allows the user to toggle whether the
   * mouse should be warped to the center of the menu when it is opened.
   */
  private warpMouseCheckbox: HTMLInputElement = null;

  /** The currently active menu. */
  private menu: IMenu = null;

  /**
   * Creates a new ConditionPicker and appends it to the given container.
   *
   * @param container - The container to which the picker will be appended.
   */
  constructor(container: HTMLElement) {
    super();

    this.container = container;

    const template = require('./templates/advanced-options-picker.hbs');
    container.classList.value = 'd-flex flex-column justify-content-center hidden';
    container.innerHTML = template({
      strings: {
        heading: i18next.t('properties.advanced-options.heading'),
        subheading: i18next.t('properties.advanced-options.subheading', {
          link: 'target="_blank" href="https://kando.menu/usage/"',
        }),
        centeredMode: i18next.t('properties.advanced-options.centered-mode'),
        centeredModeHint: i18next.t('properties.advanced-options.centered-mode-hint'),
        warpMouse: i18next.t('properties.advanced-options.warp-mouse'),
        warpMouseHint: i18next.t('properties.advanced-options.warp-mouse-hint'),
        anchoredMode: i18next.t('properties.advanced-options.anchored-mode'),
        anchoredModeHint: i18next.t('properties.advanced-options.anchored-mode-hint'),
        anchoredModeCheckedHint: i18next.t(
          'properties.advanced-options.anchored-mode-checked-hint'
        ),
        done: i18next.t('properties.common.done'),
      },
    });

    // Update the 'centered' property of the menu when the checkbox changes.
    this.centeredModeCheckbox = container.querySelector(
      '#kando-menu-properties-centered-mode'
    ) as HTMLInputElement;
    this.centeredModeCheckbox.addEventListener('change', () => {
      if (this.menu) {
        this.menu.centered = this.centeredModeCheckbox.checked;
      }
    });

    // Update the 'warpMouse' property of the menu when the checkbox changes.
    this.warpMouseCheckbox = container.querySelector(
      '#kando-menu-properties-warp-mouse'
    ) as HTMLInputElement;
    this.warpMouseCheckbox.addEventListener('change', () => {
      if (this.menu) {
        this.menu.warpMouse = this.warpMouseCheckbox.checked;
      }
    });

    // Update the 'anchored' property of the menu when the checkbox changes.
    this.anchoredModeCheckbox = container.querySelector(
      '#kando-menu-properties-anchored-mode'
    ) as HTMLInputElement;
    this.anchoredModeCheckbox.addEventListener('change', () => {
      if (this.menu) {
        this.menu.anchored = this.anchoredModeCheckbox.checked;
      }
    });

    // Close the picker when the user clicks the Cancel button.
    const doneButton = container.querySelector(
      '#kando-properties-advanced-options-picker-close'
    );
    doneButton.addEventListener('click', () => {
      this.hide();
    });
  }

  /** Shows the picker. The picker will open with the given conditions preselected. */
  public show() {
    this.container.classList.remove('hidden');
  }

  /** Hides the picker. */
  public hide() {
    this.container.classList.add('hidden');
    this.emit('close');
  }

  /** Sets the menu that should be modified by the picker. */
  public setMenu(menu: IMenu) {
    this.menu = menu;
    this.centeredModeCheckbox.checked = menu.centered;
    this.warpMouseCheckbox.checked = menu.warpMouse;
    this.anchoredModeCheckbox.checked = menu.anchored;
  }
}

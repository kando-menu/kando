//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { Collapse } from 'bootstrap';
import { EventEmitter } from 'events';
import { IMenu, IMenuConditions, IVec2 } from '../../../common';

/**
 * Each condition-picker input consists of a collapse element, a checkbox for enabling the
 * condition and a set of input fields for the actual condition.
 */
interface IConditionPickerInputs {
  collapse: HTMLElement;
  checkbox: HTMLInputElement;
  suggestedValue?: string;
  inputs: HTMLInputElement[];
}

/**
 * This class shows an inline dialog in the properties panel that allows the user to edit
 * the conditions under which the current menu should be shown. The properties of the
 * given menu are directly edited.
 *
 * @fires close - When the user selected new conditions.
 */
export class ConditionPicker extends EventEmitter {
  /** The container to which the condition picker is appended. */
  private container: HTMLElement = null;

  /** The input fields for the conditions. */
  private inputs: {
    app: IConditionPickerInputs;
    window: IConditionPickerInputs;
    screen: IConditionPickerInputs;
  };

  /** The conditions that are currently being edited. */
  private menu: IMenu;

  /**
   * The position of Kando's window when it was opened. This is used to compute the mouse
   * position hint.
   */
  private windowPosition: IVec2;

  /** The element that shows the mouse position hint. */
  private screenAreaHint: HTMLElement;

  /** The event handler for mouse move events. */
  private mouseMoveHandler: (event: MouseEvent) => void;

  /**
   * Creates a new ConditionPicker and appends it to the given container.
   *
   * @param container - The container to which the condition picker will be appended.
   */
  constructor(container: HTMLElement) {
    super();

    this.container = container;

    const template = require('./templates/condition-picker.hbs');
    container.classList.value = 'd-flex flex-column justify-content-center hidden';
    container.innerHTML = template({
      strings: {
        heading: i18next.t('properties.condition-picker.heading'),
        subheading: i18next.t('properties.condition-picker.subheading'),
        done: i18next.t('properties.common.done'),
        app: i18next.t('properties.condition-picker.app'),
        appHint: i18next.t('properties.condition-picker.app-hint'),
        appCheckedHint: i18next.t('properties.condition-picker.app-checked-hint'),
        appPlaceholder: i18next.t('properties.condition-picker.app-placeholder'),
        appTooltip: i18next.t('properties.condition-picker.app-tooltip'),
        window: i18next.t('properties.condition-picker.window'),
        windowHint: i18next.t('properties.condition-picker.window-hint'),
        windowCheckedHint: i18next.t('properties.condition-picker.window-checked-hint'),
        windowPlaceholder: i18next.t('properties.condition-picker.window-placeholder'),
        windowTooltip: i18next.t('properties.condition-picker.window-tooltip'),
        screen: i18next.t('properties.condition-picker.screen'),
        screenHint: i18next.t('properties.condition-picker.screen-hint'),
        screenCheckedHint: i18next.t('properties.condition-picker.screen-checked-hint'),
        leftPlaceholder: i18next.t('properties.condition-picker.left-placeholder'),
        rightPlaceholder: i18next.t('properties.condition-picker.right-placeholder'),
        topPlaceholder: i18next.t('properties.condition-picker.top-placeholder'),
        bottomPlaceholder: i18next.t('properties.condition-picker.bottom-placeholder'),
      },
    });

    const idPrefix = '#kando-properties-condition-';

    // Get the screen area hint element.
    this.screenAreaHint = container.querySelector(idPrefix + 'screen-hint');

    // Get all the input fields and checkboxes.
    this.inputs = {
      app: {
        checkbox: container.querySelector(idPrefix + 'app-checkbox'),
        collapse: container.querySelector(idPrefix + 'app-collapse'),
        inputs: [container.querySelector(idPrefix + 'app')],
      },
      window: {
        checkbox: container.querySelector(idPrefix + 'window-checkbox'),
        collapse: container.querySelector(idPrefix + 'window-collapse'),
        inputs: [container.querySelector(idPrefix + 'window')],
      },
      screen: {
        checkbox: container.querySelector(idPrefix + 'screen-checkbox'),
        collapse: container.querySelector(idPrefix + 'screen-collapse'),
        inputs: [
          container.querySelector(idPrefix + 'screen-x-min'),
          container.querySelector(idPrefix + 'screen-x-max'),
          container.querySelector(idPrefix + 'screen-y-min'),
          container.querySelector(idPrefix + 'screen-y-max'),
        ],
      },
    };

    // Show and collapse the input fields if the corresponding checkboxes are checked.
    for (const { checkbox, collapse } of Object.values(this.inputs)) {
      const bsCollapse = new Collapse(collapse, { toggle: false });
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          bsCollapse.show();
        } else {
          bsCollapse.hide();
        }
      });
    }

    // The app and window name conditions have a "suggested value". This value is set
    // when the condition picker is opened and contains the name of the app and window
    // that were in focus when Kando was opened. There are buttons that allow the user
    // to use this suggested value.
    for (const condition of Object.values(this.inputs)) {
      const useSuggestedButton = condition.collapse.querySelector('button');
      useSuggestedButton?.addEventListener('click', () => {
        condition.inputs[0].value = condition.suggestedValue;
      });
    }

    // Close the condition picker when the user clicks the done button.
    const doneButton = container.querySelector(idPrefix + 'picker-done');
    doneButton.addEventListener('click', () => {
      this.hide();
    });

    // Update the mouse position hint. This will be called on every mouse move event
    // while the condition picker is open.
    this.mouseMoveHandler = (event: MouseEvent) => {
      this.screenAreaHint.innerText = i18next.t(
        'properties.condition-picker.pointer-position-hint',
        {
          x: event.clientX + this.windowPosition.x,
          y: event.clientY + this.windowPosition.y,
        }
      );
    };
  }

  /**
   * Shows the condition picker. The condition picker will open with the given conditions
   * preselected.
   *
   * @param menu - The menu whose conditions should be edited.
   */
  public show(menu: IMenu) {
    this.container.classList.remove('hidden');
    this.menu = menu;

    // Reset the input fields.
    for (const { checkbox, inputs, collapse } of Object.values(this.inputs)) {
      checkbox.checked = false;
      collapse.classList.remove('show');
      for (const input of inputs) {
        input.value = '';
      }
    }

    if (this.menu.conditions?.appName) {
      this.inputs.app.collapse.classList.add('show');
      this.inputs.app.checkbox.checked = true;
      this.inputs.app.inputs[0].value = this.menu.conditions.appName.toString();
    }

    if (this.menu.conditions?.windowName) {
      this.inputs.window.collapse.classList.add('show');
      this.inputs.window.checkbox.checked = true;
      this.inputs.window.inputs[0].value = this.menu.conditions.windowName.toString();
    }

    if (this.menu.conditions?.screenArea) {
      this.inputs.screen.collapse.classList.add('show');
      this.inputs.screen.checkbox.checked = true;
      this.inputs.screen.inputs[0].value =
        this.menu.conditions.screenArea.xMin?.toString() || '';
      this.inputs.screen.inputs[1].value =
        this.menu.conditions.screenArea.xMax?.toString() || '';
      this.inputs.screen.inputs[2].value =
        this.menu.conditions.screenArea.yMin?.toString() || '';
      this.inputs.screen.inputs[3].value =
        this.menu.conditions.screenArea.yMax?.toString() || '';
    }

    // Update the mouse position hint.
    document.addEventListener('mousemove', this.mouseMoveHandler);
  }

  /** Hides the condition picker. */
  public hide() {
    this.container.classList.add('hidden');
    document.removeEventListener('mousemove', this.mouseMoveHandler);

    // Update the conditions of the menu.
    if (this.menu) {
      const conditions: IMenuConditions = {};

      if (this.inputs.app.checkbox.checked) {
        conditions.appName = this.inputs.app.inputs[0].value;
      }

      if (this.inputs.window.checkbox.checked) {
        conditions.windowName = this.inputs.window.inputs[0].value;
      }

      if (this.inputs.screen.checkbox.checked) {
        conditions.screenArea = {};
        if (this.inputs.screen.inputs[0].value !== '') {
          conditions.screenArea.xMin = parseInt(this.inputs.screen.inputs[0].value);
        }
        if (this.inputs.screen.inputs[1].value !== '') {
          conditions.screenArea.xMax = parseInt(this.inputs.screen.inputs[1].value);
        }
        if (this.inputs.screen.inputs[2].value !== '') {
          conditions.screenArea.yMin = parseInt(this.inputs.screen.inputs[2].value);
        }
        if (this.inputs.screen.inputs[3].value !== '') {
          conditions.screenArea.yMax = parseInt(this.inputs.screen.inputs[3].value);
        }
      }

      const anyConditionSelected =
        conditions.appName || conditions.windowName || conditions.screenArea;

      if (anyConditionSelected) {
        this.menu.conditions = conditions;
      } else {
        delete this.menu.conditions;
      }
    }

    this.emit('close');
  }

  /**
   * This is called whenever the menu editor shown. It is used to set hints for the
   * condition picker.
   *
   * @param appName The name of the app which was in focus when Kando was opened.
   * @param windowName The name of the window which was in focus when Kando was opened.
   * @param windowPosition The position of Kando's window when it was opened.
   */
  public setConditionHints(appName: string, windowName: string, windowPosition: IVec2) {
    this.inputs.app.suggestedValue = appName;
    this.inputs.window.suggestedValue = windowName;
    this.windowPosition = windowPosition;
  }
}

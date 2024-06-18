//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { Collapse } from 'bootstrap';
import { EventEmitter } from 'events';
import { IMenuConditions, IVec2 } from '../../../common';

/**
 * Each condition-picker input consists of a collapse element, a checkbox for enabling the
 * condition and a set of input fields for the actual condition.
 */
interface IConditionPickerInputs {
  collapse: HTMLElement;
  checkbox: HTMLInputElement;
  defaultValue?: string;
  inputs: HTMLInputElement[];
}

/**
 * This class shows an inline dialog in the properties panel that allows the user to
 * choose conditions under which the current menu should be shown. The dialog contains two
 * buttons: "OK" and "Cancel". When the user clicks "OK", the first the 'select' event is
 * emitted. If either of the two buttons is clicked, the 'hide' event is emitted as well.
 *
 * @fires hide - When the user closes the condition picker via one of the two buttons.
 * @fires select - When the user selected new conditions. The selected IMenuConditions are
 *   passed as arguments to the event handler. If no conditions are selected, null is
 *   passed.
 */
export class ConditionPicker extends EventEmitter {
  /** The container to which the condition picker is appended. */
  private container: HTMLElement = null;

  /** The input fields for the conditions. */
  private conditions: {
    app: IConditionPickerInputs;
    window: IConditionPickerInputs;
    screen: IConditionPickerInputs;
  };

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
    container.innerHTML = template({});

    const idPrefix = '#kando-properties-condition-';

    // Get the screen area hint element.
    this.screenAreaHint = container.querySelector(idPrefix + 'screen-hint');

    // Get all the input fields and checkboxes.
    this.conditions = {
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
    for (const { checkbox, collapse } of Object.values(this.conditions)) {
      const bsCollapse = new Collapse(collapse, { toggle: false });
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          bsCollapse.show();
        } else {
          bsCollapse.hide();
        }
      });
    }

    // Close the condition picker when the user clicks the OK button. Before, we emit the
    // select event with the selected conditions.
    const okButton = container.querySelector(idPrefix + 'picker-ok');
    okButton.addEventListener('click', () => {
      const conditions: IMenuConditions = {};

      if (this.conditions.app.checkbox.checked) {
        conditions.appName = this.conditions.app.inputs[0].value;
      }

      if (this.conditions.window.checkbox.checked) {
        conditions.windowName = this.conditions.window.inputs[0].value;
      }

      if (this.conditions.screen.checkbox.checked) {
        conditions.screenArea = {};
        if (this.conditions.screen.inputs[0].value !== '') {
          conditions.screenArea.xMin = parseInt(this.conditions.screen.inputs[0].value);
        }
        if (this.conditions.screen.inputs[1].value !== '') {
          conditions.screenArea.xMax = parseInt(this.conditions.screen.inputs[1].value);
        }
        if (this.conditions.screen.inputs[2].value !== '') {
          conditions.screenArea.yMin = parseInt(this.conditions.screen.inputs[2].value);
        }
        if (this.conditions.screen.inputs[3].value !== '') {
          conditions.screenArea.yMax = parseInt(this.conditions.screen.inputs[3].value);
        }
      }

      const anyConditionSelected =
        conditions.appName || conditions.windowName || conditions.screenArea;

      this.emit('select', anyConditionSelected ? conditions : null);
      this.hide();
    });

    // Close the condition picker when the user clicks the Cancel button.
    const cancelButton = container.querySelector(idPrefix + 'picker-cancel');
    cancelButton.addEventListener('click', () => {
      this.hide();
    });

    // Update the mouse position hint. This will be called on every mouse move event
    // while the condition picker is open.
    this.mouseMoveHandler = (event: MouseEvent) => {
      this.screenAreaHint.innerText = `Your mouse is currently at ${
        event.clientX + this.windowPosition.x
      } x ${event.clientY + this.windowPosition.y}`;
    };
  }

  /**
   * Shows the condition picker. The condition picker will open with the given conditions
   * preselected.
   *
   * @param conditions - The initial set of conditions.
   */
  public show(conditions?: IMenuConditions) {
    this.container.classList.remove('hidden');

    for (const { checkbox, inputs, defaultValue, collapse } of Object.values(
      this.conditions
    )) {
      checkbox.checked = false;
      collapse.classList.remove('show');
      for (const input of inputs) {
        input.value = defaultValue || '';
      }
    }

    if (conditions) {
      if (conditions.appName) {
        this.conditions.app.collapse.classList.add('show');
        this.conditions.app.checkbox.checked = true;
        this.conditions.app.inputs[0].value = conditions.appName.toString();
      }

      if (conditions.windowName) {
        this.conditions.window.collapse.classList.add('show');
        this.conditions.window.checkbox.checked = true;
        this.conditions.window.inputs[0].value = conditions.windowName.toString();
      }

      if (conditions.screenArea) {
        this.conditions.screen.collapse.classList.add('show');
        this.conditions.screen.checkbox.checked = true;
        this.conditions.screen.inputs[0].value =
          conditions.screenArea.xMin?.toString() || '';
        this.conditions.screen.inputs[1].value =
          conditions.screenArea.xMax?.toString() || '';
        this.conditions.screen.inputs[2].value =
          conditions.screenArea.yMin?.toString() || '';
        this.conditions.screen.inputs[3].value =
          conditions.screenArea.yMax?.toString() || '';
      }
    }

    // Update the mouse position hint.
    document.addEventListener('mousemove', this.mouseMoveHandler);
  }

  /** Hides the condition picker. */
  public hide() {
    this.container.classList.add('hidden');
    document.removeEventListener('mousemove', this.mouseMoveHandler);
    this.emit('hide');
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
    this.conditions.app.defaultValue = appName;
    this.conditions.window.defaultValue = windowName;
    this.windowPosition = windowPosition;
  }
}

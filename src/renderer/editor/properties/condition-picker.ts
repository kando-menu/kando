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

/**
 * This class shows an inline dialog in the properties panel that allows the user to
 * choose conditions under which the current menu should be shown. The dialog contains two
 * buttons: "OK" and "Cancel". When the user clicks "OK", the first the 'select' event is
 * emitted. If either of the two buttons is clicked, the 'hide' event is emitted as well.
 *
 * @fires hide - When the user closes the condition picker via one of the two buttons.
 * @fires select - When the user selected new conditions. The selected conditions are
 *   passed as arguments to the event handler.
 */
export class ConditionPicker extends EventEmitter {
  /** The container to which the condition picker is appended. */
  private container: HTMLElement = null;

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

    const conditions = [
      'kando-properties-condition-app-name',
      'kando-properties-condition-window-title',
      'kando-properties-condition-pointer-position',
    ];

    // Show and collapse the input fields if the corresponding checkboxes are checked.
    conditions.forEach((condition) => {
      const checkbox = container.querySelector(
        `#${condition}-checkbox`
      ) as HTMLInputElement;
      const input = container.querySelector(`#${condition}`).parentElement;

      console.log(condition, checkbox, input);

      const collapse = new Collapse(input, { toggle: false });
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          collapse.show();
        } else {
          collapse.hide();
        }
      });
    });

    // Close the condition picker when the user clicks the OK button. Before, we emit the
    // select event with the selected conditions.
    const okButton = container.querySelector('#kando-properties-condition-picker-ok');
    okButton.addEventListener('click', () => {
      // const appName = this.appName.value;
      // const windowTitle = this.windowTitle.value;
      // this.emit('select', appName, windowTitle);
      this.hide();
    });

    // Close the condition picker when the user clicks the Cancel button.
    const cancelButton = container.querySelector(
      '#kando-properties-condition-picker-cancel'
    );
    cancelButton.addEventListener('click', () => {
      this.hide();
    });
  }

  /**
   * Shows the condition picker. The condition picker will open with the given condition
   * and theme selected.
   *
   * @param appName - The initial app name filter.
   * @param windowTitle - The initial window title filter.
   */
  // TODO: Remove this eslint-disable line.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public show(appName: string, windowTitle: string) {
    this.container.classList.remove('hidden');
  }

  /** Hides the condition picker. */
  public hide() {
    this.container.classList.add('hidden');
    this.emit('hide');
  }
}

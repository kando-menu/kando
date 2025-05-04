//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';
import { IGeneralSettings } from '../common';

/**
 * This class adds the functionality to the settings button which is shown in one corner
 * of the screen.
 *
 * @fires 'click' When te button is pressed.
 */
export class SettingsButton extends EventEmitter {
  /**
   * Adds the functionality to the settings button.
   *
   * @param button The button element.
   * @param settings The general settings.
   */
  constructor(
    private button: HTMLButtonElement,
    settings: IGeneralSettings
  ) {
    super();

    this.button.addEventListener('click', (event) => {
      event.stopPropagation();
      this.emit('click');
    });

    this.updateSettings(settings);
  }

  /** This function will show the button. */
  show() {
    this.button.classList.remove('hidden');
  }

  /** This function will hide the button. */
  hide() {
    this.button.classList.add('hidden');
  }

  /**
   * Allow changing the options at run-time.
   *
   * @param options The new options.
   */
  public updateSettings(settings: IGeneralSettings) {
    if (settings.hideSettingsButton) {
      this.button.classList.add('invisible');
    } else {
      this.button.classList.remove('invisible');
    }

    const positions = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];
    positions.forEach((position) => {
      this.button.classList.toggle(
        position,
        settings.settingsButtonPosition === position
      );
    });
  }
}

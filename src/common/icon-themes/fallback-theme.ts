//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IIconTheme } from './icon-theme-registry';

/**
 * This class implements an icon theme that is used if the user has not selected a valid
 * icon theme.
 */
export class FallbackTheme implements IIconTheme {
  /** Not required as this is not a user-selectable theme. */
  get name() {
    return '';
  }

  /**
   * Creates a div with a question mark icon.
   *
   * @returns A div element that contains the icon.
   */
  createIcon() {
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('icon-container');

    const iconDiv = document.createElement('i');
    containerDiv.appendChild(iconDiv);

    iconDiv.classList.add('emoji-icon');
    iconDiv.innerText = '❓';

    return containerDiv;
  }

  /** Returns information about the icon picker for this icon theme. */
  get iconPickerInfo() {
    return {
      type: 'none' as const,
    };
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IIconTheme } from './icon-theme-registry';
import { Base64Picker } from './icon-pickers/base64-picker';

/**
 * This class implements an icon theme that allows the user to enter base64 encoded images
 * directly.
 */
export class Base64Theme implements IIconTheme {
  /** Returns a human-readable name of the icon theme. */
  get name() {
    return 'Base64';
  }

  /**
   * Creates a div element that contains the icon with the given base64 encoded image.
   *
   * @param icon The base64 encoded image.
   * @returns A div element that contains the icon.
   */
  createIcon(icon: string) {
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('icon-container');

    const img = document.createElement('img');
    img.src = icon;

    containerDiv.appendChild(img);

    return containerDiv;
  }

  /**
   * Creates an icon picker for this theme. The icon picker allows the user to pick an
   * icon from the theme.
   *
   * @returns An icon picker for this theme.
   */
  createIconPicker() {
    return new Base64Picker();
  }
}

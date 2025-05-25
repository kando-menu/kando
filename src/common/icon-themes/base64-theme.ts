//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';
import { IIconTheme } from './icon-theme-registry';

/**
 * This class implements an icon theme that allows the user to enter base64 encoded
 * images, file: URI, or URLs directly.
 */
export class Base64Theme implements IIconTheme {
  /** Returns a human-readable name of the icon theme. */
  get name() {
    return 'Base64 / URL';
  }

  /**
   * Creates a div element that contains the icon with the given base64 encoded image,
   * file: URI, or URL.
   *
   * @param icon The base64 encoded image, file: URI, or URL.
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

  /** Returns information about the icon picker for this icon theme. */
  get iconPickerInfo() {
    return {
      type: 'base64' as const,
      hint: i18next.t('settings.icon-picker-dialog.base64-hint', {
        link: 'https://www.base64-image.de/',
      }),
    };
  }
}

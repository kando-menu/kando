//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { SimpleIconsTheme } from './simple-icons-theme';

export class SimpleIconsColoredTheme extends SimpleIconsTheme {
  get name() {
    return 'Simple Icons (Colored)';
  }

  /**
   * Creates a div element that contains the icon with the given name.
   *
   * @param icon One of the icons returned by `listIcons`.
   * @returns A div element that contains the icon.
   */
  createDiv(icon: string) {
    const containerDiv = super.createDiv(icon);

    const iconDiv = containerDiv.childNodes[0] as HTMLElement;
    iconDiv.classList.add('si--color');

    return containerDiv;
  }
}

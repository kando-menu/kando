//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { matchSorter } from 'match-sorter';

import { SimpleIconsTheme } from './simple-icons-theme';

/**
 * This class implements an icon theme that uses the Simple Icons font as icons. It colors
 * the icons using the `si--color` class.
 */
export class SimpleIconsColoredTheme extends SimpleIconsTheme {
  /** Returns a human-readable name of the icon theme. */
  get name() {
    return 'Simple Icons (Colored)';
  }

  /**
   * Creates a div element that contains the icon with the given name.
   *
   * @param icon One of the icons returned by `listIcons`.
   * @returns A div element that contains the icon.
   */
  createIcon(icon: string) {
    const containerDiv = super.createIcon(icon);

    const iconDiv = containerDiv.childNodes[0] as HTMLElement;
    iconDiv.classList.add('si--color');

    return containerDiv;
  }

  /** Returns information about the icon picker for this icon theme. */
  get iconPickerInfo() {
    return {
      type: 'list' as const,
      usesTextColor: false,
      listIcons: (searchTerm: string) => {
        return matchSorter(this.iconsData, searchTerm, { keys: ['title', 'slug'] }).map(
          (icon) => icon.slug
        );
      },
    };
  }
}

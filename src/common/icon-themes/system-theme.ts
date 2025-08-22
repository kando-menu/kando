//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { matchSorter } from 'match-sorter';

import { IconTheme } from './icon-theme-registry';

/**
 * On some systems, the operating system provides a set of icons that can be used in
 * applications. For instance, on Linux, the Freedesktop Icon Theme Specification defines
 * a set of icons that can be used by applications.
 */
export class SystemTheme implements IconTheme {
  /** A list of all available icon names. */
  private iconNames: Array<string> = [];

  /** A human-readable name of the icon theme. */
  get name() {
    return 'System Icons';
  }

  /**
   * Creates a new SystemTheme.
   *
   * @param icons A map of icon names to their data URLs. The keys are the icon names, and
   *   the values are the data URLs of the icons.
   */
  constructor(private icons: Map<string, string>) {
    this.iconNames = Array.from(this.icons.keys()).sort((a, b) => a.localeCompare(b));
  }

  /** Creates a div element that contains the icon with the given name. */
  createIcon(icon: string) {
    const iconData = this.icons.get(icon);
    if (!iconData) {
      return null;
    }

    const containerDiv = document.createElement('div');
    containerDiv.classList.add('icon-container');

    const iconDiv = document.createElement('img');
    iconDiv.src = iconData;

    containerDiv.appendChild(iconDiv);

    return containerDiv;
  }

  /** Returns information about the icon picker for this icon theme. */
  get iconPickerInfo() {
    return {
      type: 'list' as const,
      usesTextColor: false,
      listIcons: (searchTerm: string) => matchSorter(this.iconNames, searchTerm),
    };
  }
}

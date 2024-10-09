//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { matchSorter } from 'match-sorter';

import { IconListTheme } from './icon-list-theme';

/** This class implements an icon theme that uses the Simple Icons font as icons. */
export class SimpleIconsTheme extends IconListTheme {
  /** This array contains all available icon names. It is initialized in the constructor. */
  private iconNames: Array<string> = [];

  constructor() {
    super();

    // Load simple-icons.css as text file.
    const string =
      require('!!raw-loader!simple-icons-font/font/simple-icons.css').default;

    // Use regex to extract all icon names. In the file above, all the names start with a
    // '.si-' and end before the next '::before'. We also ensure not to match the variants
    // with the '--color' suffix.
    const regex = /\.si-([a-z0-9-]+(?<!-color))(?=::before)/g;
    let match;

    while ((match = regex.exec(string)) !== null) {
      this.iconNames.push(match[1]);
    }
  }

  /** Returns a human-readable name of the icon theme. */
  get name() {
    return 'Simple Icons';
  }

  /**
   * Returns a list icons from this theme that match the given search term.
   *
   * @param searchTerm The search term to filter the icons.
   * @returns An array of icon names that match the search term.
   */
  public async listIcons(searchTerm: string) {
    return matchSorter(this.iconNames, searchTerm);
  }

  /**
   * Creates a div element that contains the icon with the given name.
   *
   * @param icon One of the icons returned by `listIcons`.
   * @returns A div element that contains the icon.
   */
  createIcon(icon: string) {
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('icon-container');

    const iconDiv = document.createElement('i');
    containerDiv.appendChild(iconDiv);

    iconDiv.classList.add('si');
    iconDiv.classList.add('si-' + icon);

    return containerDiv;
  }
}

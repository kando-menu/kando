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

/**
 * This class implements an icon theme that uses the Material Symbols Rounded font as
 * icons.
 */
export class MaterialSymbolsTheme extends IconListTheme {
  /** This array contains all available icon names. It is initialized in the constructor. */
  private iconNames: Array<string> = [];

  constructor() {
    super();

    // Load material symbols type definition as text file.
    const string = require('!!raw-loader!material-symbols/index.d.ts').default;

    // Use regex to extract all icon names. All the names are simply enclosed by quotes in
    // the type definition file above, so the regex is quite simple.
    this.iconNames = string.match(/"(.*?)"/g).map((name: string) => name.slice(1, -1));
  }

  /** Returns a human-readable name of the icon theme. */
  get name() {
    return 'Material Symbols Rounded';
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

    iconDiv.classList.add('material-symbols-rounded');
    iconDiv.innerText = icon;

    return containerDiv;
  }
}

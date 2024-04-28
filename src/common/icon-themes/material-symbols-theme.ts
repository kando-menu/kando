//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { matchSorter } from 'match-sorter';

import { IIconTheme } from '../icon-theme-registry';

export class MaterialSymbolsTheme implements IIconTheme {
  private iconNames: Array<string> = [];

  constructor() {
    // Load material symbols type definition as text file.
    const string = require('!!raw-loader!material-symbols/index.d.ts').default;

    // Use regex to extract all icon names. All the names are simply enclosed by quotes.
    this.iconNames = string.match(/"(.*?)"/g).map((name: string) => name.slice(1, -1));
  }

  get name() {
    return 'Material Symbols Rounded';
  }

  /**
   * Returns a list icons from this theme that match the given search term.
   *
   * @param searchTerm The search term to filter the icons.
   * @returns An array of icon names that match the search term.
   */
  public listIcons(searchTerm: string): Array<string> {
    return matchSorter(this.iconNames, searchTerm);
  }

  /**
   * Creates a div element that contains the icon with the given name.
   *
   * @param icon One of the icons returned by `listIcons`.
   * @returns A div element that contains the icon.
   */
  createDiv(icon: string) {
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('icon-container');

    const iconDiv = document.createElement('i');
    containerDiv.appendChild(iconDiv);

    iconDiv.classList.add('material-symbols-rounded');
    iconDiv.innerHTML = icon;

    return containerDiv;
  }
}

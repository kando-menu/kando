//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { matchSorter } from 'match-sorter';

import { IIconTheme } from './icon-theme-registry';

/** This class implements an icon theme that uses the Simple Icons font as icons. */
export class SimpleIconsTheme implements IIconTheme {
  /** This array contains all available icon names. It is initialized in the constructor. */
  protected iconNames: Array<string> = [];

  /** The replacement map for special characters in the title. */
  protected titleToSlugReplacements: Record<string, string>;

  /** The regex used to match special characters in the title. */
  protected titleToSlugCharsRegex: RegExp;

  constructor() {
    // Load simple-icons.css as text file.
    const string =
      require('!!raw-loader!simple-icons-font/font/simple-icons.css').default;

    // Use regex to extract all icon names. In the file above, all the names start with a
    // '.si-' and end before the next '::before'. We also ensure not to match the variants
    // with the '--color' suffix.
    const regex = /\.si-([a-z0-9-_]+(?<!-color))(?=::before)/g;
    let match;

    while ((match = regex.exec(string)) !== null) {
      this.iconNames.push(match[1]);
    }

    // The replacement map is copied from the Simple Icons project.
    // Source: https://github.com/simple-icons/simple-icons/blob/develop/sdk.mjs
    this.titleToSlugReplacements = {
      /* eslint-disable @typescript-eslint/naming-convention */
      '+': 'plus',
      '.': 'dot',
      '&': 'and',
      /* eslint-enable @typescript-eslint/naming-convention */
      đ: 'd',
      ħ: 'h',
      ı: 'i',
      ĸ: 'k',
      ŀ: 'l',
      ł: 'l',
      ß: 'ss',
      ŧ: 't',
      ø: 'o',
    };

    // Create a regex that matches all characters in the replacement map.
    this.titleToSlugCharsRegex = new RegExp(
      `[${Object.keys(this.titleToSlugReplacements).join('')}]`,
      'g'
    );
  }

  /** Returns a human-readable name of the icon theme. */
  get name() {
    return 'Simple Icons';
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

  /** Returns information about the icon picker for this icon theme. */
  get iconPickerInfo() {
    return {
      type: 'list' as const,
      usesTextColor: true,
      listIcons: (searchTerm: string) => {
        return matchSorter(
          this.iconNames,

          // Replace special characters in the search term with their replacements.
          // This is necessary because the icon names from the CSS file are always slugs.
          searchTerm.replace(
            this.titleToSlugCharsRegex,
            (char) => this.titleToSlugReplacements[char]
          )
        );
      },
    };
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { matchSorter } from 'match-sorter';
import iconsData from 'simple-icons-font/font/simple-icons.min.json';

import { IconTheme } from './icon-theme-registry';

/** This class implements an icon theme that uses the Simple Icons font as icons. */
export class SimpleIconsTheme implements IconTheme {
  /**
   * This array contains all available icon titles and slugs. It is initialized in the
   * constructor.
   */
  protected iconsData: Array<{ title: string; slug: string }> = [];

  /**
   * This map contains the title of each icon, indexed by its slug. It is initialized in
   * the constructor.
   */
  protected iconTitlesMap: Map<string, string> = new Map();

  constructor() {
    // Initialize the iconsData array and the iconTitlesMap with the data from simple-icons.
    for (const icon of iconsData) {
      this.iconsData.push({ title: icon.title, slug: icon.slug });
      this.iconTitlesMap.set(icon.slug, icon.title);
    }
  }

  /** Returns a human-readable name of the icon theme. */
  get name() {
    return 'Simple Icons';
  }

  /** Get the icon title according to the icon slug. */
  getTitle(slug: string) {
    return this.iconTitlesMap.get(slug) ?? slug;
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
        return matchSorter(this.iconsData, searchTerm, { keys: ['title', 'slug'] }).map(
          (icon) => icon.slug
        );
      },
    };
  }
}

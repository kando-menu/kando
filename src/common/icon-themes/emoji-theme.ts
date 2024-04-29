//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { matchSorter } from 'match-sorter';
import emojis from 'emojilib';

import { IIconTheme } from '../icon-theme-registry';

export class EmojiTheme implements IIconTheme {
  private icons: Array<Array<string>> = [];

  constructor() {
    // Transform the emoji lib object into a nested array where each inner array contains
    // the emoji itself and all descriptions.
    this.icons = Object.entries(emojis).map(([emoji, descriptors]) => {
      return [emoji, ...descriptors];
    });
  }

  get name() {
    return 'Emojis';
  }

  /**
   * Returns a list icons from this theme that match the given search term.
   *
   * @param searchTerm The search term to filter the icons.
   * @returns An array of icon names that match the search term.
   */
  public async listIcons(searchTerm: string) {
    return matchSorter(this.icons, searchTerm, {
      threshold: matchSorter.rankings.CONTAINS,
    }).map(([emoji]) => emoji);
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

    iconDiv.classList.add('emoji-icon');
    iconDiv.innerHTML = icon;

    return containerDiv;
  }
}

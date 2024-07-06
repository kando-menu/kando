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

/**
 * This class is used for custom icon themes loaded from the icon-themes subdirectory of
 * Kando's config directory.
 */
export class UserIconTheme implements IIconTheme {
  /** This array contains all available icon names. It is initialized in the constructor. */
  private iconNames: Array<string> = [];

  /**
   * Creates a new UserIconTheme.
   *
   * @param directory This is the path to the icon-themes directory in Kando's config
   *   directory.
   * @param subdirectory This is the name of the icon theme's subdirectory in the
   *   icon-themes directory.
   */
  constructor(
    private directory: string,
    private subdirectory: string
  ) {
    window.api.listUserIcons(this.subdirectory).then((icons: Array<string>) => {
      this.iconNames = icons;
    });
  }

  /**
   * The name of the icon corresponds to the name of the directory in the icon-themes
   * subdirectory of Kando's config directory.
   */
  get name() {
    return this.subdirectory;
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
  createDiv(icon: string) {
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('icon-container');

    const iconDiv = document.createElement('img');
    containerDiv.appendChild(iconDiv);

    iconDiv.src = `file://${this.directory}/${this.subdirectory}/${icon}`;

    return containerDiv;
  }
}

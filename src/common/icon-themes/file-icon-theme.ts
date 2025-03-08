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
import { IFileIconThemeDescription } from '../../common';

/**
 * This class is used for custom icon themes loaded from a icon-themes directory on the
 * user's file system.
 */
export class FileIconTheme extends IconListTheme {
  /**
   * Creates a new FileIconTheme.
   *
   * @param description The description of the icon theme.
   */
  constructor(private description: IFileIconThemeDescription) {
    super();
  }

  /**
   * The name of the icon corresponds to the name of the directory in the icon-themes
   * subdirectory of Kando's config directory.
   */
  get name() {
    return this.description.name;
  }

  /**
   * Returns a list icons from this theme that match the given search term.
   *
   * @param searchTerm The search term to filter the icons.
   * @returns An array of icon names that match the search term.
   */
  public async listIcons(searchTerm: string) {
    return matchSorter(this.description.icons, searchTerm);
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

    const iconDiv = document.createElement('img');
    iconDiv.src = `file://${this.description.directory}/${icon}`;
    iconDiv.draggable = false;

    containerDiv.appendChild(iconDiv);

    return containerDiv;
  }
}

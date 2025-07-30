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

/**
 * On some systems, the operating system provides a set of icons that can be used in
 * applications. For instance, on Linux, the Freedesktop Icon Theme Specification defines
 * a set of icons that can be used by applications.
 */
export class SystemTheme implements IIconTheme {
  /** A list of all available icon names. */
  private icons: Array<string> = [];

  /** A map of icon names to the file paths of the icons. */
  private iconPaths: Record<string, string> = {};

  /** A human-readable name of the icon theme. */
  get name() {
    return 'System Icons';
  }

  /**
   * Creates a new SystemTheme.
   *
   * @param paths The absolute file paths to the icons.
   */
  constructor(paths: string[]) {
    paths.forEach((path) => {
      const url = new URL(`file://${path}`);
      let name = url.pathname.split('/').pop() || ''; // Extract the file name.
      name = name.replace(/\.[^/.]+$/, ''); // Remove the extension.
      this.icons.push(name);
      this.iconPaths[name] = path;
    });
  }

  /** Creates a div element that contains the icon with the given name. */
  createIcon(icon: string) {
    const iconPath = this.iconPaths[icon];
    if (!iconPath) {
      return null;
    }

    const containerDiv = document.createElement('div');
    containerDiv.classList.add('icon-container');

    const iconDiv = document.createElement('img');
    iconDiv.src = `file://${iconPath}`;
    iconDiv.draggable = false;

    containerDiv.appendChild(iconDiv);

    return containerDiv;
  }

  /** Returns information about the icon picker for this icon theme. */
  get iconPickerInfo() {
    return {
      type: 'list' as const,
      usesTextColor: false,
      listIcons: (searchTerm: string) => matchSorter(this.icons, searchTerm),
    };
  }
}

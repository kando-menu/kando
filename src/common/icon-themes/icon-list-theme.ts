//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IIconTheme } from './icon-theme-registry';
import { IconListPicker } from './icon-pickers/icon-list-picker';

/**
 * This class implements an icon theme that uses emojis as icons. It uses the `emojilib`
 * package to get a list of emojis and their descriptions.
 */
export abstract class IconListTheme implements IIconTheme {
  abstract name: string;

  /**
   * Returns a list icons from this theme that match the given search term. This can be
   * implemented asynchronously if retrieving the list of icons is an expensive
   * operation.
   *
   * @param searchTerm The search term to filter the icons.
   * @returns A promise that resolves to an array of icon names that match the search
   *   term.
   */
  abstract listIcons(searchTerm: string): Promise<Array<string>>;

  // This method is still abstract and needs to be implemented by subclasses. See the docs
  // of this method in the IIconTheme interface for more information.
  abstract createIcon(icon: string): HTMLElement;

  /**
   * Creates an icon picker for this theme. The icon picker allows the user to pick an
   * icon from the theme.
   *
   * @returns An icon picker for this theme.
   */
  createIconPicker() {
    return new IconListPicker(this);
  }
}

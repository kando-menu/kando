//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { WindowWithAPIs } from '../common-window-api';
declare const window: WindowWithAPIs;

import { SimpleIconsTheme } from './simple-icons-theme';
import { SimpleIconsColoredTheme } from './simple-icons-colored-theme';
import { MaterialSymbolsTheme } from './material-symbols-theme';
import { EmojiTheme } from './emoji-theme';
import { FileIconTheme } from './file-icon-theme';
import { FallbackTheme } from './fallback-theme';
import { Base64Theme } from './base64-theme';
import { SystemTheme } from './system-theme';

/**
 * This type describes an icon theme. An icon theme is a collection of icons that can be
 * used in the application. The icon theme provides a method to list all icons that match
 * a given search term.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface IconTheme {
  /** A human-readable name of the icon theme. */
  name: string;

  /**
   * Creates a div element that contains the icon with the given name.
   *
   * @param icon One of the icons returned by `listIcons`.
   * @returns A div element that contains the icon.
   */
  createIcon(icon: string): HTMLElement;

  iconPickerInfo: {
    /**
     * Type of the icon picker for this theme. This is used create an icon picker for the
     * theme. Themes with the "list" type will show a filterable grid of icons, "text"
     * themes will show a text input where the user can type the icon data.
     */
    type: 'list' | 'base64' | 'none';

    /** This will be shown below the icon picker. */
    hint?: string;

    /**
     * Returns a list icons from this theme that match the given search term. This will
     * only be called for "list" type themes.
     *
     * @param searchTerm The search term to filter the icons.
     * @returns A promise that resolves to an array of icon names that match the search
     *   term.
     */
    listIcons?: (searchTerm: string) => Array<string>;
  };
}

/**
 * This class is a registry that contains all available icon themes. It is a singleton
 * class. Use `getInstance` to get the instance of this class.
 */
export class IconThemeRegistry {
  /** The singleton instance of this class. */
  private static instance: IconThemeRegistry = new IconThemeRegistry();

  /** This map contains all available icon themes. The keys are the type names. */
  private iconThemes: Map<string, IconTheme> = new Map();

  /** This is the fallback icon theme that is used if no valid icon theme is selected. */
  private fallbackTheme: IconTheme = new FallbackTheme();

  /** The directory where the user's icon themes are stored. */
  private _userIconThemeDirectory = '';

  /**
   * Use this method to get the singleton instance of this class.
   *
   * @returns The singleton instance of this class.
   */
  public static getInstance(): IconThemeRegistry {
    return IconThemeRegistry.instance;
  }

  /**
   * Initializes the icon theme registry. This method should be called once at the
   * beginning of the application to register all built-in icon themes and the user icon
   * themes.
   */
  public async init() {
    this.iconThemes.set('simple-icons', new SimpleIconsTheme());
    this.iconThemes.set('simple-icons-colored', new SimpleIconsColoredTheme());
    this.iconThemes.set('material-symbols-rounded', new MaterialSymbolsTheme());
    this.iconThemes.set('emoji', new EmojiTheme());
    this.iconThemes.set('base64', new Base64Theme());

    // Add the system icon theme if available.
    await this.reloadSystemIcons();

    // Add an icon theme for all icon themes in the user's icon theme directory.
    const info = await window.commonAPI.getIconThemes();
    this._userIconThemeDirectory = info.userIconDirectory;
    for (const theme of info.fileIconThemes) {
      this.iconThemes.set(theme.name, new FileIconTheme(theme));
    }
  }

  /**
   * Use this method to get the directory where the user's icon themes are stored.
   *
   * @returns The directory where the user's icon themes are stored.
   */
  get userIconThemeDirectory(): string {
    return this._userIconThemeDirectory;
  }

  /**
   * Use this method to get all available icon themes.
   *
   * @returns A map containing all available icon themes. The keys are the unique names
   *   used in the settings.
   */
  public getThemes(): Map<string, IconTheme> {
    return this.iconThemes;
  }

  /**
   * Use this method to get a specific icon theme.
   *
   * @param key The unique key of the icon theme.
   * @returns The icon theme with the given key. If no icon theme with the given key
   *   exists, a fallback icon theme is returned.
   */
  public getTheme(key: string): IconTheme {
    return this.iconThemes.get(key) || this.fallbackTheme;
  }

  /**
   * Create an icon div from the given icon name.
   *
   * @param theme The icon theme to use.
   * @param icon The name of the icon.
   * @returns A div element that contains the icon.
   */
  public createIcon(theme: string, icon: string): HTMLElement {
    const div = this.getTheme(theme).createIcon(icon);

    if (!div) {
      console.warn(`Icon "${icon}" not found in theme "${theme}". Using fallback.`);
      return this.fallbackTheme.createIcon('');
    }

    return div;
  }

  /**
   * Returns information about the icon picker for this icon theme.
   *
   * @param theme The icon theme to use.
   * @returns Information about the icon picker for this icon theme.
   */
  public getIconPickerInfo(theme: string) {
    return this.getTheme(theme).iconPickerInfo;
  }

  /**
   * Reloads the system icons. This is used to update the system icon theme if it has
   * changed.
   */
  public async reloadSystemIcons() {
    const systemIcons = await window.commonAPI.getSystemIcons();
    if (systemIcons.size > 0) {
      this.iconThemes.set('system', new SystemTheme(systemIcons));
    } else {
      this.iconThemes.delete('system');
    }
  }
}

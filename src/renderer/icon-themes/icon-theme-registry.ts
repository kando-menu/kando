//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { SimpleIconsTheme } from './simple-icons-theme';
import { SimpleIconsColoredTheme } from './simple-icons-colored-theme';
import { MaterialSymbolsTheme } from './material-symbols-theme';
import { EmojiTheme } from './emoji-theme';
import { FileIconTheme } from './file-icon-theme';
import { FallbackTheme } from './fallback-theme';
import { Base64Theme } from './base64-theme';

/**
 * This interface describes an icon picker. An icon picker is a UI element that allows the
 * user to pick an icon from an icon theme.
 */
export interface IIconPicker {
  /**
   * Registers a callback that is called when the user selects an icon.
   *
   * @param callback A callback that is called when the user selects an icon. The callback
   *   receives the selected icon as an argument.
   */
  onSelect(callback: (icon: string) => void): void;

  /**
   * Registers a callback that is called when the icon picker should be closed. This could
   * be for instance if the user double-clicks an icon.
   *
   * @param callback A callback that is called when the icon picker should be closed.
   */
  onClose(callback: () => void): void;

  /**
   * Initializes the icon picker. This method will be called after the icon picker is
   * appended to the DOM.
   *
   * @param selectedIcon The icon that is currently selected.
   */
  init(selectedIcon: string): void;

  /** Can be used to clean up resources when the icon picker is no longer needed. */
  deinit(): void;

  /** Returns the HTML fragment of the icon picker. */
  getFragment(): DocumentFragment;
}

/**
 * This interface describes an icon theme. An icon theme is a collection of icons that can
 * be used in the application. The icon theme provides a method to list all icons that
 * match a given search term.
 */
export interface IIconTheme {
  /** A human-readable name of the icon theme. */
  name: string;

  /**
   * Creates a div element that contains the icon with the given name.
   *
   * @param icon One of the icons returned by `listIcons`.
   * @returns A div element that contains the icon.
   */
  createIcon(icon: string): HTMLElement;

  /**
   * Creates an IIconPicker instance that allows the user to pick an icon from the icon
   * theme.
   *
   * @returns An IIconPicker instance.
   */
  createIconPicker(): IIconPicker;
}

/**
 * This class is a registry that contains all available icon themes. It is a singleton
 * class. Use `getInstance` to get the instance of this class.
 */
export class IconThemeRegistry {
  /** The singleton instance of this class. */
  private static instance: IconThemeRegistry = new IconThemeRegistry();

  /** This map contains all available icon themes. The keys are the type names. */
  private iconThemes: Map<string, IIconTheme> = new Map();

  /** This is the fallback icon theme that is used if no valid icon theme is selected. */
  private fallbackTheme: IIconTheme = new FallbackTheme();

  /** The directory where the user's icon themes are stored. */
  private _userIconThemeDirectory = '';

  /**
   * This is a singleton class. The constructor is private. Use `getInstance` to get the
   * instance of this class.
   */
  private constructor() {
    this.iconThemes.set('simple-icons', new SimpleIconsTheme());
    this.iconThemes.set('simple-icons-colored', new SimpleIconsColoredTheme());
    this.iconThemes.set('material-symbols-rounded', new MaterialSymbolsTheme());
    this.iconThemes.set('emoji', new EmojiTheme());
    this.iconThemes.set('base64', new Base64Theme());

    // Add an icon theme for all icon themes in the user's icon theme directory.
    window.api.getIconThemes().then((info) => {
      this._userIconThemeDirectory = info.userIconDirectory;
      for (const theme of info.fileIconThemes) {
        this.iconThemes.set(theme.name, new FileIconTheme(theme));
      }
    });
  }

  /**
   * Use this method to get the singleton instance of this class.
   *
   * @returns The singleton instance of this class.
   */
  public static getInstance(): IconThemeRegistry {
    return IconThemeRegistry.instance;
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
   *   used in the menu settings.
   */
  public getThemes(): Map<string, IIconTheme> {
    return this.iconThemes;
  }

  /**
   * Use this method to get a specific icon theme.
   *
   * @param key The unique key of the icon theme.
   * @returns The icon theme with the given key. If no icon theme with the given key
   *   exists, a fallback icon theme is returned.
   */
  public getTheme(key: string): IIconTheme {
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
    return this.getTheme(theme).createIcon(icon);
  }

  /**
   * Creates an IIConPicker instance that allows the user to pick an icon from the icon
   * theme.
   *
   * @param theme The icon theme to use.
   * @returns An IIconPicker instance.
   */
  createIconPicker(theme: string): IIconPicker {
    return this.getTheme(theme).createIconPicker();
  }
}

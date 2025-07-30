//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { readIniFile } from 'read-ini-file';
import { execSync } from 'child_process';

import { Backend } from '../backend';

/**
 * This generic Linux backend class provides the basic functionality for all Linux
 * backends. For now, this is just getting the system icons according to the Freedesktop
 * Icon Theme Specification.
 */
export abstract class LinuxBackend extends Backend {
  private iconSearchPaths: string[] = [];

  constructor() {
    super();

    // List of paths to search for icons. The order is important, if a theme is found in
    // multiple locations, the first one has priority.
    const home = os.homedir();
    this.iconSearchPaths = [
      path.join(home, '.icons/'),
      path.join(home, '.local/share/icons/'),
      path.join(home, '.local/share/pixmaps/'),
      path.join(home, '.pixmaps/'),
    ];
    process.env.XDG_DATA_DIRS?.split(':').forEach((dir) => {
      this.iconSearchPaths.push(path.join(dir, 'icons/'));
    });
    this.iconSearchPaths.push('/usr/share/icons/');
    this.iconSearchPaths.push('/usr/local/share/icons/');
    this.iconSearchPaths.push('/usr/share/pixmaps/');
    this.iconSearchPaths.push('/usr/local/share/pixmaps/');

    // Make search paths unique.
    this.iconSearchPaths = this.iconSearchPaths.filter(
      (item, index) => this.iconSearchPaths.indexOf(item) === index
    );
  }

  /**
   * This returns the icons that are available in the current icon theme according to the
   * Freedesktop Icon Theme Specification. More information can be found here:
   * https://specifications.freedesktop.org/icon-theme-spec/latest/).
   *
   * It excludes some categories like "animations", or "emblems" that are usually not so
   * useful in a pie menu. Also, if some icons are only available below 48px size, they
   * are excluded as well. Only icons in SVG or PNG format are returned. If an icon is
   * available in both formats, the SVG version is preferred.
   *
   * @returns A list absolute file paths to the icons.
   */
  public override async getSystemIcons(): Promise<Array<string>> {
    const startTime = performance.now();

    const currentTheme = await this.getCurrentIconTheme();
    const allThemeDirectories = await this.getThemeDirectoriesRecursively(currentTheme);
    const icons = await this.getIcons(
      allThemeDirectories,
      ['apps', 'actions', 'devices', 'mimetypes'],
      ['scalable', '48x48', '48'],
      ['.svg', '.png']
    );

    const endTime = performance.now();
    const timeTaken = endTime - startTime;

    console.log(
      `Found ${icons.length} ${currentTheme} icons in ${timeTaken.toFixed(2)}ms.`
    );
    return icons;
  }

  /**
   * This method retrieves the current icon theme from the system. It checks various
   * desktop environments (GNOME, KDE, XFCE) and their respective configuration files to
   * find the currently set icon theme. If no specific theme is found, it defaults to
   * 'hicolor', which is a standard fallback theme according to the Freedesktop Icon Theme
   * Specification.
   *
   * @returns A promise that resolves to the name of the current icon theme as a string.
   */
  private async getCurrentIconTheme(): Promise<string> {
    // Check the environment variable first.
    if (process.env.ICON_THEME) {
      return process.env.ICON_THEME;
    }

    const home = os.homedir();

    const tryGNOME = () => {
      try {
        const output = execSync('gsettings get org.gnome.desktop.interface icon-theme', {
          encoding: 'utf8',
        }).trim();
        return output.replace(/^'|'$/g, ''); // remove surrounding quotes
      } catch {
        return null;
      }
    };

    const tryKDE = async () => {
      const kdeFile = path.join(home, '.config', 'kdeglobals');
      if (!fs.existsSync(kdeFile)) {
        return null;
      }
      try {
        const data = (await readIniFile(kdeFile)) as {
          ['Icons']?: { ['Theme']?: string };
        };
        return data?.Icons?.Theme || null;
      } catch {
        return null;
      }
    };

    const tryXFCE = () => {
      try {
        const output = execSync('xfconf-query -c xsettings -p /Net/IconThemeName', {
          encoding: 'utf8',
        }).trim();
        return output || null;
      } catch {
        return null;
      }
    };

    const tryGTKSettings = async () => {
      const gtkFile = path.join(home, '.config', 'gtk-3.0', 'settings.ini');
      if (!fs.existsSync(gtkFile)) {
        return null;
      }
      try {
        const data = (await readIniFile(gtkFile)) as {
          ['Settings']?: { ['gtk-icon-theme-name']?: string };
        };
        return data?.Settings?.['gtk-icon-theme-name'] || null;
      } catch {
        return null;
      }
    };

    const desktop = process.env.XDG_CURRENT_DESKTOP || '';

    switch (desktop.toLowerCase()) {
      case 'gnome':
        return tryGNOME() || (await tryGTKSettings()) || 'hicolor';
      case 'kde':
        return (await tryKDE()) || (await tryGTKSettings()) || 'hicolor';
      case 'xfce':
        return tryXFCE() || (await tryGTKSettings()) || 'hicolor';
    }

    return (
      tryGNOME() || (await tryKDE()) || tryXFCE() || (await tryGTKSettings()) || 'hicolor'
    );
  }

  /**
   * This method finds the directories of a given icon theme by searching common locations
   * where icon themes are stored on Linux systems. It returns an array of paths where the
   * icons for the specified theme are located. According to the Freedesktop Icon Theme
   * Specification, an icon theme can be spread across multiple directories.
   *
   * @param themeName The name of the icon theme to search for.
   * @returns A promise that resolves to an array of paths where the icon theme is
   *   located.
   */
  private async getThemeDirectories(themeName: string): Promise<string[]> {
    const paths: string[] = [];

    // Check each path for the theme directory.
    for (const basePath of this.iconSearchPaths) {
      const themePath = path.join(basePath, themeName, 'index.theme');
      try {
        // Check if the file exists.
        await fs.promises.access(themePath);
        paths.push(path.dirname(themePath));
      } catch {
        continue;
      }
    }

    return paths;
  }

  /**
   * This method retrieves the list of icon themes that the given theme inherits from. It
   * reads the `index.theme` files of the theme and returns the names of the inherited
   * themes.
   *
   * @param themeName The name of the icon theme to check for inherited themes.
   * @returns A promise that resolves to an array of names of inherited themes.
   */
  private async getInheritedThemes(themeName: string): Promise<string[]> {
    const themeDirectories = await this.getThemeDirectories(themeName);
    if (themeDirectories.length === 0) {
      return [];
    }

    const inheritedThemes: string[] = [];
    for (const themeDirectory of themeDirectories) {
      try {
        const data = (await readIniFile(path.join(themeDirectory, 'index.theme'))) as {
          ['Icon Theme']?: { ['Inherits']?: string };
        };
        let inherits =
          data['Icon Theme']?.['Inherits']?.split(',').map((name) => name.trim()) || [];
        inherits = inherits.filter((name) => inheritedThemes.indexOf(name) === -1);
        inheritedThemes.push(...inherits);
      } catch {
        // If the index.theme file cannot be read, we simply ignore this directory.
        continue;
      }
    }

    if (inheritedThemes.length === 0) {
      return ['hicolor'];
    }

    return inheritedThemes;
  }

  /**
   * This method retrieves all inherited themes for a given theme name, including
   * recursively inherited themes. The result is an array of theme names, with the
   * original theme name as the first element and all inherited themes following it.
   *
   * @param themeName The name of the icon theme to check for inherited themes.
   * @returns A promise that resolves to an array of names of all inherited themes,
   *   including the given theme name as the first element.
   */
  private async getInheritedThemesRecursively(themeName: string): Promise<string[]> {
    const themes = [themeName];
    let inheritedThemes = await this.getInheritedThemes(themeName);
    while (inheritedThemes.length > 0) {
      const newThemes = inheritedThemes.filter((theme) => !themes.includes(theme));
      themes.push(...newThemes);
      inheritedThemes = (
        await Promise.all(newThemes.map((theme) => this.getInheritedThemes(theme)))
      ).flat();
    }
    return themes;
  }

  /**
   * This method returns all directories where the icons of the current icon theme are
   * located, including directories of inherited themes.
   *
   * @param themeName The name of the icon theme to check for directories.
   * @returns A promise that resolves to an array of paths where the icons of the theme
   *   are located.
   */
  private async getThemeDirectoriesRecursively(themeName: string): Promise<string[]> {
    const themes = await this.getInheritedThemesRecursively(themeName);
    const directories: string[] = [];
    for (const theme of themes) {
      const themeDirectories = await this.getThemeDirectories(theme);
      directories.push(...themeDirectories);
    }
    return directories;
  }

  /**
   * This method retrieves the icons from the specified base paths, contexts, sizes, and
   * file types. It will look into all base paths. Icons found in the first base path will
   * be preferred over icons found in later base paths. The same applies to the sizes: if
   * an icon is available in multiple sizes, the first one found will be used. Only icons
   * that match the specified contexts and file types will be returned.
   *
   * @param basePaths The base paths to search for icons.
   * @param contexts The contexts in which the icons are used (e.g., 'apps', 'actions').
   * @param sizes The sizes of the icons to retrieve (e.g., 'scalable', '48x48').
   * @param fileTypes The file types of the icons to retrieve (e.g., '.svg', '.png').
   * @returns A promise that resolves to an array of absolute file paths to the icons that
   *   match the specified criteria.
   */
  private async getIcons(
    basePaths: string[],
    contexts: string[],
    sizes: string[],
    fileTypes: string[]
  ): Promise<string[]> {
    // Maps icon names to their absolute file paths.
    const icons = new Map<string, string>();

    // Iterate over all base paths backwards to ensure that icons from the first path
    // overwrite icons from later paths.
    for (const basePath of basePaths.reverse()) {
      for (const size of sizes.reverse()) {
        for (const context of contexts) {
          // Some themes sort first by size, some by context.
          const directories = [
            path.join(basePath, context, size),
            path.join(basePath, size, context),
          ];

          // Check each directory for icons.
          for (const dir of directories) {
            if (!fs.existsSync(dir)) {
              continue; // Skip if the directory does not exist.
            }
            const files = await fs.promises.readdir(dir);
            for (const file of files) {
              const ext = path.extname(file).toLowerCase();
              if (fileTypes.includes(ext)) {
                const iconName = path.basename(file, ext);
                icons.set(iconName, path.join(dir, file));
              }
            }
          }
        }
      }
    }

    // Convert the map to an array of absolute file paths.
    return Array.from(icons.values());
  }
}

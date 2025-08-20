//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { app } from 'electron';

import { MENU_SETTINGS_SCHEMA, IMenuSettings } from '../../common/settings-schemata';
import { Settings } from './settings';

import { version } from './../../../package.json';

/**
 * Loads the contents of the settings file and returns an object that conforms to the
 * latest `IMenuSettings` interface. If the content does not conform to the current
 * schema, it will be migrated to the current schema.
 *
 * @param content The content of the settings file as an object.
 * @returns An object containing the parsed settings and a boolean indicating whether a
 *   migration was performed.
 */
function loadMenuSettings(content: object): {
  settings: IMenuSettings;
  didMigration: boolean;
} {
  // If the version field is not present, we assume this is an old settings file.
  // There is nothing actually to migrate, but we need to store the version field
  // in the settings file to indicate that it has been loaded with the current version.
  // Hence, we set didMigration to true.
  if (!('version' in content)) {
    return { settings: MENU_SETTINGS_SCHEMA.parse(content), didMigration: true };
  }

  // Here we could compare the version to the current version and decide whether any
  // migration is necessary. For now, no further migrations are needed.
  if (content.version !== version) {
    const settings = MENU_SETTINGS_SCHEMA.parse(content);

    // Yet we still need to update the version to the current version. We set
    // didMigration to true to indicate that the settings file has been updated.
    settings.version = version;
    return { settings, didMigration: true };
  }

  return { settings: MENU_SETTINGS_SCHEMA.parse(content), didMigration: false };
}

/**
 * Returns a Settings instance for the menu settings. This instance can be used to access
 * the menu settings and to save changes to them. This will print an error message to the
 * console if the settings file cannot be loaded or parsed. It will also return null in
 * that case.
 *
 * @param ignoreWriteProtectedConfigFiles If true, any write-errors due to write-protected
 *   config files will be ignored. This is useful on immutable filesystems.
 * @returns A Settings instance for the menu settings, or null if an error occurred.
 */
export function getMenuSettings(
  ignoreWriteProtectedConfigFiles: boolean
): Settings<IMenuSettings> | null {
  try {
    return new Settings<IMenuSettings>({
      file: 'menus.json',
      directory: app.getPath('userData'),
      ignoreWriteProtectedConfigFiles,
      defaults: () => MENU_SETTINGS_SCHEMA.parse({}),
      load: (content) => loadMenuSettings(content),
    });
  } catch (error) {
    console.error(
      'Error loading menu settings:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

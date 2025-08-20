//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { app } from 'electron';

import { migrateToGeneralSettingsV1 } from '../../common/settings-schemata/general-settings-v1';
import { migrateToGeneralSettingsV2 } from '../../common/settings-schemata/general-settings-v2';
import {
  GENERAL_SETTINGS_SCHEMA,
  IGeneralSettings,
} from '../../common/settings-schemata';
import { Settings } from './settings';

import { version } from './../../../package.json';

/**
 * Loads the contents of the settings file and returns an object that conforms to the
 * latest `IGeneralSettings` interface. If the content does not conform to the current
 * schema, it will be migrated to the current schema.
 *
 * @param content The content of the settings file as an object.
 * @returns An object containing the parsed settings and a boolean indicating whether a
 *   migration was performed.
 */
function loadGeneralSettings(content: object): {
  settings: IGeneralSettings;
  didMigration: boolean;
} {
  // If the version field is not present, we assume this is an old settings file.
  if (!('version' in content)) {
    const v1 = migrateToGeneralSettingsV1(content);
    const settings = migrateToGeneralSettingsV2(v1);
    return { settings, didMigration: true };
  }

  // Here we could compare the version to the current version and decide whether any
  // migration is necessary. For now, no further migrations are needed.
  if (content.version !== version) {
    const settings = GENERAL_SETTINGS_SCHEMA.parse(content, { reportInput: true });

    // Yet we still need to update the version to the current version. We set
    // didMigration to true to indicate that the settings file has been updated.
    settings.version = version;
    return { settings, didMigration: true };
  }

  return {
    settings: GENERAL_SETTINGS_SCHEMA.parse(content, { reportInput: true }),
    didMigration: false,
  };
}

/**
 * Returns a Settings instance for the general settings. This instance can be used to
 * access the general settings and to save changes to them. This will print an error
 * message to the console if the settings file cannot be loaded or parsed. It will also
 * return null in that case.
 *
 * @returns A Settings instance for the menu settings, or null if an error occurred.
 */
export function getGeneralSettings(): Settings<IGeneralSettings> | null {
  try {
    return new Settings<IGeneralSettings>({
      file: 'config.json',
      directory: app.getPath('userData'),
      defaults: () => GENERAL_SETTINGS_SCHEMA.parse({}),
      load: (content) => loadGeneralSettings(content),
    });
  } catch (error) {
    console.error(
      'Error loading general settings:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

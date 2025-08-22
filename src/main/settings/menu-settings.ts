//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { app } from 'electron';

import {
  MENU_SETTINGS_SCHEMA_V1,
  MenuSettingsV1,
} from '../../common/settings-schemata/menu-settings-v1';

import { MENU_SETTINGS_SCHEMA, MenuSettings } from '../../common/settings-schemata';
import { Settings } from './settings';

import { version } from './../../../package.json';

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
): Settings<MenuSettings> | null {
  try {
    return new Settings<MenuSettings>({
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

/**
 * Loads the contents of the settings file and returns an object that conforms to the
 * latest `MenuSettings` type. If the content does not conform to the current schema, it
 * will be migrated to the current schema.
 *
 * @param content The content of the settings file as an object.
 * @returns An object containing the parsed settings and a boolean indicating whether a
 *   migration was performed.
 */
function loadMenuSettings(content: object): {
  settings: MenuSettings;
  didMigration: boolean;
} {
  // If the version field is not present, we assume this is an old settings file.
  if (!('version' in content)) {
    const settings = migrateToMenuSettingsV1(content);
    return { settings, didMigration: true };
  }

  // Here we could compare the version to the current version and decide whether any
  // migration is necessary. For now, no further migrations are needed.
  if (content.version !== version) {
    const settings = MENU_SETTINGS_SCHEMA.parse(content, { reportInput: true });

    // Yet we still need to update the version to the current version. We set
    // didMigration to true to indicate that the settings file has been updated.
    settings.version = version;
    return { settings, didMigration: true };
  }

  return {
    settings: MENU_SETTINGS_SCHEMA.parse(content, { reportInput: true }),
    didMigration: false,
  };
}

/**
 * The only real difference between the settings from pre-Kando 2.1.0 times and the
 * MenuSettingsV1 format is that the latter contains the version field. This function
 * migrates an old settings object to an MenuSettingsV1 object by adding the version field
 * with its default value.
 *
 * The function also migrates some old properties that were present in Kando 1.8.0 and
 * earlier. These properties were moved to different locations in the settings object.
 *
 * @param oldSettings The old settings object to migrate.
 * @returns The migrated settings object in the MenuSettingsV1 format.
 */
function migrateToMenuSettingsV1(oldSettings: object): MenuSettingsV1 {
  console.log('Migrating potentially old settings to MenuSettingsV1 format...');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = oldSettings as any;

  // Up to Kando 0.9.0, the `root` property of the menu was an object called `nodes`.
  if (raw.menus && Array.isArray(raw.menus)) {
    for (const menu of raw.menus) {
      if (menu.nodes && typeof menu.nodes === 'object' && !Array.isArray(menu.nodes)) {
        menu.root = menu.nodes;
        delete menu.nodes;
      }
    }
  }

  // Up to Kando 1.8.0, there was a `templates` property in the menu settings. This was
  // removed. We we add all template menus as ordinary menus with a template tag. All
  // template menu-items are removed.
  if (raw.templates && Array.isArray(raw.templates)) {
    for (const itemOrMenu of raw.templates) {
      // If there is a type property, it is a menu item.
      // Else, it is a menu template. We add it as a menu with a template tag. Also
      // remove any bindings, so that the menu is not opened by a shortcut.
      if (!itemOrMenu.type) {
        itemOrMenu.tags = ['template'];
        itemOrMenu.shortcut = '';
        itemOrMenu.shortcutID = '';

        // Add an empty menus array if it does not exist.
        if (!raw.menus) {
          raw.menus = [];
        }

        raw.menus.push(itemOrMenu);
      }
    }

    delete raw.templates;
  }

  // Now we parse the migrated settings again to ensure that the values set above match
  // the schema.
  return MENU_SETTINGS_SCHEMA_V1.parse(raw, { reportInput: true });
}

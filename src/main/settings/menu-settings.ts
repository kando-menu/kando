//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import fs from 'fs-extra';
import semver from 'semver';
import lodash from 'lodash';

import {
  MENU_SETTINGS_SCHEMA_V1,
  MenuSettingsV1,
  MenuItemV1,
} from '../../common/settings-schemata/menu-settings-v1';

import {
  MENU_SETTINGS_SCHEMA_V2,
  MenuSettingsV2,
  MenuItemV2,
  MenuV2,
} from '../../common/settings-schemata/menu-settings-v2';

import { MenuSettings } from '../../common/settings-schemata';
import { getConfigDirectory, Settings } from '.';

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
      name: 'menus',
      file: 'menus.json',
      directory: getConfigDirectory(),
      ignoreWriteProtectedConfigFiles,
      defaults: () => MENU_SETTINGS_SCHEMA_V2.parse({}),
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
 * Checks whether the given path points to a valid menu settings file. If not, an
 * exception is thrown.
 *
 * @param path The path to check.
 */
export function tryLoadMenuSettingsFile(path: string) {
  // First we try to read the file content. This will throw an exception if the file
  // cannot be read.
  const content = fs.readJSONSync(path, 'utf-8');

  // Now we try to parse the content according to the latest schema. This will throw an
  // exception if the content does not conform to the schema.
  const result = loadMenuSettings(content);

  // The schema is not very strict as most properties are optional. As a sanity check, we
  // check whether at least one menu is present.
  if (result.settings.menus.length === 0) {
    throw new Error('The provided file does not seem to contain any menus.');
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
    const settingsV1 = migrateToMenuSettingsV1(content);
    const settingsV2 = migrateToMenuSettingsV2(settingsV1);
    return { settings: settingsV2, didMigration: true };
  }

  // If we are loading pre-3.0 settings, we need to migrate them to the new format. For
  // updates within the 3 series, we can just parse the settings according to the latest
  // schema and update the version field if necessary.
  const contentVersion = typeof content.version === 'string' ? content.version : '';
  const parsedVersion =
    semver.valid(contentVersion) ?? semver.valid(semver.coerce(contentVersion));
  if (parsedVersion && semver.lt(parsedVersion, '3.0.0')) {
    const settingsV1 = MENU_SETTINGS_SCHEMA_V1.parse(content, { reportInput: true });
    const settingsV2 = migrateToMenuSettingsV2(settingsV1);
    return { settings: settingsV2, didMigration: true };
  } else if (content.version !== version) {
    const settings = MENU_SETTINGS_SCHEMA_V2.parse(content, { reportInput: true });

    // Yet we still need to update the version to the current version. We set
    // didMigration to true to indicate that the settings file has been updated.
    settings.version = version;
    return { settings, didMigration: true };
  }

  return {
    settings: MENU_SETTINGS_SCHEMA_V2.parse(content, { reportInput: true }),
    didMigration: false,
  };
}

/** Migrates pre-3.0 menu settings to the workflow-based v2 format. */
function migrateToMenuSettingsV2(oldSettings: MenuSettingsV1): MenuSettingsV2 {
  console.log('Migrating potentially old settings to MenuSettingsV2 format...');

  // The collection schema has not changed, so we can directly use the old collections.
  const newSettings: MenuSettingsV2 = {
    version,
    menus: [],
    collections: lodash.cloneDeep(oldSettings.collections),
  };

  // The key difference between the old and the new menu format uses a workflow-based
  // approach. Instead of many menu-item types, we now have only "buttons" and "submenus".
  // Each have some workflows triggered by events like "select" or "hover". The workflows
  // are composed of actions which now have those types.
  const migrateToMenuItemV2 = (oldItem: MenuItemV1): MenuItemV2 => {
    const newItem: MenuItemV2 = {
      type: oldItem.type === 'submenu' ? 'submenu' : 'button',
      name: oldItem.name,
      icon: oldItem.icon,
      iconTheme: oldItem.iconTheme,
    };

    if (oldItem.quickSelectKey != null) {
      newItem.quickSelectKey = oldItem.quickSelectKey;
    }

    if (oldItem.angle != null) {
      newItem.angle = oldItem.angle;
    }

    // Now create the select-workflow for the new item. Depending on the old item type, we
    // create different actions for the select event of the new item.
    if (newItem.type === 'button') {
      if (oldItem.type === 'command') {
        newItem.selectWorkflow = {
          waitForFadeout: (oldItem.data as { delay?: boolean }).delay ?? true,
          inhibitShortcuts: false,
          actions: [
            {
              type: 'execute-command',
              command: (oldItem.data as { command?: string }).command ?? '',
              detached: (oldItem.data as { detached?: boolean }).detached ?? true,
              isolated: (oldItem.data as { isolated?: boolean }).isolated ?? false,
            },
          ],
        };
      } else if (oldItem.type === 'file') {
        newItem.selectWorkflow = {
          waitForFadeout: false,
          inhibitShortcuts: false,
          actions: [
            {
              type: 'open-file',
              path: (oldItem.data as { path?: string }).path ?? '',
            },
          ],
        };
      } else if (oldItem.type === 'hotkey') {
        newItem.selectWorkflow = {
          inhibitShortcuts:
            (oldItem.data as { inhibitShortcuts?: boolean }).inhibitShortcuts ?? false,
          waitForFadeout: (oldItem.data as { delay?: boolean }).delay ?? true,
          actions: [
            {
              type: 'simulate-hotkey',
              hotkey: (oldItem.data as { hotkey?: string }).hotkey ?? '',
            },
          ],
        };
      } else if (oldItem.type === 'macro') {
        newItem.selectWorkflow = {
          inhibitShortcuts:
            (oldItem.data as { inhibitShortcuts?: boolean }).inhibitShortcuts ?? false,
          waitForFadeout: (oldItem.data as { delay?: boolean }).delay ?? true,
          actions: [
            {
              type: 'execute-macro',
              macro: lodash.cloneDeep(
                (
                  oldItem.data as {
                    macro?: {
                      type: 'keyDown' | 'keyUp';
                      delay: number;
                      key: string;
                    }[];
                  }
                ).macro ?? []
              ),
            },
          ],
        };
      } else if (oldItem.type === 'text') {
        newItem.selectWorkflow = {
          waitForFadeout: true,
          inhibitShortcuts: true,
          actions: [
            {
              type: 'set-clipboard',
              text: (oldItem.data as { text?: string }).text ?? '',
            },
            {
              type: 'simulate-hotkey',
              hotkey: 'ControlLeft+V',
            },
          ],
        };
      } else if (oldItem.type === 'uri') {
        newItem.selectWorkflow = {
          waitForFadeout: false,
          inhibitShortcuts: false,
          actions: [
            {
              type: 'open-uri',
              uri: (oldItem.data as { uri?: string }).uri ?? '',
            },
          ],
        };
      } else if (oldItem.type === 'redirect') {
        newItem.selectWorkflow = {
          waitForFadeout: false,
          inhibitShortcuts: false,
          actions: [
            {
              type: 'open-menu',
              menu: (oldItem.data as { menu?: string }).menu ?? '',
            },
          ],
        };
      } else if (oldItem.type === 'settings') {
        newItem.selectWorkflow = {
          waitForFadeout: false,
          inhibitShortcuts: false,
          actions: [
            {
              type: 'open-settings',
            },
          ],
        };
      }
    }

    // Finally recursively migrate the children if there are any.
    if (newItem.type === 'submenu' && oldItem.children) {
      newItem.children = oldItem.children.map(migrateToMenuItemV2);
    }

    return newItem;
  };

  // The menu schema has not changed either, but the menu items themselves have changed a
  // lot. We copy over the menus and transform the menu items to the new format.
  for (const oldMenu of oldSettings.menus) {
    const newMenu: MenuV2 = {
      root: migrateToMenuItemV2(oldMenu.root),
      shortcut: oldMenu.shortcut,
      shortcutID: oldMenu.shortcutID,
      centered: oldMenu.centered,
      anchored: oldMenu.anchored,
      hoverMode: oldMenu.hoverMode,
      tags: lodash.cloneDeep(oldMenu.tags),
    };

    if (oldMenu.conditions != null) {
      newMenu.conditions = lodash.cloneDeep(oldMenu.conditions);
    }

    newSettings.menus.push(newMenu);
  }

  return newSettings;
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

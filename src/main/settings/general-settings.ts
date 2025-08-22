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
  GENERAL_SETTINGS_SCHEMA_V1,
  GeneralSettingsV1,
} from '../../common/settings-schemata/general-settings-v1';

import { GENERAL_SETTINGS_SCHEMA, GeneralSettings } from '../../common/settings-schemata';

import { Settings } from './settings';

import { version } from './../../../package.json';

/**
 * Returns a Settings instance for the general settings. This instance can be used to
 * access the general settings and to save changes to them. This will print an error
 * message to the console if the settings file cannot be loaded or parsed. It will also
 * return null in that case.
 *
 * @returns A Settings instance for the menu settings, or null if an error occurred.
 */
export function getGeneralSettings(): Settings<GeneralSettings> | null {
  try {
    return new Settings<GeneralSettings>({
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

/**
 * Loads the contents of the settings file and returns an object that conforms to the
 * latest `GeneralSettings` type. If the content does not conform to the current schema,
 * it will be migrated to the current schema.
 *
 * @param content The content of the settings file as an object.
 * @returns An object containing the parsed settings and a boolean indicating whether a
 *   migration was performed.
 */
function loadGeneralSettings(content: object): {
  settings: GeneralSettings;
  didMigration: boolean;
} {
  // If the version field is not present, we assume this is an old settings file.
  if (!('version' in content)) {
    const settings = migrateToGeneralSettingsV1(content);
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
 * The only real difference between the settings from pre-Kando 2.1.0 times and the
 * GeneralSettingsV1 format is that the latter contains the version field. This function
 * migrates an old settings object to an GeneralSettingsV1 object by adding the version
 * field with its default value.
 *
 * The function also migrates some old properties that were present in Kando 1.8.0 and
 * earlier. These properties were moved to different locations in the settings object.
 *
 * @param oldSettings The old settings object to migrate.
 * @returns The migrated settings object in the GeneralSettingsV1 format.
 */
function migrateToGeneralSettingsV1(oldSettings: object): GeneralSettingsV1 {
  console.log('Migrating potentially old settings to GeneralSettingsV1 format...');

  const migrated = GENERAL_SETTINGS_SCHEMA_V1.parse(oldSettings, { reportInput: true });

  // Up to Kando 1.8.0, there was a settings.editorOptions.showEditorButtonVisible
  // property. This was changed to settings.hideSettingsButton.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = oldSettings as any;
  if (raw.editorOptions?.showEditorButtonVisible === false) {
    migrated.hideSettingsButton = true;
  }

  // Up to Kando 1.8.0, the following properties were stored in a settings.menuOptions
  // object. Later they became top-level properties.
  if (raw.menuOptions) {
    migrated.centerDeadZone = raw.menuOptions.centerDeadZone;
    migrated.minParentDistance = raw.menuOptions.minParentDistance;
    migrated.dragThreshold = raw.menuOptions.dragThreshold;
    migrated.fadeInDuration = raw.menuOptions.fadeInDuration;
    migrated.fadeOutDuration = raw.menuOptions.fadeOutDuration;
    migrated.enableMarkingMode = raw.menuOptions.enableMarkingMode;
    migrated.enableTurboMode = raw.menuOptions.enableTurboMode;
    migrated.hoverModeNeedsConfirmation = raw.menuOptions.hoverModeNeedsConfirmation;
    migrated.gestureMinStrokeLength = raw.menuOptions.gestureMinStrokeLength;
    migrated.gestureMinStrokeAngle = raw.menuOptions.gestureMinStrokeAngle;
    migrated.gestureJitterThreshold = raw.menuOptions.gestureJitterThreshold;
    migrated.gesturePauseTimeout = raw.menuOptions.gesturePauseTimeout;
    migrated.fixedStrokeLength = raw.menuOptions.fixedStrokeLength;
    migrated.rmbSelectsParent = raw.menuOptions.rmbSelectsParent;
    migrated.enableGamepad = raw.menuOptions.enableGamepad;
    migrated.gamepadBackButton = raw.menuOptions.gamepadBackButton;
    migrated.gamepadCloseButton = raw.menuOptions.gamepadCloseButton;
  }

  // Parse the migrated settings again to ensure that the values set above match the
  // schema.
  return GENERAL_SETTINGS_SCHEMA_V1.parse(migrated, { reportInput: true });
}

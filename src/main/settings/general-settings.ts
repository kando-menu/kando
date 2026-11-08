//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import fs from 'fs-extra';

import {
  GENERAL_SETTINGS_SCHEMA_V1,
  GeneralSettingsV1,
} from '../../common/settings-schemata/general-settings-v1';

import { GENERAL_SETTINGS_SCHEMA, GeneralSettings } from '../../common/settings-schemata';

import { getConfigDirectory, Settings } from '.';

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
      name: 'settings',
      file: 'config.json',
      directory: getConfigDirectory(),
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
 * Checks whether the given path points to a valid general settings file. If not, an
 * exception is thrown. Returns the parsed (and possibly migrated) settings so that the
 * caller can apply them via the existing Settings instance.
 *
 * @param path The path to check.
 * @returns The parsed and migrated general settings.
 */
export function tryLoadGeneralSettingsFile(path: string): GeneralSettings {
  // First we try to read the file content. This will throw an exception if the file
  // cannot be read.
  const content = fs.readJSONSync(path, 'utf-8');

  // The schema is not very strict as most properties are optional. As a sanity check, we
  // look for the presence of the "version" field.
  if (!('version' in content)) {
    throw new Error(
      'The provided file does not seem to be a valid general settings file.'
    );
  }

  // Now we try to parse the content according to the latest schema. This will throw an
  // exception if the content does not conform to the schema.
  return loadGeneralSettings(content).settings;
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
export function loadGeneralSettings(content: object): {
  settings: GeneralSettings;
  didMigration: boolean;
} {
  // There used to be a boolean rmbSelectsParent property which was replaced by
  // rightMouseButtonBehavior. The schema parsing below would strip the old property, so
  // we have to convert it first. This is also necessary if the version matches.
  const { content: converted, didConvert } = convertRmbSelectsParent(content);

  // If the version field is not present, we assume this is an old settings file.
  if (!('version' in converted)) {
    const settings = migrateToGeneralSettingsV1(converted);
    return { settings, didMigration: true };
  }

  // Here we could compare the version to the current version and decide whether any
  // migration is necessary. For now, no further migrations are needed.
  if (converted.version !== version) {
    const settings = GENERAL_SETTINGS_SCHEMA.parse(converted, { reportInput: true });

    // Yet we still need to update the version to the current version. We set
    // didMigration to true to indicate that the settings file has been updated.
    settings.version = version;
    return { settings, didMigration: true };
  }

  return {
    settings: GENERAL_SETTINGS_SCHEMA.parse(converted, { reportInput: true }),
    didMigration: didConvert,
  };
}

/**
 * Replaces the legacy top-level rmbSelectsParent property with the new
 * rightMouseButtonBehavior property. An explicitly set rightMouseButtonBehavior takes
 * precedence over the old value. The given object is not modified.
 *
 * @param content The content of the settings file as an object.
 * @returns A copy of the content without the old property, and a boolean indicating
 *   whether the old property was present.
 */
function convertRmbSelectsParent(content: object): {
  content: object;
  didConvert: boolean;
} {
  if (!('rmbSelectsParent' in content)) {
    return { content, didConvert: false };
  }

  const { rmbSelectsParent, ...rest } = content as {
    rmbSelectsParent: unknown;
    rightMouseButtonBehavior?: unknown;
  };

  if (
    rest.rightMouseButtonBehavior === undefined &&
    typeof rmbSelectsParent === 'boolean'
  ) {
    rest.rightMouseButtonBehavior = rmbSelectsParent ? 'select-parent' : 'close';
  }

  return { content: rest, didConvert: true };
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
    migrated.enableGamepad = raw.menuOptions.enableGamepad;
    migrated.gamepadBackButton = raw.menuOptions.gamepadBackButton;
    migrated.gamepadCloseButton = raw.menuOptions.gamepadCloseButton;
  }

  // The rmbSelectsParent property was replaced by rightMouseButtonBehavior. If the old
  // value is present in the menuOptions, it is converted unless the new property was set
  // explicitly in the settings file.
  if (
    typeof raw.menuOptions?.rmbSelectsParent === 'boolean' &&
    raw.rightMouseButtonBehavior === undefined
  ) {
    migrated.rightMouseButtonBehavior = raw.menuOptions.rmbSelectsParent
      ? 'select-parent'
      : 'close';
  }

  // Parse the migrated settings again to ensure that the values set above match the
  // schema.
  return GENERAL_SETTINGS_SCHEMA_V1.parse(migrated, { reportInput: true });
}

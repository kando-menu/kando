//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import {
  ACHIEVEMENT_STATS_SCHEMA,
  AchievementStats,
} from '../../common/settings-schemata';

import { getConfigDirectory, Settings } from '../settings';

import { version } from './../../../package.json';

/**
 * Returns a Settings instance for the achievement statistics. This instance can be used
 * to access the achievement statistics and to save changes to them. This will print an
 * error message to the console if the file cannot be loaded or parsed. It will also
 * return null in that case.
 *
 * @returns A Settings instance for the achievement statistics, or null if an error
 *   occurred.
 */
export function getAchievementStats(): Settings<AchievementStats> | null {
  try {
    return new Settings<AchievementStats>({
      name: 'achievements',
      file: 'achievements.json',
      directory: getConfigDirectory(),
      defaults: () => ACHIEVEMENT_STATS_SCHEMA.parse({}),
      load: (content) => loadAchievementStats(content),
    });
  } catch (error) {
    console.error(
      'Error loading achievement stats:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Loads the contents of the settings file and returns an object that conforms to the
 * latest `AchievementStats` type. If the content does not conform to the current schema,
 * it will be migrated to the current schema.
 *
 * @param content The content of the settings file as an object.
 * @returns An object containing the parsed settings and a boolean indicating whether a
 *   migration was performed.
 */
function loadAchievementStats(content: object): {
  settings: AchievementStats;
  didMigration: boolean;
} {
  // If the version field is not present, most likely the file did not exist before. We
  // will return a default settings object in this case.
  if (!('version' in content)) {
    const settings = ACHIEVEMENT_STATS_SCHEMA.parse(content, { reportInput: true });
    return { settings, didMigration: true };
  }

  // Here we could compare the version to the current version and decide whether any
  // migration is necessary. For now, no further migrations are needed.
  if (content.version !== version) {
    const settings = ACHIEVEMENT_STATS_SCHEMA.parse(content, { reportInput: true });

    // Yet we still need to update the version to the current version. We set
    // didMigration to true to indicate that the settings file has been updated.
    settings.version = version;
    return { settings, didMigration: true };
  }

  return {
    settings: ACHIEVEMENT_STATS_SCHEMA.parse(content, { reportInput: true }),
    didMigration: false,
  };
}

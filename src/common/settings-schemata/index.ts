//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

export type { GeneralSettingsV1 as GeneralSettings } from './general-settings-v1';
export { GENERAL_SETTINGS_SCHEMA_V1 as GENERAL_SETTINGS_SCHEMA } from './general-settings-v1';

export type {
  MenuConditionsV1 as MenuConditions,
  MenuItemV1 as MenuItem,
  MenuV1 as Menu,
  MenuCollectionV1 as MenuCollection,
  MenuSettingsV1 as MenuSettings,
} from './menu-settings-v1';
export { MENU_SETTINGS_SCHEMA_V1 as MENU_SETTINGS_SCHEMA } from './menu-settings-v1';
export { MENU_ITEM_SCHEMA_V1 as MENU_ITEM_SCHEMA } from './menu-settings-v1';

export type { ExportedMenuV1 as ExportedMenu } from './exported-menu-v1';
export { EXPORTED_MENU_SCHEMA_V1 as EXPORTED_MENU_SCHEMA } from './exported-menu-v1';

import type { AchievementStatsV1 as AchievementStats } from './achievement-stats-v1';
export type { AchievementStatsV1 as AchievementStats } from './achievement-stats-v1';
export { ACHIEVEMENT_STATS_SCHEMA_V1 as ACHIEVEMENT_STATS_SCHEMA } from './achievement-stats-v1';

// Type to extract only the number keys from AchievementStats
type NumberKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

export type AchievementStatsNumberKeys = NumberKeys<AchievementStats>;

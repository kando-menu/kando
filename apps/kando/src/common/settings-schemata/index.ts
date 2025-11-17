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

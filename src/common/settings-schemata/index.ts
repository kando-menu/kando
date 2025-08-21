//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

export type { IGeneralSettingsV1 as IGeneralSettings } from './general-settings-v1';
export { GENERAL_SETTINGS_SCHEMA_V1 as GENERAL_SETTINGS_SCHEMA } from './general-settings-v1';

export type {
  IMenuConditionsV1 as IMenuConditions,
  IMenuItemV1 as IMenuItem,
  IMenuV1 as IMenu,
  IMenuCollectionV1 as IMenuCollection,
  IMenuSettingsV1 as IMenuSettings,
} from './menu-settings-v1';
export { MENU_SETTINGS_SCHEMA_V1 as MENU_SETTINGS_SCHEMA } from './menu-settings-v1';

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IGeneralSettingsV2, GENERAL_SETTINGS_SCHEMA_V2 } from './general-settings-v2';
import {
  IMenuConditionsV1,
  IMenuItemV1,
  IMenuV1,
  IMenuCollectionV1,
  IMenuSettingsV1,
  MENU_SETTINGS_SCHEMA_V1,
} from './menu-settings-v1';

// Create alias for the most recent version and export it.
const GENERAL_SETTINGS_SCHEMA = GENERAL_SETTINGS_SCHEMA_V2;
export type IGeneralSettings = IGeneralSettingsV2;
export { GENERAL_SETTINGS_SCHEMA };

const MENU_SETTINGS_SCHEMA = MENU_SETTINGS_SCHEMA_V1;
export type IMenuConditions = IMenuConditionsV1;
export type IMenuItem = IMenuItemV1;
export type IMenu = IMenuV1;
export type IMenuCollection = IMenuCollectionV1;
export type IMenuSettings = IMenuSettingsV1;
export { MENU_SETTINGS_SCHEMA };

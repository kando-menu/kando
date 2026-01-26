//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: yar2000T <github.com/yar2000T>
// SPDX-License-Identifier: MIT

import * as z from 'zod';
import { version } from './../../../package.json';

import { MENU_ITEM_SCHEMA_V1 } from './menu-settings-v1';

/**
 * This type describes the schema of an exported menu. This is used when exporting and
 * importing menus via the settings dialog.
 */
export const EXPORTED_MENU_SCHEMA_V1 = z.object({
  /**
   * The last version of Kando. This is used to determine whether the file needs to be
   * migrated to a newer version.
   */
  version: z.string().default(version),

  /** The actual menu. */
  menu: MENU_ITEM_SCHEMA_V1,
});

export type ExportedMenuV1 = z.infer<typeof EXPORTED_MENU_SCHEMA_V1>;

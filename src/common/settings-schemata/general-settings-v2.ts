//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import * as z from 'zod';
import { GENERAL_SETTINGS_SCHEMA_V1 } from './general-settings-v1';

/**
 * Starting with Kando 3.1.0, the boolean rmbSelectsParent property of the V1 schema is
 * replaced by rightMouseButtonBehavior. Additionally, the behavior of the middle mouse
 * button can now be configured.
 */
export const GENERAL_SETTINGS_SCHEMA_V2 = GENERAL_SETTINGS_SCHEMA_V1.omit({
  rmbSelectsParent: true,
}).extend({
  /**
   * Determines what happens when the right mouse button is pressed while the menu is
   * open. 'select' behaves like a left click, 'select-parent' navigates up one level,
   * 'close' closes the menu, and 'nothing' ignores the click.
   */
  rightMouseButtonBehavior: z
    .enum(['nothing', 'close', 'select-parent', 'select'])
    .default('close'),

  /**
   * Determines what happens when the middle mouse button is pressed while the menu is
   * open. 'select' behaves like a left click, 'select-parent' navigates up one level,
   * 'close' closes the menu, and 'nothing' ignores the click.
   */
  middleMouseButtonBehavior: z
    .enum(['nothing', 'close', 'select-parent', 'select'])
    .default('select'),
});

export type GeneralSettingsV2 = z.infer<typeof GENERAL_SETTINGS_SCHEMA_V2>;

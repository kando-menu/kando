//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IMenuItem } from '../../common';

/**
 * The menu consists of a tree of menu items. This interface extends the IMenuItem
 * interface with properties which are only used in the settings.
 */
export interface ISettingsMenuItem extends IMenuItem {
  /**
   * The visual representation of this menu item. This is a div element which is created
   * when the settings is opened.
   */
  div?: HTMLElement;

  /**
   * This specifies the angle at which this menu item is displayed in the settings. This
   * is computed by the settings and will not be saved. Only the 'angle' property of the
   * IMenuItem interface will be saved. The 'angle' property is considered to be a fixed
   * angle and if it is set, the 'computedAngle' will be identical to it.
   */
  computedAngle?: number;
}

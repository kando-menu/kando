//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { X11Backend } from '../../x11/backend';

/** This backend is used on Cinnamon with X11. */
export class CinnamonBackend extends X11Backend {
  /**
   * On Cinnamon, the 'normal' window type is used. The 'dock' window type makes the
   * window not show on top of other applications' full-screen windows.
   */
  public getBackendInfo() {
    const info = super.getBackendInfo();
    info.name = 'Cinnamon';
    info.menuWindowType = 'normal';
    return info;
  }
}

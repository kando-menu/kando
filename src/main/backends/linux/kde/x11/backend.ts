//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { X11Backend } from '../../x11/backend';

/** This backend is used on KDE with X11. */
export class KDEX11Backend extends X11Backend {
  /**
   * On KDE, the 'toolbar' window type is used. The 'dock' window type makes the window
   * not receive any keyboard events.
   */
  public getBackendInfo() {
    const info = super.getBackendInfo();
    info.name = 'KDE X11';
    info.menuWindowType = 'toolbar';
    return info;
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { X11Backend } from '../../x11/backend';
import { RemoteDesktop } from '../../../portals/remote-desktop';

/**
 * This backend is used on KDE with X11.
 */
export class KDEWaylandBackend extends X11Backend {
  private portal: RemoteDesktop = new RemoteDesktop();

  /**
   * On KDE, the 'toolbar' window type is used. The 'dock' window type makes the window
   * not receive any keyboard events.
   *
   * @returns 'toolbar'
   */
  public override getWindowType() {
    return 'toolbar';
  }

  /**
   * Moves the pointer to the given position.
   *
   * @param x The x coordinate to move the pointer to.
   * @param y The y coordinate to move the pointer to.
   */
  public async movePointer(x: number, y: number) {
    await this.portal.setPointer(x, y);
  }
}

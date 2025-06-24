//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Louis Dalibard <ontake@ontake.dev>
// SPDX-License-Identifier: MIT

export interface Native {
  /**
   * This gets the pointer's position and work area size without relying on IPCs by
   * spawning an wlr_layer_shell overlay surface
   */
  getPointerPositionAndWorkAreaSize(): {
    x: number;
    y: number;
    workareaW: number;
    workareaH: number;
  };
}

const native: Native = require('./../../../../../../build/Release/NativeNiri.node');

export { native };

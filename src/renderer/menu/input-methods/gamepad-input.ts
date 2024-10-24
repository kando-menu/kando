//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import * as math from '../../math';
import { IVec2 } from '../../../common';
import { Gamepad } from './gamepad';
import { InputMethod, ButtonState, IInputState, SelectionType } from './input-method';

/**
 * This class detects mouse or touch gestures. It listens to motion, button, and key
 * events and calls the InputMethod's callbacks accordingly. It supports the so-called
 * "Marking Mode" and the "Turbo Mode". In marking mode, items can be dragged around and
 * are selected when the mouse is stationary for some time or makes a sharp turn. "Turbo
 * Mode" works similar to marking mode, but requires a modifier key to be pressed instead
 * of the mouse button.
 */
export class GamepadInput extends InputMethod {
  /** Provides a high-level interface to the gamepad API. */
  private gamepad: Gamepad = new Gamepad();

  /** Creates a new PointerInput instance. */
  constructor() {
    super();

    this.gamepad.on('buttondown', (buttonIndex: number, stickPosition: IVec2) => {
      window.api.log(
        'buttondown ' + buttonIndex + ' ' + stickPosition.x + ' ' + stickPosition.y
      );
    });

    this.gamepad.on('buttonup', (buttonIndex: number, stickPosition: IVec2) => {
      window.api.log(
        'buttonup ' + buttonIndex + ' ' + stickPosition.x + ' ' + stickPosition.y
      );
    });

    this.gamepad.on('stickmotion', (stickPosition: IVec2, anyButtonDown: boolean) => {
      window.api.log(
        'stickmotion ' + stickPosition.x + ' ' + stickPosition.y + ' ' + anyButtonDown
      );
    });
  }

  /** @inheritdoc */
  public setCurrentCenter(center: IVec2, radius: number) {}
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import * as math from '../../common/math';
import { IVec2 } from '../../common';
import { Gamepad } from './gamepad';
import { InputMethod, ButtonState, IInputState, SelectionType } from './input-method';

/**
 * The GamepadInput is currently quite simple. With the analog sticks, the user can
 * "hover" over items, with the X button the menu can be closed, with the B button the
 * parent item is selected. All other buttons select the currently hovered item.
 *
 * Selected items are placed always at the initial menu position, similar to how the
 * "anchored mode" works with mouse input.
 */
export class GamepadInput extends InputMethod {
  /** When an item is selected, it will be placed at this distance from the parent. */
  public parentDistance = 250;

  /** The index of the button that selects the parent item. */
  public backButton = 1;

  /** The index of the button that closes the menu. */
  public closeButton = 2;

  /** Whether the input method is enabled. */
  public enabled = true;

  /** Provides a high-level interface to the gamepad API. */
  private gamepad: Gamepad = new Gamepad();

  /** The absolute position of the currently selected item. */
  private centerPosition: IVec2 = { x: 0, y: 0 };

  /** Creates a new GamepadInput instance. */
  constructor() {
    super();

    // Close the menu on X and select the parent on B. All other buttons select the
    // current item.
    this.gamepad.on('buttondown', (buttonIndex: number) => {
      if (this.enabled) {
        if (this.closeButton >= 0 && buttonIndex === this.closeButton) {
          this.closeCallback();
          return;
        }

        if (this.backButton >= 0 && buttonIndex === this.backButton) {
          this.selectCallback(this.centerPosition, SelectionType.eParent);
          return;
        }

        this.selectCallback(this.centerPosition, SelectionType.eActiveItem);
      }
    });

    this.gamepad.on('stickmotion', (stickPosition: IVec2) => {
      if (this.enabled) {
        this.updateState(stickPosition);
      }
    });
  }

  /** @inheritdoc */
  public setCurrentCenter(center: IVec2) {
    if (this.enabled) {
      this.centerPosition = center;
    }
  }

  /** Computes a new IInputState and publishes it via the state callback. */
  private updateState(stickPosition: IVec2) {
    if (this.enabled) {
      const relativePosition = math.multiply(stickPosition, this.parentDistance);

      const state: IInputState = {
        button: ButtonState.eReleased,
        absolutePosition: math.add(this.centerPosition, relativePosition),
        relativePosition: relativePosition,
        distance: math.getLength(relativePosition),
        angle: math.getAngle(relativePosition),
      };

      this.stateCallback(state);
    }
  }
}

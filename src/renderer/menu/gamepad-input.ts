//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';

const AXIS_DEADZONE = 0.2;

/**
 * This interface describes the state of a gamepad. It contains the current values of all
 * axes and buttons.
 */
export interface IGamepadState {
  axes: number[];
  buttons: GamepadButton[];
}

/**
 * This class provides an interface to the gamepad API. It emits events when buttons are
 * pressed, released or touched. It also emits events when axis values change.
 *
 * @fires buttondown - When a button is pressed. The gamepad index and button index are
 *   passed as arguments.
 * @fires buttonup - When a button is released. The gamepad index and button index are
 *   passed as arguments.
 * @fires touchdown - When a button is touched. The gamepad index and button index are
 *   passed as arguments.
 * @fires touchup - When a button is released. The gamepad index and button index are
 *   passed as arguments.
 * @fires buttonvalue - When a button value changes. The gamepad index, the button index
 *   and the new value are passed as arguments.
 * @fires axis - When an axis value changes. The gamepad index, the axis index and the new
 *   value are passed as arguments.
 */
export class GamepadInput extends EventEmitter {
  /** This array contains the current state of all gamepads. */
  private gamepadStates: IGamepadState[] = [];

  /** This flag is set to true when the poll method should stop polling. */
  private stopPolling = false;

  /** Creates a new GamepadInput instance and starts polling the gamepad API. */
  constructor() {
    super();
    this.poll();
  }

  /** Stops polling the gamepad API. */
  public destroy() {
    this.stopPolling = true;
  }

  /** Returns the current state of the gamepad with the given index. */
  public getState(gamepadIndex: number): IGamepadState {
    return this.gamepadStates[gamepadIndex];
  }

  /** This method is called every frame to poll the gamepad API. */
  private poll() {
    navigator.getGamepads().forEach((gamepad, i) => {
      if (gamepad) {
        if (!this.gamepadStates[i]) {
          this.gamepadStates[i] = {
            axes: gamepad.axes.map(() => 0),
            buttons: gamepad.buttons.map(() => ({
              pressed: false,
              touched: false,
              value: 0,
            })),
          };
        }

        const state = this.gamepadStates[i];

        gamepad.axes.forEach((axis, j) => {
          const value = Math.abs(axis) < AXIS_DEADZONE ? 0 : axis;
          if (state.axes[j] !== value) {
            state.axes[j] = value;
            this.emit('axis', i, j, value);
          }
        });

        gamepad.buttons.forEach((button, j) => {
          const oldState = state.buttons[j];
          state.buttons[j] = button;

          if (oldState.pressed !== button.pressed) {
            this.emit(button.pressed ? 'buttondown' : 'buttonup', i, j);
          }

          if (oldState.touched !== button.touched) {
            this.emit(button.touched ? 'touchdown' : 'touchup', i, j);
          }

          const value = Math.abs(button.value) < AXIS_DEADZONE ? 0 : button.value;
          const oldStateValue =
            Math.abs(oldState.value) < AXIS_DEADZONE ? 0 : oldState.value;
          if (oldStateValue !== value) {
            this.emit('buttonvalue', i, j, value);
          }
        });
      }
    });

    if (!this.stopPolling) {
      requestAnimationFrame(() => this.poll());
    }
  }
}

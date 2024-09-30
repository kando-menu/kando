//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';
import { IVec2 } from '../../common';

const AXIS_DEADZONE = 0.2;

/**
 * This interface describes the state of a gamepad. It contains the current values of all
 * axes and buttons.
 */
export interface IGamepadState {
  axes: { value: number; timestamp: number }[];
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
  public getEmulatedPointerPosition(gamepadIndex: number, centerPosition: IVec2) {
    const gamepadState = this.gamepadStates[gamepadIndex];
    const latestAxis = this.getLatestAxis(gamepadIndex);

    // Left stick axes. See https://w3c.github.io/gamepad/#remapping
    let xAxis = 0;
    let yAxis = 1;

    // If the right stick was changed.
    if (latestAxis === 2 || latestAxis === 3) {
      xAxis = 2;
      yAxis = 3;
    }

    const x = gamepadState.axes[xAxis].value;
    const y = gamepadState.axes[yAxis].value;

    const pointerPosition = {
      x: centerPosition.x,
      y: centerPosition.y,
    };

    if (Math.abs(x) > 0.3 || Math.abs(y) > 0.3) {
      pointerPosition.x += x * 300;
      pointerPosition.y += y * 300;
    }

    return pointerPosition;
  }

  /**
   * Returns the index of the axis which was changed most recently.
   *
   * @param gamepadIndex - The index of the gamepad to check.
   * @returns The index of the axis which was changed most recently.
   */
  public getLatestAxis(gamepadIndex: number) {
    const state = this.gamepadStates[gamepadIndex];
    let latestAxis = 0;
    let latestTimestamp = 0;
    state.axes.forEach((axis, i) => {
      if (axis.timestamp > latestTimestamp) {
        latestAxis = i;
        latestTimestamp = axis.timestamp;
      }
    });
    return latestAxis;
  }

  /**
   * Returns true if any button of the gamepad with the given index is pressed.
   *
   * @param gamepadIndex - The index of the gamepad to check.
   * @returns True if any button of the gamepad with the given index is pressed.
   */
  public isAnyButtonPressed(gamepadIndex: number) {
    const state = this.gamepadStates[gamepadIndex];
    return state.buttons.some((button) => button.pressed);
  }

  /** This method is called every frame to poll the gamepad API. */
  private poll() {
    navigator.getGamepads().forEach((gamepad, i) => {
      if (gamepad) {
        if (!this.gamepadStates[i]) {
          this.gamepadStates[i] = {
            axes: gamepad.axes.map(() => ({ value: 0, timestamp: 0 })),
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
          if (state.axes[j].value !== value) {
            state.axes[j].value = value;
            state.axes[j].timestamp = Date.now();
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

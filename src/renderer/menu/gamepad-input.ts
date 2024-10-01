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

const AXIS_DEADZONE = 0.3;

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
 * @fires buttondown - When a button is pressed. The button index and the latest 2D stick
 *   position are passed as arguments.
 * @fires buttonup - When a button is released. The button index and the latest 2D stick
 *   position are passed as arguments.
 * @fires stickmotion - When an axis value changes. The 2D position of the stick and a
 *   boolean indicating that any button is currently pressed are passed as arguments.
 */
export class GamepadInput extends EventEmitter {
  /** This array contains the current state of all gamepads. */
  private gamepadStates: IGamepadState[] = [];

  /** This flag is set to true when the poll method should stop polling. */
  private stopPolling = false;

  private lastStickPosition: IVec2 = { x: 0, y: 0 };

  /** Creates a new GamepadInput instance and starts polling the gamepad API. */
  constructor() {
    super();
    this.poll();
  }

  /** Stops polling the gamepad API. */
  public destroy() {
    this.stopPolling = true;
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

        state.axes = gamepad.axes.map((axis) => axis);

        gamepad.buttons.forEach((button, j) => {
          if (state.buttons[j].pressed !== button.pressed) {
            state.buttons[j] = button;
            this.onButtonChange(i, j);
          }
        });

        this.onAxisChange(i);
      }
    });

    if (!this.stopPolling) {
      requestAnimationFrame(() => this.poll());
    }
  }

  private onAxisChange(gamepadIndex: number) {
    const gamepadState = this.gamepadStates[gamepadIndex];

    // We take the stick with the biggest absolute axis value.
    let axisIndex = 0;
    let maxValue = 0;

    for (let i = 0; i < 4; ++i) {
      const value = Math.abs(gamepadState.axes[i]);
      if (value > maxValue) {
        maxValue = value;
        axisIndex = i;
      }
    }

    // Left stick axes. See https://w3c.github.io/gamepad/#remapping
    let xAxis = 0;
    let yAxis = 1;

    // If the right stick was changed.
    if (axisIndex === 2 || axisIndex === 3) {
      xAxis = 2;
      yAxis = 3;
    }

    const x = gamepadState.axes[xAxis];
    const y = gamepadState.axes[yAxis];

    const stickPosition = { x: 0, y: 0 };

    if (Math.abs(x) > AXIS_DEADZONE || Math.abs(y) > AXIS_DEADZONE) {
      stickPosition.x = x * 300;
      stickPosition.y = y * 300;
    }

    if (
      stickPosition.x !== this.lastStickPosition.x ||
      stickPosition.y !== this.lastStickPosition.y
    ) {
      this.lastStickPosition = stickPosition;

      this.emit('stickmotion', stickPosition, this.isAnyButtonPressed(gamepadIndex));
    }
  }

  private onButtonChange(gamepadIndex: number, buttonIndex: number) {
    const pressed = this.gamepadStates[gamepadIndex].buttons[buttonIndex].pressed;
    this.emit(pressed ? 'buttondown' : 'buttonup', buttonIndex, this.lastStickPosition);
  }

  /**
   * Returns true if any button of the gamepad with the given index is pressed.
   *
   * @param gamepadIndex - The index of the gamepad to check.
   * @returns True if any button of the gamepad with the given index is pressed.
   */
  private isAnyButtonPressed(gamepadIndex: number) {
    const state = this.gamepadStates[gamepadIndex];
    return state.buttons.some((button) => button.pressed);
  }
}

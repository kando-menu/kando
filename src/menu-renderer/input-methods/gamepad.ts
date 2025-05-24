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

/**
 * This interface describes the state of a gamepad. It contains the current values of all
 * axes and buttons as well as the last computed stick position.
 */
export interface IGamepadState {
  axes: number[];
  buttons: GamepadButton[];
  lastStickPosition: IVec2;
}

/**
 * This class provides an interface to the gamepad API. It emits events when buttons are
 * pressed or released. It also emits events when axis values change. It does not expose
 * the raw gamepad API but normalizes the data and provides a more high-level interface.
 * For instance, it does not differentiate between multiple gamepads and always emits
 * events for all connected gamepads.
 *
 * @fires buttondown - When a button is pressed. The button index and the latest 2D stick
 *   position are passed as arguments.
 * @fires buttonup - When a button is released. The button index and the latest 2D stick
 *   position are passed as arguments.
 * @fires stickmotion - When an axis value changes. The 2D position of the stick and a
 *   boolean indicating that any button is currently pressed are passed as arguments.
 */
export class Gamepad extends EventEmitter {
  /** This value is used as a deadzone for the gamepad axes. */
  public axisDeadzone = 0.3;

  /** This array contains the current state of all gamepads. */
  private gamepadStates: IGamepadState[] = [];

  /** This flag is set to true when the poll method should stop polling. */
  private stopPolling = true;

  /** Creates a new GamepadInput instance and starts polling the gamepad API. */
  constructor() {
    super();

    // Start polling the gamepad API when the window is focused.
    window.addEventListener('focus', () => {
      if (this.stopPolling) {
        this.stopPolling = false;
        this.poll();
      }
    });

    // Stop polling the gamepad API when the window is blurred.
    window.addEventListener('blur', () => {
      this.stopPolling = true;
    });
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
            lastStickPosition: { x: 0, y: 0 },
          };
        }

        const state = this.gamepadStates[i];
        state.axes = gamepad.axes.map((axis) => axis);

        // Emit the buttondown and buttonup events for all changed buttons.
        gamepad.buttons.forEach((button, j) => {
          if (state.buttons[j].pressed !== button.pressed) {
            state.buttons[j] = button;
            this.onButtonChange(i, j);
          }
        });

        // Potentially emit the stickmotion event.
        this.onAxisChange(i);
      }
    });

    if (!this.stopPolling) {
      requestAnimationFrame(() => this.poll());
    }
  }

  /**
   * This method is called every frame. We look for the stick with the biggest absolute
   * axis value and consider this to be the "active" stick. We then emit the stickmotion
   * event if the stick moved since the last frame.
   *
   * @param gamepadIndex - The index of the gamepad that was changed.
   */
  private onAxisChange(gamepadIndex: number) {
    const gamepadState = this.gamepadStates[gamepadIndex];

    // Search for the axis with the biggest absolute value.
    let axisIndex = 0;
    let maxValue = 0;

    // We only check the first 4 axes as they correspond to the sticks.
    // See https://w3c.github.io/gamepad/#remapping
    for (let i = 0; i < 4; ++i) {
      const value = Math.abs(gamepadState.axes[i]);
      if (value > maxValue) {
        maxValue = value;
        axisIndex = i;
      }
    }

    // If it's the first or the second axis, the left stick is our active stick.
    // See https://w3c.github.io/gamepad/#remapping
    let xAxis = 0;
    let yAxis = 1;

    // Else the right stick is the active stick.
    if (axisIndex === 2 || axisIndex === 3) {
      xAxis = 2;
      yAxis = 3;
    }

    const x = gamepadState.axes[xAxis];
    const y = gamepadState.axes[yAxis];

    const tilt = Math.sqrt(x * x + y * y);
    const stickPosition = {
      x: tilt > this.axisDeadzone ? x : 0,
      y: tilt > this.axisDeadzone ? y : 0,
    };

    if (
      stickPosition.x !== gamepadState.lastStickPosition.x ||
      stickPosition.y !== gamepadState.lastStickPosition.y
    ) {
      gamepadState.lastStickPosition = stickPosition;

      this.emit('stickmotion', stickPosition, this.isAnyButtonPressed(gamepadIndex));
    }
  }

  /**
   * This method is called when a button is pressed or released. It emits the buttondown
   * or buttonup event.
   *
   * @param gamepadIndex - The index of the gamepad that was changed.
   * @param buttonIndex - The index of the button that was changed.
   */
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

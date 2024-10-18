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

export enum ButtonState {
  eReleased,
  eClicked,
  eDragged,
}

/**
 * At a higher level, Kando does not differentiate between mouse, touch, gamepad, or pen
 * input. This enum is used for all input devices. Some devices may not have or require
 * physical buttons, (like touchscreens) and will get into the eDragged state by some
 * other means. Another example is the "Turbo Mode" of the PointerInput where items are
 * dragged when a modifier key is hold down on the keyboard.
 */
export interface IInputState {
  /*
   * This enum is used to store the logical state of the input device. This will be set to
   * clicked once a button is pressed. If the input device is moved more than a couple of
   * pixels before the button is released, it is set to dragged.
   */
  button: ButtonState;

  /** The pointer position in absolute coordinates. */
  absolutePosition: IVec2;

  /** The pointer position relative to the center of the currently selected item. */
  relativePosition: IVec2;

  /**
   * The distance between the pointer and the center of the currently selected item in
   * pixels.
   */
  distance: number;

  /**
   * The angle between the pointer and the center of the currently selected item in
   * degrees.
   */
  angle: number;
}

/**
 * This is a base class for all input devices. The implementation can widely differ,
 * however derived classes should emit the following events:
 *
 * @fires update-state - This event should be emitted whenever the input state changes.
 *   The event data should contain the new state. See the InputState class for more
 *   information.
 * @fires select-active - This event should be emitted whenever the item currently under
 *   the pointer should be selected. The event data should contain the position where the
 *   selection most likely happened. When some sort of gesture recognition is used, the
 *   selection could have been at some point in the past.
 * @fires select-parent - This event should be emitted whenever the parent item should be
 *   selected.
 * @fires close-menu - This event should be emitted whenever the menu should be closed.
 */
export abstract class InputDevice extends EventEmitter {
  /**
   * This method will be called whenever a new item is selected. Derived classes may use
   * this information to compute absolute input positions.
   *
   * @param center - The center coordinates of the newly selected item.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setCurrentCenter(center: IVec2) {}
}

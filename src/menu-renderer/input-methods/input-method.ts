//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { Vec2 } from '../../common';

/**
 * The logical button state of the input device. This will be set to clicked once a button
 * is pressed. If the input device is moved more than a couple of pixels before the button
 * is released, it is set to dragged.
 */
export enum ButtonState {
  eReleased,
  eClicked,
  eDragged,
}

/**
 * This enum is used to provide a hint what should be selected. This can be useful if a
 * specific button is used to navigate to a parent item. Or if a selection should only
 * open a submenu but not select a final item.
 */
export enum SelectionType {
  eActiveItem,
  eSubmenuOnly,
  eParent,
}

/**
 * This type describes the state of an input device. It is used to communicate the current
 * state of the input method to the menu. The menu will then decide how to interpret this
 * state.
 */
export type InputState = {
  /**
   * At a higher level, Kando does not differentiate between mouse, touch, gamepad, or pen
   * input. This enum is used for all input methods. Some devices may not have or require
   * physical buttons, (like touchscreens) and will get into the eDragged state by some
   * other means. An example is the "Turbo Mode" of the PointerInput where items are
   * dragged when a modifier key is hold down on the keyboard. In this case, the button
   * state will be set to eDragged.
   */
  button: ButtonState;

  /** The pointer position in absolute screen coordinates. */
  absolutePosition: Vec2;

  /** The pointer position relative to the center of the currently selected item. */
  relativePosition: Vec2;

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
};

/** This is a base class for all input methods. */
export abstract class InputMethod {
  /**
   * This callback should be called whenever the input state changes. See the InputState
   * class for more information.
   */
  protected stateCallback: (state: InputState) => void = () => {};

  /**
   * This callback should be called whenever an item should be selected. The position
   * should be the absolute pointer position. The type can provide a hint what should be
   * selected. See the SelectionType enum for more information.
   */
  protected selectCallback: (position: Vec2, type: SelectionType) => void = () => {};

  /** This callback should be called whenever the menu should be closed. */
  protected closeCallback: () => void = () => {};

  /**
   * This method will be called whenever a new submenu is selected. Derived classes may
   * use this information to compute absolute input positions.
   *
   * @param center - The center coordinates of the newly selected submenu.
   * @param radius - The interactive radius of the newly selected submenu.
   */
  public abstract setCurrentCenter(center: Vec2, radius: number): void;

  /**
   * This method will be called whenever the input state changes. Derived classes should
   * call the stateCallback with the new state.
   *
   * @param callback - This will be called whenever the input state changes.
   */
  public onUpdateState(callback: (state: InputState) => void) {
    this.stateCallback = callback;
  }

  /**
   * This method will be called should be emitted whenever the item currently under the
   * pointer should be selected. The event data should contain the position where the
   * selection most likely happened. When some sort of gesture recognition is used, the
   * selection could have been at some point in the past.
   *
   * Also, the selection type can provide a hint what should be selected. See the
   * SelectionType enum for more information.
   *
   * @param callback - This will be called whenever an item should be selected.
   */
  public onSelection(callback: (position: Vec2, type: SelectionType) => void) {
    this.selectCallback = callback;
  }

  /**
   * This event should be emitted whenever the menu should be closed. If the right-mouse-
   * button-selects-parent option is set, this will not close the menu, but rather select
   * the parent item.
   *
   * @param callback - This will be called when the menu should be closed.
   */
  public onCloseMenu(callback: () => void) {
    this.closeCallback = callback;
  }
}

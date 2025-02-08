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
import { InputMethod, ButtonState, IInputState, SelectionType } from './input-method';
import { GestureDetector } from './gesture-detector';

/**
 * This class detects mouse or touch gestures. It listens to motion, button, and key
 * events and calls the InputMethod's callbacks accordingly. It supports the so-called
 * "Marking Mode" and the "Turbo Mode". In marking mode, items can be dragged around and
 * are selected when the mouse is stationary for some time or makes a sharp turn. "Turbo
 * Mode" works similar to marking mode, but requires a modifier key to be pressed instead
 * of the mouse button.
 */
export class PointerInput extends InputMethod {
  /**
   * This is the threshold in pixels which is used to differentiate between a click and a
   * drag. If the mouse is moved more than this threshold before the mouse button is
   * released, an item is dragged.
   */
  public dragThreshold = 15;

  /** If enabled, items can be selected by dragging the mouse over them. */
  public enableMarkingMode = true;

  /**
   * If enabled, items can be selected by hovering over them while holding down a keyboard
   * key.
   */
  public enableTurboMode = true;

  /**
   * If enabled, items can be selected by hovering over them. Like turbo mode without any
   * key. This is very advanced, but extremely fast.
   */
  public enableHoverMode = true;

  /** If set to true, the hover mode will only select final actions with a mouse click. */
  public hoverModeNeedsConfirmation = false;

  /**
   * This is used to detect gestures in "Marking Mode" and "Turbo Mode". It is fed with
   * motion events and emits a selection event if either the mouse pointer was stationary
   * for some time or if the mouse pointer made a sharp turn.
   */
  public gestureDetector: GestureDetector = new GestureDetector();

  /** The current pointer position. */
  private pointerPosition: IVec2 = { x: 0, y: 0 };

  /** The current input state. */
  private buttonState = ButtonState.eReleased;

  /**
   * If set to true, the turbo mode can only be activated after a key is released. This is
   * useful if the menu is not opened under the mouse pointer.
   */
  private deferredTurboMode = false;

  /** The position where the mouse was when the user pressed a mouse button the last time. */
  private clickPosition: IVec2 = { x: 0, y: 0 };

  /** The position where the mouse was when the user pressed a keyboard key the last time. */
  private keydownPosition: IVec2 = { x: 0, y: 0 };

  /** The position of the currently selected submenu. */
  private centerPosition: IVec2 = { x: 0, y: 0 };

  /** The interactive radius of the currently selected item. */
  private centerRadius = 0;

  /**
   * This is set to true once a key is pressed. If the pointer is moved at least
   * this.dragThreshold before the key is released, the turbo mode will be activated.
   */
  private anyKeyPressed = false;

  /**
   * If set to a value greater than 0, this will be decremented by 1 every time the the
   * mouse moves and the corresponding event is ignored. See the documentation of the
   * ignoreNextMotionEvents() method for more information.
   */
  private ignoreMotionEvents = 0;

  /** Creates a new PointerInput instance. */
  constructor() {
    super();

    // Forward selection events from the gesture detector. In hover mode, we select any
    // item that is hovered over. In marking and turbo mode, we only select submenus via
    // gestures, final lactions need to be selected by pointer-up events.
    this.gestureDetector.on('selection', (position: IVec2) => {
      this.selectCallback(
        position,
        this.enableHoverMode && !this.hoverModeNeedsConfirmation
          ? SelectionType.eActiveItem
          : SelectionType.eSubmenuOnly
      );
    });
  }

  /** @inheritdoc */
  public setCurrentCenter(center: IVec2, radius: number) {
    this.update(center, center, this.buttonState);
    this.gestureDetector.reset();
    this.gestureDetector.onMotionEvent(center);
    this.keydownPosition = center;
    this.centerRadius = radius;
  }

  /**
   * On some wayland compositors (for instance KWin), one or two initial mouse motion
   * events are sent containing wrong coordinates. They seem to be the coordinates of the
   * last mouse motion event over any XWayland surface before Kando's window was opened.
   * We simply ignore these events. This code is currently used on all platforms but I
   * think it's not an issue.
   */
  public ignoreNextMotionEvents() {
    this.ignoreMotionEvents = 2;
  }

  /**
   * If set to true, the turbo mode can only be activated after a key is released. This is
   * useful if the menu is not opened under the mouse pointer.
   */
  public deferTurboMode() {
    this.deferredTurboMode = true;
  }

  /*
   * This method should be called when the pointer is moved.
   *
   * @param event The mouse or touch event.
   */
  public onMotionEvent(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    event.stopPropagation();

    // Ignore mouse motion events if requested.
    if (this.ignoreMotionEvents > 0) {
      this.ignoreMotionEvents--;
      return;
    }

    // If the mouse moved too much, the current mousedown - mouseup event is not
    // considered to be a click anymore. Instead, we are in marking mode.
    const inClickZone =
      this.clickPosition &&
      math.getDistance(this.pointerPosition, this.clickPosition) < this.dragThreshold;

    let newButtonState = this.buttonState;

    if (this.buttonState === ButtonState.eClicked && !inClickZone) {
      newButtonState = this.enableMarkingMode
        ? ButtonState.eDragged
        : ButtonState.eReleased;
    }

    // We check if the turbo mode should be activated. This is the case if any key is
    // pressed and the mouse is moved more than this.dragThreshold since the last keydown
    // event. Also, the turbo mode is activated if any modifier key is pressed.
    let shouldEnterTurboMode = false;
    const canEnterTurboMode =
      (this.enableTurboMode || this.enableHoverMode) &&
      !this.deferredTurboMode &&
      this.buttonState !== ButtonState.eDragged;

    if (canEnterTurboMode) {
      if (
        this.enableHoverMode ||
        this.anyKeyPressed ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      ) {
        shouldEnterTurboMode =
          math.getDistance(this.pointerPosition, this.keydownPosition) >
          this.dragThreshold;
      }
    }

    if (shouldEnterTurboMode) {
      newButtonState = ButtonState.eDragged;
    }

    // Store the absolute mouse position, as well as the mouse position, distance, and
    // angle relative to the currently selected item.
    this.update(event, this.centerPosition, newButtonState);

    // This can potentially lead to a selection event.
    if (this.buttonState === ButtonState.eDragged) {
      this.gestureDetector.onMotionEvent(this.pointerPosition);
    }
  }

  /**
   * This method should be called when a mouse button is pressed or a touch event is
   * detected.
   *
   * @param event The mouse or touch event.
   */
  public onPointerDownEvent(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    event.stopPropagation();

    // Go back or hide the menu on right click events.
    if ((event as MouseEvent).button === 2) {
      this.closeCallback();
      return;
    }

    // Go back using the mouse back button.
    if ((event as MouseEvent).button === 3) {
      this.selectCallback(this.pointerPosition, SelectionType.eParent);
      return;
    }

    if (event instanceof MouseEvent) {
      this.clickPosition = { x: event.clientX, y: event.clientY };
    } else {
      this.clickPosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }

    // Store the absolute mouse position, as well as the mouse position, distance, and
    // angle relative to the currently selected item.
    this.update(event, this.centerPosition, ButtonState.eClicked);

    // A new gesture may start here.
    this.gestureDetector.reset();
  }

  /**
   * This method should be called when a mouse button is released or a touch event is
   * detected.
   *
   * @param event The mouse or touch event.
   */
  public onPointerUpEvent(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.gestureDetector.reset();

    const clickSelection = this.buttonState === ButtonState.eClicked;

    // Do not trigger marking-mode selections on the center item.
    const markingModeSelection =
      this.buttonState === ButtonState.eDragged &&
      math.getDistance(this.pointerPosition, this.centerPosition) > this.centerRadius;
    if (clickSelection || markingModeSelection) {
      this.selectCallback(this.pointerPosition, SelectionType.eActiveItem);
    }

    this.clickPosition = null;

    // Store the absolute mouse position, as well as the mouse position, distance, and
    // angle relative to the currently selected item.
    this.update(event, this.centerPosition, ButtonState.eReleased);
  }

  /** This method should be called when a key is pressed. */
  public onKeyDownEvent() {
    if (!this.deferredTurboMode) {
      this.anyKeyPressed = true;
      this.keydownPosition = {
        x: this.pointerPosition.x,
        y: this.pointerPosition.y,
      };
    }
  }

  /**
   * This method should be called when a key is released.
   *
   * @param event The keyboard event.
   */
  public onKeyUpEvent(event: KeyboardEvent) {
    // On some (all?) Linux environments, event.metaKey is not false even if the key has
    // been released with this event. Therefore, we explicitly check if the key was
    // released: https://github.com/kando-menu/kando/issues/788
    const stillAnyModifierPressed =
      event.ctrlKey ||
      (event.key === 'Meta' ? false : event.metaKey) ||
      event.shiftKey ||
      event.altKey;

    if (!stillAnyModifierPressed) {
      this.anyKeyPressed = false;
      this.deferredTurboMode = false;

      // Select the active item if turbo mode ended due to a key release. But do not
      // trigger selections on the center item in turbo mode.
      if (
        this.buttonState === ButtonState.eDragged &&
        math.getDistance(this.pointerPosition, this.centerPosition) > this.centerRadius
      ) {
        this.gestureDetector.reset();
        this.selectCallback(this.pointerPosition, SelectionType.eActiveItem);
      }

      this.update(this.pointerPosition, this.centerPosition, ButtonState.eReleased);
    }
  }

  // Private interface -------------------------------------------------------------------

  /**
   * Store the absolute mouse position, as well as the current center of the menu, and the
   * current button state. If either of these values changed, a new state will be
   * emitted.
   *
   * @param pointer Either a mouse or touch event or an IVec2.
   * @param center The current center of the menu.
   * @param button The current button state.
   */
  private update(
    pointer: MouseEvent | TouchEvent | IVec2,
    center: IVec2,
    button: ButtonState
  ) {
    if (pointer instanceof MouseEvent) {
      this.update({ x: pointer.clientX, y: pointer.clientY }, center, button);
    } else if (pointer instanceof TouchEvent) {
      this.update(
        {
          x: pointer.touches[0].clientX,
          y: pointer.touches[0].clientY,
        },
        center,
        button
      );
    } else {
      if (
        this.centerPosition.x !== center.x ||
        this.centerPosition.y !== center.y ||
        this.buttonState !== button ||
        this.pointerPosition.x !== pointer.x ||
        this.pointerPosition.y !== pointer.y
      ) {
        this.centerPosition = center;
        this.buttonState = button;
        this.pointerPosition = pointer;

        const state: IInputState = {
          button,
          absolutePosition: pointer,
          relativePosition: math.subtract(pointer, this.centerPosition),
          distance: math.getLength(math.subtract(pointer, this.centerPosition)),
          angle: math.getAngle(math.subtract(pointer, this.centerPosition)),
        };

        this.stateCallback(state);
      }
    }
  }
}

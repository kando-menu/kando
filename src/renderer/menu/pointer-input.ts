//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import * as math from '../math';
import { IVec2 } from '../../common';
import { InputDevice, ButtonState, IInputState } from './input-device';
import { GestureDetector } from './gesture-detector';

/**
 * This class detects mouse or touch gestures. It listens to motion, button, and key
 * events and emits events accordingly. It supports the so-called "Marking Mode" and the
 * "Turbo Mode". In marking mode, items can be dragged around and are selected when the
 * mouse is stationary for some time or makes a sharp turn. "Turbo Mode" works similar to
 * marking mode, but requires a modifier key to be pressed instead of the mouse button.
 *
 * @fires update-state - This event is emitted whenever the input state changes. The event
 *   data contains the new state.
 * @fires select-active - This is emitted whenever the item currently under the mouse
 *   pointer should be selected. The event data contains the position where the selection
 *   most likely happened.
 * @fires select-parent - This event is emitted if the back-button on the mouse is
 *   pressed.
 * @fires close-menu - This event is emitted if the right mouse button is pressed.
 */
export class PointerInput extends InputDevice {
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
   * This is used to detect gestures in "Marking Mode" and "Turbo Mode". It is fed with
   * motion events and emits a selection event if either the mouse pointer was stationary
   * for some time or if the mouse pointer made a sharp turn.
   */
  public gestureDetector: GestureDetector = new GestureDetector();

  /** Creates a new PointerInput instance. */
  constructor() {
    super();

    // Forward selection events from the gesture detector.
    this.gestureDetector.on('selection', (position: IVec2) => {
      this.emit('select-active', position);
    });
  }

  /** @inheritdoc */
  public setCurrentCenter(center: IVec2) {
    this.updateState(center, center, this.buttonState);
    this.gestureDetector.reset();
    this.keydownPosition = center;
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
   * This method is called when the pointer is moved. It will update the current state and
   * emit an update-state event.
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
      this.enableTurboMode &&
      !this.deferredTurboMode &&
      this.buttonState !== ButtonState.eDragged;

    if (canEnterTurboMode) {
      if (
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
    this.updateState(event, this.currentCenter, newButtonState);

    // This can potentially lead to a selection event.
    if (this.buttonState === ButtonState.eDragged) {
      this.gestureDetector.onMotionEvent(this.pointerPosition);
    }
  }

  /**
   * This method is called when a mouse button is pressed. We store the click position so
   * that we can differentiate between a click and a drag operation. It will emit an
   * update-state event.
   *
   * @param event The mouse or touch event.
   */
  public onPointerDownEvent(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    event.stopPropagation();

    // Ignore right mouse button events.
    if ((event as MouseEvent).button === 2) {
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
    this.updateState(event, this.currentCenter, ButtonState.eClicked);

    // A new gesture may start here.
    this.gestureDetector.reset();
  }

  /**
   * This method is called when a mouse button is released. This can lead to a selection
   * event. It will also emit an update-state event.
   *
   * @param event The mouse or touch event.
   */
  public onPointerUpEvent(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    event.stopPropagation();

    // Go back using the mouse back button.
    if ((event as MouseEvent).button === 3) {
      this.emit('select-parent');
      return;
    }

    // Go back or hide the menu on right click events.
    if ((event as MouseEvent).button === 2) {
      this.emit('close-menu');
      return;
    }

    if (this.buttonState === ButtonState.eClicked) {
      this.emit('select-active', this.pointerPosition);
    }

    this.clickPosition = null;

    // Store the absolute mouse position, as well as the mouse position, distance, and
    // angle relative to the currently selected item.
    this.updateState(event, this.currentCenter, ButtonState.eReleased);

    this.gestureDetector.reset();
  }

  /**
   * If any key is pressed, the turbo mode will be activated as long as turbo mode is not
   * deferred. In this case, a key has to be released first before the turbo mode will be
   * activated.
   */
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
   * If the last key is released, the turbo mode will be deactivated.
   *
   * @param event The keyboard event.
   */
  public onKeyUpEvent(event: KeyboardEvent) {
    const stillAnyModifierPressed =
      event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;

    if (!stillAnyModifierPressed) {
      // Select the active item if turbo mode ended due to a key release.
      if (this.buttonState === ButtonState.eDragged) {
        this.gestureDetector.reset();
        this.emit('select-active', this.pointerPosition);
      }

      this.anyKeyPressed = false;
      this.deferredTurboMode = false;

      if (this.buttonState === ButtonState.eDragged) {
        this.updateState(this.pointerPosition, this.currentCenter, ButtonState.eReleased);
      }
    }
  }

  // Private interface -------------------------------------------------------------------

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

  /** The position of the currently selected item. */
  private currentCenter: IVec2 = { x: 0, y: 0 };

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

  /**
   * Store the absolute mouse position, as well as the mouse position, distance, and angle
   * relative to the currently selected item.
   *
   * @param pointer Either a mouse or touch event or an IVec2.
   * @param currentCenter The current center of the menu.
   * @param button The current button state.
   */
  private updateState(
    pointer: MouseEvent | TouchEvent | IVec2,
    currentCenter: IVec2,
    button: ButtonState
  ) {
    if (pointer instanceof MouseEvent) {
      this.updateState({ x: pointer.clientX, y: pointer.clientY }, currentCenter, button);
    } else if (pointer instanceof TouchEvent) {
      this.updateState(
        {
          x: pointer.touches[0].clientX,
          y: pointer.touches[0].clientY,
        },
        currentCenter,
        button
      );
    } else {
      if (
        this.currentCenter.x !== currentCenter.x ||
        this.currentCenter.y !== currentCenter.y ||
        this.buttonState !== button ||
        this.pointerPosition.x !== pointer.x ||
        this.pointerPosition.y !== pointer.y
      ) {
        this.currentCenter = currentCenter;
        this.buttonState = button;
        this.pointerPosition = pointer;

        const state: IInputState = {
          button,
          absolutePosition: pointer,
          relativePosition: math.subtract(pointer, this.currentCenter),
          distance: math.getLength(math.subtract(pointer, this.currentCenter)),
          angle: math.getAngle(math.subtract(pointer, this.currentCenter)),
        };

        this.emit('update-state', state);
      }
    }
  }
}

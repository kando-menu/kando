//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';

import * as math from '../../common/math';
import { Vec2 } from '../../common';

/**
 * This class detects gestures. It is used to detect marking mode selections in the menu.
 * It is fed with motion events and emits a selection event if either the mouse pointer
 * was stationary for some time or if the mouse pointer made a sharp turn.
 *
 * @fires selection - This event is emitted when a selection is detected. The event data
 *   contains the coordinates of the location where the selection event occurred.
 */
export class GestureDetector extends EventEmitter {
  /**
   * This will be initialized with the coordinates of the first motion event after the
   * last reset() call.
   */
  private strokeStart: Vec2 = null;

  /** This will be updated with each motion event. */
  private strokeEnd: Vec2 = null;

  /**
   * This timer is used to detect pause-events where the pointer was stationary for some
   * time. These events also lead to selections.
   */
  private timeout: NodeJS.Timeout = null;

  /** Shorter gestures will not lead to selections. */
  public minStrokeLength = 150;

  /** Smaller turns will not lead to selections. */
  public minStrokeAngle = 20;

  /** Smaller movements will not be considered. */
  public jitterThreshold = 10;

  /**
   * If the pointer is stationary for this many milliseconds, the current item will be
   * selected.
   */
  public pauseTimeout = 100;

  /**
   * This is used if fixedStrokeLength is greater than zero to allow for distance-based
   * selections.
   */
  public centerDeadZone = 50;

  /**
   * If set to a value greater than 0, items will be instantly selected if the mouse
   * travelled more than centerDeadZone + fixedStrokeLength pixels in marking or turbo
   * mode. Any other gesture detection based on angles or motion speed will be disabled in
   * this case.
   */
  public fixedStrokeLength = 0;

  /**
   * This method detects the gestures. It should be called if the mouse pointer was moved
   * while the left mouse button is held down. Consider the diagram below:
   *
   *                                  M
   *                                .
   *                              .
   *     S -------------------- E
   *
   * The mouse button was pressed at S (strokeStart) and the moved to E (strokeEnd). When
   * the next motion event comes in (M), we compare the directions of S->E with E->M. If
   * they differ significantly, this is considered a corner. There are some minimum
   * lengths for both vectors - if they are not long enough, nothing is done. If E->M is
   * long enough, but there is no corner, E is set to M and we wait for the next motion
   * event.
   *
   * @param event
   */
  public onMotionEvent(coords: Vec2): void {
    if (this.strokeStart === null) {
      // It's the first event of this gesture, so we store the current mouse position as
      // start and end. There is nothing more to be done.
      this.strokeStart = coords;
      this.strokeEnd = coords;
    } else {
      // Calculate the vector S->E in the diagram above.
      const strokeDir = {
        x: this.strokeEnd.x - this.strokeStart.x,
        y: this.strokeEnd.y - this.strokeStart.y,
      };

      const strokeLength = math.getLength(strokeDir);

      // If fixedStrokeLength is set, we only need to check if the stroke is long enough.
      if (this.fixedStrokeLength > 0) {
        const minStrokeLength = this.fixedStrokeLength + this.centerDeadZone;
        if (strokeLength > minStrokeLength) {
          const idealCoords = {
            x: this.strokeStart.x + (strokeDir.x / strokeLength) * minStrokeLength,
            y: this.strokeStart.y + (strokeDir.y / strokeLength) * minStrokeLength,
          };

          this.reset(idealCoords);
          this.emit('selection', idealCoords);
        }
        this.strokeEnd = coords;
        return;
      }

      if (strokeLength > this.minStrokeLength) {
        // Calculate the vector E->M in the diagram above.
        const tipDir = { x: coords.x - this.strokeEnd.x, y: coords.y - this.strokeEnd.y };

        const tipLength = math.getLength(tipDir);

        if (tipLength > this.jitterThreshold) {
          // If the tip vector is long enough, the pointer was not stationary. Remove
          // the timer again.
          if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
          }

          // Now compute the angle between S->E and E->M.
          const angle = Math.acos(
            ((tipDir.x / tipLength) * strokeDir.x) / strokeLength +
              ((tipDir.y / tipLength) * strokeDir.y) / strokeLength
          );

          //  Emit the selection events if it exceeds the configured threshold. We pass
          //  the coordinates of E for the selection event.
          if ((angle * 180) / Math.PI > this.minStrokeAngle) {
            this.reset(this.strokeEnd);
            this.emit('selection', this.strokeEnd);
            return;
          }

          // Update the point M in the diagram above to be the new E for the next motion
          // event.
          this.strokeEnd = coords;
        }

        // The stroke is long enough to become a gesture. We register a timer to detect
        // pause-events where the pointer was stationary for some time. These events
        // also lead to selections.
        if (this.timeout === null) {
          this.timeout = setTimeout(() => {
            this.reset(coords);
            this.emit('selection', coords);
          }, this.pauseTimeout);
        }
      } else {
        // The vector S->E is not long enough to be a gesture, so we only update the end
        // point.
        this.strokeEnd = coords;
      }
    }
  }

  /**
   * This method resets the gesture detection. For instance, it should be called if the
   * left mouse button is released.
   *
   * @param lastCorner - If the gesture may continue, this parameter can be used to
   *   provide the last corner of the gesture, e.g. the start of the next stroke.
   */
  public reset(lastCorner: Vec2 = null): void {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    this.strokeStart = lastCorner;
    this.strokeEnd = lastCorner;
  }
}

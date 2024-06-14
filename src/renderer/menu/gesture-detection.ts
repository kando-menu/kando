//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';

import * as math from '../math';
import { IVec2 } from '../../common';

/** Shorter gestures will not lead to selections. */
const MIN_STROKE_LENGTH = 150;

/** Smaller turns will not lead to selections. */
const MIN_STROKE_ANGLE = 20;

/** Smaller movements will not be considered. */
const JITTER_THRESHOLD = 10;

/**
 * If the pointer is stationary for this many milliseconds, the current item will be
 * selected.
 */
const PAUSE_TIMEOUT = 100;

/**
 * This class detects gestures. It is used to detect marking mode selections in the menu.
 * It is fed with motion events and emits a selection event if either the mouse pointer
 * was stationary for some time or if the mouse pointer made a sharp turn. The selection
 * event contains the coordinates of the location where the selection event occurred.
 */
export class GestureDetection extends EventEmitter {
  /**
   * This will be initialized with the coordinates of the first motion event after the
   * last reset() call.
   */
  private strokeStart: IVec2 = null;

  /** This will be updated with each motion event. */
  private strokeEnd: IVec2 = null;

  /**
   * This timer is used to detect pause-events where the pointer was stationary for some
   * time. These events also lead to selections.
   */
  private pauseTimeout: NodeJS.Timeout = null;

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
  public onMotionEvent(coords: IVec2): void {
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

      if (strokeLength > MIN_STROKE_LENGTH) {
        // Calculate the vector E->M in the diagram above.
        const tipDir = { x: coords.x - this.strokeEnd.x, y: coords.y - this.strokeEnd.y };

        const tipLength = math.getLength(tipDir);

        if (tipLength > JITTER_THRESHOLD) {
          // If the tip vector is long enough, the pointer was not stationary. Remove
          // the timer again.
          if (this.pauseTimeout !== null) {
            clearTimeout(this.pauseTimeout);
            this.pauseTimeout = null;
          }

          // Now compute the angle between S->E and E->M.
          const angle = Math.acos(
            ((tipDir.x / tipLength) * strokeDir.x) / strokeLength +
              ((tipDir.y / tipLength) * strokeDir.y) / strokeLength
          );

          //  Emit the selection events if it exceeds the configured threshold. We pass
          //  the coordinates of E for the selection event.
          if ((angle * 180) / Math.PI > MIN_STROKE_ANGLE) {
            const coords = this.strokeEnd;
            this.reset();
            this.emit('selection', coords);
            return;
          }

          // Update the point M in the diagram above to be the new E for the next motion
          // event.
          this.strokeEnd = coords;
        }

        // The stroke is long enough to become a gesture. We register a timer to detect
        // pause-events where the pointer was stationary for some time. These events
        // also lead to selections.
        if (this.pauseTimeout === null) {
          this.pauseTimeout = setTimeout(() => {
            this.reset();
            this.emit('selection', coords);
          }, PAUSE_TIMEOUT);
        }
      } else {
        // The vector S->E is not long enough to be a gesture, so we only update the end
        // point.
        this.strokeEnd = coords;
      }
    }
  }

  /**
   * This method resets the gesture detection. It should be called if the left mouse
   * button is released.
   */
  public reset() {
    if (this.pauseTimeout !== null) {
      clearTimeout(this.pauseTimeout);
      this.pauseTimeout = null;
    }

    this.strokeStart = null;
    this.strokeEnd = null;
  }
}

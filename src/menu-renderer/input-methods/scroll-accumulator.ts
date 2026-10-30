//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Arslan-TR <https://github.com/Arslan-TR>
// SPDX-License-Identifier: MIT

/**
 * This class turns the raw wheel events of the browser into discrete scroll steps. Mouse
 * wheels usually emit one event with a large delta per notch, while touchpads emit many
 * events with small deltas. To treat both kinds of devices similarly, small deltas are
 * accumulated until they reach a threshold. At most one step is reported per event.
 */
export class ScrollAccumulator {
  /**
   * The accumulated scroll distance in pixels which has not been reported as a step yet.
   * Positive values mean scrolling down, negative values mean scrolling up.
   */
  private accumulated = 0;

  /**
   * @param threshold The accumulated distance in pixels required for a step. The typical
   *   delta of one notch of a mouse wheel is larger than this.
   */
  constructor(public threshold = 40) {}

  /**
   * Call this for each wheel event.
   *
   * @param deltaY The vertical delta of the wheel event.
   * @param deltaMode The delta mode of the wheel event (0: pixels, 1: lines, 2: pages).
   * @returns -1 if the wheel was scrolled up by one step, 1 if it was scrolled down by
   *   one step, 0 if no step was completed yet.
   */
  public onWheel(deltaY: number, deltaMode = 0): -1 | 0 | 1 {
    if (!Number.isFinite(deltaY) || deltaY === 0) {
      return 0;
    }

    let delta = deltaY;
    if (deltaMode === 1) {
      delta *= 40;
    } else if (deltaMode === 2) {
      delta *= 400;
    }

    // If the scroll direction changed, the previously accumulated distance is obsolete.
    if (Math.sign(delta) !== Math.sign(this.accumulated)) {
      this.accumulated = 0;
    }

    this.accumulated += delta;

    if (Math.abs(this.accumulated) >= this.threshold) {
      const direction = Math.sign(this.accumulated) as -1 | 1;
      this.accumulated = 0;
      return direction;
    }

    return 0;
  }

  /** Discards any accumulated scroll distance. */
  public reset() {
    this.accumulated = 0;
  }
}

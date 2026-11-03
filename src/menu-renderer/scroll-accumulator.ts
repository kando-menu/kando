//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/** Converts wheel deltas into discrete steps while accumulating small touchpad deltas. */
export class ScrollAccumulator {
  private static readonly stepThreshold = 50;

  private accumulatedDelta = 0;

  /**
   * Accumulate a wheel delta and return -1 for up, 1 for down, or 0 until a step occurs.
   * Large wheel events produce at most one step.
   *
   * @param deltaY The vertical wheel delta.
   * @param deltaMode The WheelEvent delta mode: pixels, lines, or pages.
   */
  public accumulate(deltaY: number, deltaMode: number): -1 | 0 | 1 {
    if (!Number.isFinite(deltaY) || deltaY === 0) {
      return 0;
    }

    const scale = deltaMode === 1 ? 20 : deltaMode === 2 ? 800 : 1;
    const delta = deltaY * scale;

    if (Math.abs(delta) >= ScrollAccumulator.stepThreshold) {
      this.reset();
      return delta < 0 ? -1 : 1;
    }

    if (
      this.accumulatedDelta !== 0 &&
      Math.sign(this.accumulatedDelta) !== Math.sign(delta)
    ) {
      this.reset();
    }

    this.accumulatedDelta += delta;
    if (Math.abs(this.accumulatedDelta) < ScrollAccumulator.stepThreshold) {
      return 0;
    }

    const direction = this.accumulatedDelta < 0 ? -1 : 1;
    this.accumulatedDelta -= direction * ScrollAccumulator.stepThreshold;
    return direction;
  }

  /** Clear any partial step, for example when scrolling over a different item. */
  public reset() {
    this.accumulatedDelta = 0;
  }
}

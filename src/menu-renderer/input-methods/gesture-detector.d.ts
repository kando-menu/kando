import { EventEmitter } from 'events';
import { Vec2 } from '../../common';
/**
 * This class detects gestures. It is used to detect marking mode selections in the menu.
 * It is fed with motion events and emits a selection event if either the mouse pointer
 * was stationary for some time or if the mouse pointer made a sharp turn.
 *
 * @fires selection - This event is emitted when a selection is detected. The event data
 *   contains the coordinates of the location where the selection event occurred.
 */
export declare class GestureDetector extends EventEmitter {
    /**
     * This will be initialized with the coordinates of the first motion event after the
     * last reset() call.
     */
    private strokeStart;
    /** This will be updated with each motion event. */
    private strokeEnd;
    /**
     * This timer is used to detect pause-events where the pointer was stationary for some
     * time. These events also lead to selections.
     */
    private timeout;
    /** Shorter gestures will not lead to selections. */
    minStrokeLength: number;
    /** Smaller turns will not lead to selections. */
    minStrokeAngle: number;
    /** Smaller movements will not be considered. */
    jitterThreshold: number;
    /**
     * If the pointer is stationary for this many milliseconds, the current item will be
     * selected.
     */
    pauseTimeout: number;
    /**
     * This is used if fixedStrokeLength is greater than zero to allow for distance-based
     * selections.
     */
    centerDeadZone: number;
    /**
     * If set to a value greater than 0, items will be instantly selected if the mouse
     * travelled more than centerDeadZone + fixedStrokeLength pixels in marking or turbo
     * mode. Any other gesture detection based on angles or motion speed will be disabled in
     * this case.
     */
    fixedStrokeLength: number;
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
    onMotionEvent(coords: Vec2): void;
    /**
     * This method resets the gesture detection. For instance, it should be called if the
     * left mouse button is released.
     *
     * @param lastCorner - If the gesture may continue, this parameter can be used to
     *   provide the last corner of the gesture, e.g. the start of the next stroke.
     */
    reset(lastCorner?: Vec2): void;
}

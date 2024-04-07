//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';

import * as math from '../../math';

/**
 * This class is used to make menu items in the editor draggable. It is primarily used by
 * the `Preview` class. However, also servers as a base class for the more specific
 * `ToolbarItemDragger` used by the tabs of the toolbar to make menus and menu items
 * draggable.
 *
 * The class is an `EventEmitter` and emits the following events:
 *
 * @fires drag-start - When a drag starts, this event is emitted.
 * @fires drag-move - When an item is moved, this event is emitted with the current
 *   offset.
 * @fires drag-end - When a drag ends, this event is emitted.
 * @fires drag-cancel - When a drag is aborted (e.g. by hitting the ESC key), this event
 *   is emitted.
 * @fires click - When a click is detected, this event is emitted. When the drag threshold
 *   is exceeded, no click event is emitted.
 * @fires mouse-down - When a mouse down event is detected, this event is emitted.
 * @fires mouse-up - When a mouse up event is detected, this event is emitted. It will be
 *   emitted before either the `click` or `drag-end` event.
 * @template T The type of the user data which is associated with the draggable divs.
 */
export class Dragger<T> extends EventEmitter {
  /**
   * This is the item which is currently dragged. It is set to `null` when no item is
   * dragged. `div` is the div which was passed to `addDraggable`.
   */
  private currentlyDragged?: { div: HTMLElement; data: T } = null;

  /**
   * This map contains all draggable divs and their corresponding user data. It is used to
   * remove event listeners when a draggable is removed.
   */
  private draggables: Map<HTMLElement, { data: T; abortController: AbortController }> =
    new Map();

  /**
   * This is the threshold in pixels which is used to differentiate between a click and a
   * drag.
   */
  private readonly DRAG_THRESHOLD = 5;

  /**
   * This method makes the given item draggable. It adds the necessary event listeners to
   * the `div`. All resulting drag events will provide the `div` and the `data` which were
   * passed to this method.
   *
   * @param div The div which should listen to mouse events.
   * @param data A user data object which is associated with the div. It is only forwarded
   *   to the resulting drag events.
   */
  public addDraggable(div: HTMLElement, data: T) {
    const abortController = new AbortController();

    div.addEventListener(
      'mousedown',
      (e) => {
        const dragStart = { x: e.clientX, y: e.clientY };
        const rect = div.getBoundingClientRect();
        const parentRect = div.parentElement.getBoundingClientRect();

        const startPos = {
          x: rect.left - parentRect.left,
          y: rect.top - parentRect.top,
        };

        const grapOffset = {
          x: dragStart.x - rect.left,
          y: dragStart.y - rect.top,
        };

        this.emit('mouse-down', data, div);

        let clearListeners = () => {};

        const onMouseMove = (e2: MouseEvent) => {
          const dragCurrent = { x: e2.clientX, y: e2.clientY };
          const offset = math.subtract(dragCurrent, dragStart);

          if (math.getLength(offset) > this.DRAG_THRESHOLD) {
            e2.preventDefault();
            e2.stopPropagation();

            if (this.currentlyDragged === null) {
              this.currentlyDragged = { div, data };
              this.emit('drag-start', data, div);
            }

            this.emit(
              'drag-move',
              data,
              div,
              { x: startPos.x + offset.x, y: startPos.y + offset.y },
              { x: e2.x, y: e2.y },
              offset,
              grapOffset
            );
          }
        };

        const onMouseUp = () => {
          this.emit('mouse-up', data, div);

          if (this.currentlyDragged) {
            this.emit('drag-end', this.currentlyDragged.data, this.currentlyDragged.div);
            this.currentlyDragged = null;
          } else {
            this.emit('click', data, div);
          }

          clearListeners();
        };

        const onEsc = (e2: KeyboardEvent) => {
          if (e2.key === 'Escape') {
            if (this.currentlyDragged) {
              this.emit(
                'drag-cancel',
                this.currentlyDragged.data,
                this.currentlyDragged.div
              );
              this.currentlyDragged = null;
            }

            clearListeners();
            e2.stopPropagation();
          }
        };

        clearListeners = () => {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          window.removeEventListener('keyup', onEsc, true);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('keyup', onEsc, true);
      },
      { signal: abortController.signal }
    );

    this.draggables.set(div, { data, abortController });
  }

  /**
   * This method removes the given `div` from the list of draggable divs. It removes all
   * event listeners and aborts the drag if the `div` is currently dragged.
   *
   * @param div The div which should no longer listen to mouse events.
   */
  public removeDraggable(div: HTMLElement) {
    const { data, abortController } = this.draggables.get(div);

    // Make sure that the data is not dragged anymore.
    if (this.currentlyDragged && data === this.currentlyDragged.data) {
      this.currentlyDragged = null;
    }

    // Remove the event listener.
    abortController.abort();

    // Remove the div from the map.
    this.draggables.delete(div);
  }

  /**
   * This method removes all draggable divs. It removes all event listeners and aborts all
   * drags.
   */
  public removeAllDraggables() {
    for (const [div] of this.draggables) {
      this.removeDraggable(div);
    }
  }
}

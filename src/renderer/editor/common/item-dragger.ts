//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';

import { IEditorNode } from '../editor-node';
import * as math from '../../math';

/**
 * This class is used to make menu items in the editor draggable. It is primarily used by
 * the `Preview` class. However, also the `Toolbar` uses it to make new menu items
 * draggable.
 *
 * During a drag, the given `div` will have the class `.dragging` added. This can be used
 * to style the `div` differently during a drag.
 *
 * The class is an `EventEmitter` and emits the following events:
 *
 * @fires drag-start - When a drag starts, this event is emitted with the dragged node.
 * @fires drag-move - When a drag moves, this event is emitted with the dragged node and
 *   the current offset.
 * @fires drag-end - When a drag ends, this event is emitted with the dragged node.
 */
export class ItemDragger extends EventEmitter {
  /**
   * This is the item which is currently dragged. It is set to `null` when no node is
   * dragged. `div` is the div which was passed to `addDraggable`.
   */
  private draggedItem?: { div: HTMLElement; node: IEditorNode } = null;

  /**
   * This map contains all draggable divs and their corresponding nodes. It is used to
   * remove event listeners when a draggable is removed.
   */
  private draggableDivs: Map<
    HTMLElement,
    { node: IEditorNode; abortController: AbortController }
  > = new Map();

  /**
   * This is the threshold in pixels which is used to differentiate between a click and a
   * drag.
   */
  private readonly DRAG_THRESHOLD = 5;

  /**
   * This method makes the given item draggable. It adds the necessary event listeners to
   * the `div`. All resulting drag events will provide the `div` and the `node` which were
   * passed to this method.
   *
   * @param div The div which should listen to mouse events.
   * @param node A node which is associated with the div. It is only forwarded to the
   *   resulting drag events.
   */
  public addDraggable(div: HTMLElement, node: IEditorNode) {
    const abortController = new AbortController();

    div.addEventListener(
      'mousedown',
      (e) => {
        const dragStart = { x: e.clientX, y: e.clientY };

        const onMouseMove = (e2: MouseEvent) => {
          const dragCurrent = { x: e2.clientX, y: e2.clientY };
          const offset = math.subtract(dragCurrent, dragStart);

          if (math.getLength(offset) > this.DRAG_THRESHOLD) {
            e2.preventDefault();
            e2.stopPropagation();

            if (this.draggedItem === null) {
              this.draggedItem = { div, node };
              div.classList.add('dragging');
              this.emit('drag-start', node, div);
            }

            this.emit('drag-move', node, div, offset);
          }
        };

        const onMouseUp = () => {
          if (this.draggedItem) {
            this.emit('drag-end', this.draggedItem.node, this.draggedItem.div);
            this.draggedItem.div.classList.remove('dragging');
            this.draggedItem = null;
          }

          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      },
      { signal: abortController.signal }
    );

    this.draggableDivs.set(div, { node, abortController });
  }

  /**
   * This method removes the given `div` from the list of draggable divs. It removes all
   * event listeners and aborts the drag if the `div` is currently dragged.
   *
   * @param div The div which should no longer listen to mouse events.
   */
  public removeDraggable(div: HTMLElement) {
    const { node, abortController } = this.draggableDivs.get(div);

    // Make sure that the node is not dragged anymore.
    if (node === this.draggedItem.node) {
      this.draggedItem = null;
    }

    // Remove the event listener.
    abortController.abort();

    // Remove the div from the map.
    this.draggableDivs.delete(div);
  }

  /**
   * This method removes all draggable divs. It removes all event listeners and aborts all
   * drags.
   */
  public removeAllDraggables() {
    for (const [div] of this.draggableDivs) {
      this.removeDraggable(div);
    }
  }
}

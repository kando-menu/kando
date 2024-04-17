//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ItemDragger } from '../common/item-dragger';

/**
 * The `dragClass` is a class name which will be added to the #kando-editor during the
 * drag operation. The `dropTargets` are the elements which are considered drop targets.
 * If the dragged div is dropped onto one of these elements, the `drop` event is emitted.
 */
export interface DraggedItemInfo {
  /** This is used to identify the dragged item. */
  index: number;

  /** The class name which will be added to the container during the drag operation. */
  dragClass: string;

  /** If `true`, there will remain a ghost of the dragged item at the original position. */
  ghostMode: boolean;

  /** The elements which are considered drop targets. */
  dropTargets: HTMLElement[];
}

/**
 * This class is a specialized ItemDragger which is used to drag toolbar items. It is used
 * for example by the trash tab to drag items from the trash back to the menus tab or back
 * to the preview area.
 *
 * The class is an `EventEmitter` and emits the following events in addition to the events
 * emitted by the `ItemDragger` class:
 *
 * @fires drop - When an item is successfully dropped onto a drop target, this event is
 *   emitted. The event data is the `index` which was passed to the `addDraggable` method
 *   and the `dropTarget` which was hovered when the item was dropped.
 */
export class ToolbarItemDragger extends ItemDragger<DraggedItemInfo> {
  /**
   * This constructor creates a new ToolbarItemDragger. It will store a reference to the
   * #kando-editor element, so this element must exist when the constructor is called.
   */
  constructor() {
    super();

    // Elements will be appended to this container during the drag operation.
    const dragContainer = document.querySelector('#kando-editor') as HTMLElement;

    let ghostDiv: HTMLElement;

    this.on('drag-start', (info, div) => {
      // Add a class to the container. This can be used to highlight the drop targets.
      dragContainer.classList.add(info.dragClass);

      // Create a clone of the div. We will drag this clone round. We make it use the same
      // size as the original div.
      ghostDiv = div.cloneNode(true) as HTMLElement;
      const rect = div.getBoundingClientRect();
      ghostDiv.style.width = `${rect.width}px`;
      ghostDiv.style.height = `${rect.height}px`;

      // Make the original div invisible.
      div.style.opacity = info.ghostMode ? '0.2' : '0';

      // Append the div to the outer container. This is necessary because the div may be
      // inside a scrollable container with overflow: hidden set and we want to be able to
      // drag it outside.
      ghostDiv.classList.add('dragging');
      dragContainer.appendChild(ghostDiv);
    });

    // During the drag operation, we need to move the div to the current mouse position.
    this.on('drag-move', (info, div, relative, absolute, offset, grabOffset) => {
      ghostDiv.style.transform = `translate(${absolute.x - grabOffset.x}px, ${absolute.y - grabOffset.y}px)`;
    });

    // If the drag is canceled or ends, we need to clean up.

    const dragEnd = (info: DraggedItemInfo, div: HTMLElement, animate: boolean) => {
      dragContainer.classList.remove(info.dragClass);
      if (animate) {
        const rect = div.getBoundingClientRect();
        ghostDiv.classList.remove('dragging');
        ghostDiv.style.transform = `translate(${rect.left}px, ${rect.top}px)`;

        setTimeout(() => {
          ghostDiv.remove();
          div.style.opacity = '1';
        }, 200);
      } else {
        ghostDiv.remove();
        div.style.opacity = '1';
      }
    };

    this.on('drag-cancel', (info, div) => {
      dragEnd(info, div, true);
    });

    // If the drag ends successfully, we emit the 'drop' event if one of the drop targets
    // is hovered.
    this.on('drag-end', (info, div) => {
      let success = false;

      info.dropTargets.forEach((element: HTMLElement) => {
        if (element.matches(':hover')) {
          this.emit('drop', info.index, element);
          success = true;
        }
      });
      dragEnd(info, div, !success);
    });
  }
}

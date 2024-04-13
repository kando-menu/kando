//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ItemDragger } from './item-dragger';

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

  /** The elements which are considered drop targets. */
  dropTargets: HTMLElement[];
}

/**
 * This class is a specialized ItemDragger which is used to drag toolbar items. It is used
 * for example by the trash tab to drag items from the trash back to the menus tab or back
 * to the preview area.
 *
 * The class is an `EventEmitter` and emits the following events:
 *
 * @fires drop - When an item is successfully dropped onto a drop target, this event is
 *   emitted. The event data is the `index` which was passed to the `addDraggable` method
 *   and the `dropTarget` which was hovered when the item was dropped.
 */
export class ToolbarItemDragger extends ItemDragger<DraggedItemInfo> {
  /**
   * This constructor creates a new ToolbarItemDragger. It takes a `dragContainer` which
   * is the container to which the dragged div will be appended during the drag
   * operation.
   */
  constructor() {
    super();

    // Elements will be appended to this container during the drag operation.
    const dragContainer = document.querySelector('#kando-editor') as HTMLElement;

    // During drag'n'drop operations, we need to append the dragged div to the outer
    // container to be able to drag it outside of any scrollable area.
    let originalParent: HTMLElement;

    this.on('drag-start', (info, div) => {
      // Add a class to the container. This can be used to highlight the drop targets..
      dragContainer.classList.add(info.dragClass);

      // Set fixed width and height for dragged item.
      const rect = div.getBoundingClientRect();
      div.style.width = `${rect.width}px`;
      div.style.height = `${rect.height}px`;

      // Remember the original parent so that we can reinsert the div later.
      originalParent = div.parentNode;

      // Append the div to the outer container. This is necessary because the div may be
      // inside a scrollable container with overflow: hidden set and we want to be able to
      // drag it outside.
      div.classList.add('dragging');
      dragContainer.appendChild(div);
    });

    // During the drag operation, we need to move the div to the current mouse position.
    this.on('drag-move', (info, div, relative, absolute, offset, grabOffset) => {
      div.style.transform = `translate(${absolute.x - grabOffset.x}px, ${absolute.y - grabOffset.y}px)`;
    });

    // If the drag is canceled or ends, we need to clean up.
    const onDragEnd = (info: DraggedItemInfo, div: HTMLElement) => {
      div.classList.remove('dragging');
      div.style.transform = '';

      // Clear the fixed width and height.
      div.style.width = '';
      div.style.height = '';

      // Reinsert the div back to its original position.
      originalParent.appendChild(div);

      dragContainer.classList.remove(info.dragClass);
    };

    this.on('drag-cancel', onDragEnd);

    // If the drag ends successfully, we emit the 'drop' event if one of the drop targets
    // is hovered.
    this.on('drag-end', (info, div) => {
      onDragEnd(info, div);

      info.dropTargets.forEach((element: HTMLElement) => {
        if (element.matches(':hover')) {
          this.emit('drop', info.index, element);
        }
      });
    });
  }
}

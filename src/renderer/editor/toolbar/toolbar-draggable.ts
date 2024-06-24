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
import { IDraggable } from '../common/draggable';
import { IVec2 } from '../../../common';
import { IDropTarget } from '../common/drop-target';

/**
 * This class is used to drag toolbar items. It is used for example by the trash tab to
 * drag items from the trash back to the menus tab or back to the preview area. The given
 * `div` is not really dragged around. Instead, it is made transparent and a clone of it
 * is dragged around. This enables the "ghost mode" where the original item is still
 * visible in the toolbar while it is dragged around.
 *
 * The class is an `EventEmitter` and emits the following events:
 *
 * @fires select - When the item is clicked.
 * @fires drop - When the item is successfully dropped onto a valid drop target. The
 *   target is passed as the first argument.
 */
export class ToolbarDraggable<T> extends EventEmitter implements IDraggable {
  /** This is the HTML element which should be dragged around. */
  private div: HTMLElement;

  /**
   * This is the type of data which can be provided by the draggable. It is used by the
   * drop target to check whether the draggable can provide suitable data.
   */
  private dataType: string;

  /**
   * This callback should return the data which should be passed to the drop target. The
   * type can usually be inferred from the `getDataType` method.
   */
  private getDataCallback: () => T;

  /**
   * If `true`, the original div will partially transparent while its clone is dragged
   * around.
   */
  private ghostMode: boolean;

  /**
   * This is the clone of the div which is dragged around. It is created when the drag
   * operation starts and removed when it ends.
   */
  private ghostDiv: HTMLElement;

  /**
   * This constructor creates a new `ToolbarDraggable`.
   *
   * @param div The HTML element which should be dragged around.
   * @param dataType The type of data which can be provided by the draggable.
   * @param ghostMode If `true`, the original div will partially transparent while its
   *   clone is dragged around.
   * @param getData This callback should return the data which should be passed to the
   *   drop target.
   */
  constructor(div: HTMLElement, dataType: string, ghostMode: boolean, getData: () => T) {
    super();

    this.div = div;
    this.dataType = dataType;
    this.getDataCallback = getData;
    this.ghostMode = ghostMode;
  }

  /** @inheritdoc */
  getDiv() {
    return this.div;
  }

  /** @inheritdoc */
  getDataType() {
    return this.dataType;
  }

  /** @inheritdoc */
  getData() {
    return this.getDataCallback();
  }

  /** @inheritdoc */
  public onMouseDown() {}

  /** @inheritdoc */
  public onMouseUp() {}

  /** @inheritdoc */
  public onClick() {
    this.emit('select');
  }

  /** @inheritdoc */
  public onDragStart() {
    // Create a clone of the div. We will drag this clone round. We make it use the same
    // size as the original div.
    this.ghostDiv = this.div.cloneNode(true) as HTMLElement;
    const rect = this.div.getBoundingClientRect();
    this.ghostDiv.style.width = `${rect.width}px`;
    this.ghostDiv.style.height = `${rect.height}px`;
    this.ghostDiv.classList.add('dragging');

    // Make the original div invisible.
    this.div.style.opacity = this.ghostMode ? '0.2' : '0';

    // Append the div to the outer container. This is necessary because the div may be
    // inside a scrollable container with overflow: hidden set and we want to be able to
    // drag it outside.
    const dragContainer = document.querySelector('#kando-editor') as HTMLElement;
    dragContainer.appendChild(this.ghostDiv);
  }

  /** @inheritdoc */
  public onDrop(target: IDropTarget, shouldCopy: boolean) {
    this.dragEnd(false);
    this.emit('drop', target, shouldCopy);
  }

  /** @inheritdoc */
  public onDragCancel() {
    this.dragEnd(true);
  }

  /** @inheritdoc */
  public onDragMove(viewportCoords: IVec2, _parentCoords: IVec2, grabOffset: IVec2) {
    const transform = math.subtract(viewportCoords, grabOffset);
    this.ghostDiv.style.transform = `translate(${transform.x}px, ${transform.y}px)`;
  }

  /**
   * This method is called when the drag operation is successfully finished. It will
   * remove the ghost div from the DOM.
   *
   * @param animate If `true`, the ghost div will be animated back to the original
   *   position.
   */
  private dragEnd(animate: boolean) {
    if (animate) {
      const rect = this.div.getBoundingClientRect();
      this.ghostDiv.classList.remove('dragging');
      this.ghostDiv.style.transform = `translate(${rect.left}px, ${rect.top}px)`;

      setTimeout(() => {
        this.ghostDiv.remove();
        this.div.style.opacity = '1';
      }, 200);
    } else {
      this.ghostDiv.remove();
      this.div.style.opacity = '1';
    }
  }
}

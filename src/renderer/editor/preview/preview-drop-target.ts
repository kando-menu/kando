//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';

import * as utils from './utils';
import * as math from '../../math';
import { IDropTarget } from '../common/drop-target';
import { IVec2 } from '../../../common';
import { IEditorMenuItem } from '../common/editor-menu-item';
import { IDraggable } from '../common/draggable';

/**
 * This class acts as the drop target for the menu preview. When a menu item is dragged
 * over the preview, it computes the submenu into which the item would be dropped and the
 * index where it would be inserted. It emits events accordingly so that the preview can
 * show the drop indicator and leave a gap for the to-be-dropped item.
 *
 * While this class has access to the entire menu structure, it will not modify it.
 * Instead, it will emit events which can be used to modify the menu structure from the
 * outside. It emits the following events:
 *
 * @fires drag-over - When a menu item is dragged over the preview. The event data is the
 *   the original index of the dragged item (if it was an internal drag-and-drop
 *   operation, null otherwise), the target menu item (if there is a valid drop target
 *   currently, else null) and the index where the item should be inserted into the
 *   target's children.
 * @fires drop-item - When a menu item is successfully dropped. The event data is the
 *   dropped menu item, the original index of the dragged item (if it was an internal
 *   drag-and-drop operation, else null), the target item and the index where the item
 *   should be inserted into the target's children.
 */
export class PreviewDropTarget extends EventEmitter implements IDropTarget {
  /**
   * The container is the HTML element which contains the menu preview. It is passed to
   * the constructor.
   */
  private container: HTMLElement = null;

  /** This is the current center item of the preview. */
  private centerItem: IEditorMenuItem = null;

  /** This is the parent item of the center item. */
  private parentItem: IEditorMenuItem = null;

  /**
   * This is the position of the preview center. It is used to compute the angles of the
   * menu items during drag'n'drop.
   */
  private previewCenter?: IVec2 = null;

  /**
   * We keep track whether something is currently dragged over the preview area. This way
   * we can reset the drop target if the dragged item leaves the preview area.
   */
  private dragOverPreview = false;

  /**
   * During drag'n'drop operations, this is the menu item where the dragged item would be
   * dropped.
   */
  private dropTarget: IEditorMenuItem | null = null;

  /**
   * During drag'n'drop operations, this is the index where the dragged item would be
   * inserted into the children of the drop target.
   */
  private dropIndex: number | null = null;

  /**
   * This is the index of the dragged child. It is used to re-add the child to the correct
   * position when the drag operation is aborted.
   */
  private dragIndex: number | null = null;

  constructor(container: HTMLElement) {
    super();

    this.container = container;
  }

  /**
   * This is called by the `Preview` class whenever a new menu is displayed.
   *
   * @param centerItem The menu item which is currently shown in preview.
   * @param parentItem The parent menu of the centerItem. Will be `undefined` for the root
   *   item.
   */
  public setCenterItem(centerItem: IEditorMenuItem, parentItem: IEditorMenuItem) {
    this.centerItem = centerItem;
    this.parentItem = parentItem;
  }

  public setDraggedItem(item: IEditorMenuItem) {
    this.dragIndex = this.centerItem.children.indexOf(item);
  }

  public getLast() {
    return { dropTarget: this.dropTarget, dropIndex: this.dropIndex };
  }

  // IDropTarget implementation ----------------------------------------------------------

  /**
   * This method is called to check whether the given coordinates are a valid drop
   * location for the given draggable.
   *
   * @param draggable The draggable which is currently dragged.
   * @param coords The viewport coordinates to check.
   * @returns `true` if the given coordinates are a valid drop location.
   */
  accepts(draggable: IDraggable, coords: IVec2) {
    const previewRect = this.container.getBoundingClientRect();

    if (coords.x < previewRect.left || coords.x > previewRect.right) {
      return false;
    }

    if (coords.y < previewRect.top || coords.y > previewRect.bottom) {
      return false;
    }

    // We only accept menu items.
    if (draggable.getDataType() !== 'menu-item') {
      return false;
    }

    // Also, we do not accept menu items with fixed angles. These are not really dragged
    // around but only rotated around the center.
    const item = draggable.getData() as IEditorMenuItem;
    return item.angle === undefined;
  }

  public onDropEnter() {
    this.dragOverPreview = true;
  }

  public onDropLeave() {
    this.emit('drag-over', this.dragIndex, null, null);
    this.dragOverPreview = false;
    this.dropIndex = null;
    this.dropTarget = null;
  }

  public onDropMove(coords: IVec2) {
    // Compute the angle towards the dragged item.
    const relativePosition = math.subtract(coords, this.getPreviewCenter());
    const dragAngle = math.getAngle(relativePosition);

    // If something is dragged over the preview, we compute the index where the item
    // would be dropped. The child items will be re-arranged to leave a gap for the
    // to-be-dropped item.
    let newDropTarget = null;
    let newDropIndex = null;

    if (this.dragOverPreview) {
      const result = utils.computeDropTarget(this.centerItem, dragAngle, this.dragIndex);

      // If the returned drop target is null, it is supposed to be dropped on the
      // parent item.
      newDropTarget = result.dropTarget ?? this.parentItem;
      newDropIndex = result.dropIndex;
    }

    // If the drop target or index changed, we emit the `drag-item` event.
    if (newDropTarget !== this.dropTarget || newDropIndex !== this.dropIndex) {
      this.dropIndex = newDropIndex;
      this.dropTarget = newDropTarget;

      this.emit('drag-over', this.dragIndex, this.dropTarget, this.dropIndex);
    }
  }

  public onDrop(source: IDraggable) {
    const item = source.getData() as IEditorMenuItem;

    // Items with fixed angles are not really dragged around.
    if (item.angle === undefined) {
      this.emit('drop-item', item, this.dragIndex, this.dropTarget, this.dropIndex);
    }
  }

  public onDropCancel() {
    this.emit('drag-over', null, this.dropTarget, null);
    this.dragOverPreview = false;
    this.dropIndex = null;
    this.dropTarget = null;
  }

  // Private methods ---------------------------------------------------------------------

  /**
   * Getting the center coordinates of the preview is only possible after the preview has
   * been added to the DOM and is a bit costly. Therefore, we get it lazily and cache the
   * result.
   *
   * @returns The center coordinates of the preview.
   */
  private getPreviewCenter() {
    if (!this.previewCenter) {
      this.previewCenter = utils.computeCenter(this.container);

      // When the window is resized, we have to recompute the preview center.
      window.addEventListener('resize', () => {
        this.previewCenter = utils.computeCenter(this.container);
      });
    }

    return this.previewCenter;
  }
}

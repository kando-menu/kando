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
import { IEditorMenuItem, toIMenuItem } from '../common/editor-menu-item';
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
 * @fires drag-enter - When a dragged menu item enters the preview area. The event data is
 *   the dragged item.
 * @fires drag-leave - When a dragged menu item leaves the preview area. The event data is
 *   the dragged item.
 * @fires drag-cancel - When a drag operation is canceled while the dragged item is over
 *   the preview area. The event data is the dragged item.
 * @fires drag-move - When a menu item is dragged over the preview. The event data is the
 *   the dragged item, the current drop-target menu, and the index where the item should
 *   be inserted into the target's children.
 * @fires drop - When a menu item is successfully dropped. The event data is the dropped
 *   menu item, the target item and the index where the item should be inserted into the
 *   target's children.
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
   * During drag'n'drop operations, this is the menu item where the dragged item would be
   * dropped.
   */
  private dropInto: IEditorMenuItem | null = null;

  /**
   * During drag'n'drop operations, this is the index where the dragged item would be
   * inserted into the children of the drop target.
   */
  private dropIndex: number | null = null;

  /**
   * This constructor creates a new `PreviewDropTarget` instance.
   *
   * @param container The container is the HTML element which contains the menu preview.
   */
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

    // We accept menu items from everywhere.
    if (
      draggable.getDataType() !== 'trashed-menu-item' &&
      draggable.getDataType() !== 'stashed-menu-item' &&
      draggable.getDataType() !== 'menu-item'
    ) {
      return false;
    }

    // Also, we do not accept menu items with fixed angles. These are not really dragged
    // around but only rotated around the center.
    const item = draggable.getData() as IEditorMenuItem;
    return item.angle === undefined;
  }

  /** @inheritdoc */
  public onDragEnter(draggable: IDraggable) {
    this.emit('drag-enter', draggable.getData() as IEditorMenuItem);
  }

  /** @inheritdoc */
  public onDragLeave(draggable: IDraggable) {
    this.dropIndex = null;
    this.dropInto = null;
    this.emit('drag-leave', draggable.getData() as IEditorMenuItem);
  }

  /**
   * If the drop target or drop index changes during the drag operation, we emit the
   * `drag-move` event.
   *
   * @param draggable The draggable which is moved.
   * @param coords The current coordinates of the pointer in viewport space.
   */
  public onDropMove(draggable: IDraggable, coords: IVec2) {
    // Compute the angle towards the dragged item.
    const relativePosition = math.subtract(coords, this.getPreviewCenter());
    const dragAngle = math.getAngle(relativePosition);

    // If something is dragged over the preview, we compute the index where the item
    // would be dropped. The child items will be re-arranged to leave a gap for the
    // to-be-dropped item.
    const item = draggable.getData() as IEditorMenuItem;
    const dragIndex = this.centerItem.children.indexOf(item);
    const result = utils.computeDropTarget(
      this.centerItem,
      dragAngle,
      dragIndex >= 0 ? dragIndex : null
    );

    // If the returned drop target is null, it is supposed to be dropped on the
    // parent item.
    const newDropInto = result.dropTarget ?? this.parentItem;
    const newDropIndex = result.dropIndex;

    // If the drop target or index changed, we emit the `drag-item` event.
    if (newDropInto !== this.dropInto || newDropIndex !== this.dropIndex) {
      this.dropIndex = newDropIndex;
      this.dropInto = newDropInto;

      this.emit('drag-move', item, this.dropInto, this.dropIndex);
    }
  }

  /** @inheritdoc */
  public onDropCancel(draggable: IDraggable) {
    this.dropIndex = null;
    this.dropInto = null;

    const item = draggable.getData() as IEditorMenuItem;
    this.emit('drag-cancel', item);
  }

  /** @inheritdoc */
  public onDrop(draggable: IDraggable, shouldCopy: boolean) {
    // If the item is to be copied, we create a new item with the same data.
    const item = draggable.getData() as IEditorMenuItem;

    if (shouldCopy) {
      this.emit('drop', toIMenuItem(item), this.dropInto, this.dropIndex);
    } else {
      this.emit('drop', item, this.dropInto, this.dropIndex);
    }

    this.dropIndex = null;
    this.dropInto = null;
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

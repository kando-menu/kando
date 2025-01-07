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
import * as math from '../../common/math';
import { IDraggable } from '../common/draggable';
import { IVec2 } from '../../common';
import { IEditorMenuItem } from '../common/editor-menu-item';
import { IDropTarget } from '../common/drop-target';

/**
 * This class is used to make the child items in the menu preview draggable.
 *
 * While it has access to the menu item, it will not modify it. Instead, it will emit
 * events which can be used to modify the item from the outside. It emits the following
 * events:
 *
 * @fires select - When the item is clicked.
 * @fires drag-start - When the item is started to be dragged. This is only emitted for
 *   items with non-fixed angles.
 * @fires drop - When the item is successfully dropped. This is only emitted for items
 *   with non-fixed angles.
 * @fires drag-cancel - When the drag operation is canceled. This is only emitted for
 *   items with non-fixed angles.
 * @fires update-fixed-angle - When a menu item with a fixed angle is dragged around. The
 *   event data is the dragged item and the new angle.
 */
export class PreviewDraggable extends EventEmitter implements IDraggable {
  /**
   * The container is the HTML element which contains the menu preview. It is passed to
   * the constructor.
   */
  private container: HTMLElement = null;

  /** This is the item which is made draggable. */
  private item: IEditorMenuItem = null;

  /**
   * This is the position of the preview center. It is used to compute the angles of the
   * menu items during drag'n'drop.
   */
  private previewCenter?: IVec2 = null;

  constructor(container: HTMLElement, item: IEditorMenuItem) {
    super();

    this.container = container;
    this.item = item;
  }

  // IDragSource implementation ----------------------------------------------------------

  /** @returns The HTML element which should be dragged around. */
  public getDiv() {
    return this.item.div;
  }

  /** @returns 'menu-item' */
  public getDataType() {
    return this.item.angle != null ? 'locked-menu-item' : 'menu-item';
  }

  /** @returns The menu item which is made draggable. */
  public getData() {
    return this.item;
  }

  /** This adds a CSS class to the item when it is clicked. */
  public onMouseDown() {
    this.item.div.classList.add('clicking');
  }

  /** This removes the CSS class when the mouse button is released. */
  public onMouseUp() {
    this.item.div.classList.remove('clicking');
  }

  /** When the item is clicked, we emit a 'select' event. */
  public onClick() {
    this.emit('select');
  }

  /**
   * This is called when a menu item is started to be dragged. Only menu items without
   * fixed angles can be dragged freely around.
   */
  public onDragStart() {
    if (this.item.angle === undefined) {
      this.item.div.classList.add('dragging');
      this.emit('drag-start');
    }
  }

  /** This is called when a drag operation is done. */
  public onDrop(target: IDropTarget, shouldCopy: boolean) {
    if (this.item.angle === undefined) {
      // Reset the position of the dragged div.
      this.item.div.style.left = '';
      this.item.div.style.top = '';
      this.item.div.classList.remove('dragging');

      this.emit('drop', target, shouldCopy);
    }
  }

  /**
   * This is called when a drag operation is aborted. We reset the position of the dragged
   * div and emit the 'drag-cancel' event.
   */
  public onDragCancel() {
    if (this.item.angle === undefined) {
      // Reset the position of the dragged div.
      this.item.div.style.left = '';
      this.item.div.style.top = '';
      this.item.div.classList.remove('dragging');
      this.emit('drag-cancel');
    }
  }

  /**
   * This is called when a menu item is dragged around. Menu items without fixed angles
   * will be moved around freely. If the item has a fixed angle, it will be rotated around
   * the parent menu item.
   */
  public onDragMove(viewportCoords: IVec2, parentCoords: IVec2) {
    // If the item has a fixed angle, we cannot move it around freely. Instead, we
    // update its fixed angle when it's dragged around. For now, we limit the movement
    // to 15 degree steps.
    if (this.item.angle !== undefined) {
      const relativePosition = math.subtract(viewportCoords, this.getPreviewCenter());
      const dragAngle = math.getAngle(relativePosition);
      const angle = Math.round(dragAngle / 15) * 15;
      if (angle !== this.item.angle) {
        this.emit('update-fixed-angle', angle);
      }
    } else {
      // Update the position of the dragged div.
      this.item.div.style.left = `${parentCoords.x}px`;
      this.item.div.style.top = `${parentCoords.y}px`;
    }
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

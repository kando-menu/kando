//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IEditorMenuItem } from '../common/editor-menu-item';
import { ItemDragger } from '../common/item-dragger';
import * as utils from './utils';
import * as math from '../../math';
import { IVec2 } from '../../../common';

/**
 * This class is a specialized ItemDragger which is used to drag menu items in the
 * editor's preview. In addition to making the given items draggable, it also adds support
 * for drag and drop operations from the toolbar.
 *
 * While this class has access to the entire menu structure, it will not modify it.
 * Instead, it will emit events which can be used to modify the menu structure from the
 * outside. It emits the following events in addition to the events emitted by the
 * `ItemDragger` base class:
 *
 * @fires drag-item - When a menu item is dragged over the preview. The event data is the
 *   dragged item, the original index of the dragged item (if it was an internal
 *   drag-and-drop operation), the target menu item (if there is a valid drop target
 *   currently, else undefined) and the index where the item should be inserted into the
 *   target's children.
 * @fires drop-item - When a menu item is successfully dropped onto a drop target. The
 *   event data is the dragged item, the original index of the dragged item (if it was an
 *   internal drag-and-drop operation), the target item and the index where the item
 *   should be inserted into the target's children.
 * @fires update-fixed-angle - When a menu item with a fixed angle is dragged around. The
 *   event data is the dragged item and the new angle.
 */
export class PreviewItemDragger extends ItemDragger<IEditorMenuItem> {
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

  /**
   * This is the position of the preview center. It is used to compute the angles of the
   * menu items during drag'n'drop.
   */
  private previewCenter?: IVec2 = null;

  constructor(container: HTMLElement) {
    super();

    this.container = container;

    // When the window is resized, we have to recompute the preview center. It is used
    // to compute the angles of the menu items during drag'n'drop.
    window.addEventListener('resize', () => {
      this.previewCenter = utils.computeCenter(this.container);
    });

    this.on('mouse-down', (item, itemDiv) => {
      itemDiv.classList.add('clicking');
    });

    this.on('mouse-up', (item, itemDiv) => {
      itemDiv.classList.remove('clicking');
    });

    this.initInternalDragging();
    this.initExternalDragging();
  }

  /**
   * This is called by the `Preview` class whenever a new menu is displayed.
   *
   * @param centerItem The menu item which is currently shown in preview.
   * @param parentItem The parent menu of the centerNode. Will be `undefined` for the root
   *   item.
   */
  public setCenterItem(centerItem: IEditorMenuItem, parentItem: IEditorMenuItem) {
    this.centerItem = centerItem;
    this.parentItem = parentItem;

    // This actually has to be done only once after the menu preview has been added to
    // the DOM and during window resize events. However, we do not have a good place for
    // this, so we do it here.
    this.previewCenter = utils.computeCenter(this.container);
  }

  public getLastDropTarget() {
    return { dropTarget: this.dropTarget, dropIndex: this.dropIndex };
  }

  /** This methods sets up the logic required for reordering menu nodes in the preview. */
  private initInternalDragging() {
    // We keep track whether something is currently dragged over the preview area. This
    // way we can reset the drop target if the dragged item leaves the preview area.
    let dragOverPreview = false;

    const dragEnter = () => {
      dragOverPreview = true;
    };

    const dragLeave = () => {
      dragOverPreview = false;
    };

    // This is called when a menu item is started to be dragged. Menu items without fixed
    // angles can be dragged freely around and will be detached from the parent menu
    // during the drag. Items with fixed angles cannot be dragged freely but will only
    // rotate around the parent menu item.
    this.on('drag-start', (item, itemDiv) => {
      // If the item has a fixed angle, we do nothing. In this case, the item will be
      // rotated during the drag-move listener further down.
      if (item.angle !== undefined) {
        return;
      }

      // We add a class to the editor to indicate that a menu item is currently dragged.
      // This is used to highlight the stash and trash tabs.
      const editor = document.getElementById('kando-editor');
      editor.classList.add('dragging-item-from-preview');

      // Store the index of the dragged child. We need to exclude it from all angle
      // computations during the drag operation as it will be visually detached from the
      // parent menu.
      this.dragIndex = this.centerItem.children.indexOf(item);
      this.dropIndex = null;
      this.dropTarget = null;

      itemDiv.classList.add('dragging');

      dragOverPreview = true;
      this.container.addEventListener('pointerenter', dragEnter);
      this.container.addEventListener('pointerleave', dragLeave);
    });

    // This is called when a menu item is dragged around. Menu items without fixed angles
    // will be moved around freely. If the item has a fixed angle, it will be rotated
    // around the parent menu item.
    this.on('drag-move', (item, itemDiv, relative, absolute) => {
      // Compute the angle towards the dragged item.
      const relativePosition = math.subtract(absolute, this.previewCenter);
      const dragAngle = math.getAngle(relativePosition);

      // If the item has a fixed angle, we cannot move it around freely. Instead, we
      // update its fixed angle when it's dragged around. For now, we limit the movement
      // to 15 degree steps.
      if (item.angle !== undefined) {
        const angle = Math.round(dragAngle / 15) * 15;
        this.emit('update-fixed-angle', item, angle);
        return;
      }

      // Update the position of the dragged div.
      itemDiv.style.left = `${relative.x}px`;
      itemDiv.style.top = `${relative.y}px`;

      // If something is dragged over the preview, we compute the index where the item
      // would be dropped. The child items will be re-arranged to leave a gap for the
      // to-be-dropped item.
      let newDropTarget = null;
      let newDropIndex = null;

      if (dragOverPreview) {
        const result = utils.computeDropTarget(
          this.centerItem,
          dragAngle,
          this.dragIndex
        );

        // If the returned drop target is null, it is supposed to be dropped on the
        // parent item.
        newDropTarget = result.dropTarget ?? this.parentItem;
        newDropIndex = result.dropIndex;
      }

      // If the drop target or index changed, we emit the `drag-item` event.
      if (newDropTarget !== this.dropTarget || newDropIndex !== this.dropIndex) {
        this.dropIndex = newDropIndex;
        this.dropTarget = newDropTarget;

        this.emit('drag-item', item, this.dragIndex, this.dropTarget, this.dropIndex);
      }
    });

    // This is called when a drag operation is finished. This happens either when the
    // dragged item is dropped or when the drag operation is aborted.
    const onDragEnd = (itemDiv: HTMLElement) => {
      // Reset the position of the dragged div.
      itemDiv.style.left = '';
      itemDiv.style.top = '';
      itemDiv.classList.remove('dragging');

      // Reset the toolbar class.
      const editor = document.getElementById('kando-editor');
      editor.classList.remove('dragging-item-from-preview');

      this.container.removeEventListener('pointerenter', dragEnter);
      this.container.removeEventListener('pointerleave', dragLeave);
    };

    // This is called when a menu item is dropped.
    this.on('drag-end', (item, itemDiv) => {
      // If the item has a fixed angle, we do nothing. In this case, the item was only
      // rotated during the drag operation but not removed from the parent menu.
      if (item.angle !== undefined) {
        return;
      }

      this.emit('drop-item', item, this.dragIndex, this.dropTarget, this.dropIndex);

      // Reset the position of the dragged div and hide the drop indicator.
      onDragEnd(itemDiv);
    });

    // This is called when a drag operation is aborted. The dragged item is re-added to the
    // parent menu.
    this.on('drag-cancel', (item, itemDiv) => {
      // If the item has a fixed angle, we do nothing. In this case, the item was only
      // rotated during the drag operation but not removed from the parent menu.
      if (item.angle !== undefined) {
        return;
      }

      // Reset the position of the dragged div and hide the drop indicator.
      onDragEnd(itemDiv);
    });
  }

  /**
   * This methods sets up the logic required for dragging nodes from the toolbar to the
   * preview. We basically detect if something is dragged over the preview area by looking
   * at the mouse pointer state and the CSS classes given to the #kando-editor element. We
   * emit the `drag-item` event accordingly. We do not emit the `drop-item` signal.
   * Instead, the editor will tell the preview when a menu item from the toolbar is
   * dropped to the preview.
   */
  private initExternalDragging() {
    let externalDragOngoing = false;

    // When the pointer enters the preview area, we check if something is dragged from the
    // stash or trash tab. If this is the case, we set `externalDragOngoing` to true.
    this.container.addEventListener('pointerenter', (event: PointerEvent) => {
      const editor = document.getElementById('kando-editor');
      if (
        event.buttons === 1 &&
        (editor.classList.contains('dragging-new-item-from-toolbar') ||
          editor.classList.contains('dragging-item-from-stash-tab') ||
          editor.classList.contains('dragging-item-from-trash-tab'))
      ) {
        externalDragOngoing = true;
      }
    });

    // When the pointer leaves the preview area, we reset `externalDragOngoing`. We also
    // reset the drop target and index.
    this.container.addEventListener('pointerleave', () => {
      if (externalDragOngoing) {
        externalDragOngoing = false;
        this.dropTarget = null;
        this.dropIndex = null;
        this.emit('drag-item', null, null, null, null);
      }
    });

    // If something is dragged over the preview, we compute the index where the item
    // would be dropped. The child items will be re-arranged to leave a gap for the
    // to-be-dropped item.
    this.container.addEventListener('pointermove', (event: PointerEvent) => {
      let newDropTarget = null;
      let newDropIndex = null;

      if (externalDragOngoing) {
        // Compute the angle towards the dragged item.
        const relativePosition = math.subtract(
          { x: event.clientX, y: event.clientY },
          this.previewCenter
        );

        const dragAngle = math.getAngle(relativePosition);
        const result = utils.computeDropTarget(this.centerItem, dragAngle);

        // If the returned drop target is null, it is supposed to be dropped on the
        // parent item.
        newDropTarget = result.dropTarget ?? this.parentItem;
        newDropIndex = result.dropIndex;
      }

      // If the drop target or index changed, we emit the `drag-item` event.
      if (newDropTarget !== this.dropTarget || newDropIndex !== this.dropIndex) {
        this.dropIndex = newDropIndex;
        this.dropTarget = newDropTarget;

        this.emit('drag-item', null, null, this.dropTarget, this.dropIndex);
      }
    });

    // When the pointer is released while something is dragged over the preview, we emit
    // the `drag-item` event with null values to indicate that the drag operation is
    // finished.
    this.container.addEventListener('pointerup', () => {
      if (externalDragOngoing) {
        externalDragOngoing = false;
        this.emit('drag-item', null, null, null, null);
      }
    });
  }
}

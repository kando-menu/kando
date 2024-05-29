//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IVec2 } from '../../../common';
import { IDropTarget } from './drop-target';

/**
 * This interface is implemented by all draggable elements in the editor. It is used by
 * the `DnDManager` to handle drag and drop operations.
 */
export interface IDraggable {
  /**
   * This method should return the HTML element which should be dragged around.
   *
   * @returns The HTML element which should be dragged around.
   */
  getDiv(): HTMLElement;

  /**
   * This method should return an identifier which characterizes the type of data which
   * can be provided by the draggable. This is used by the drop target to check whether
   * the draggable can provide suitable data.
   *
   * @returns The type of data which can be provided by the draggable.
   */
  getDataType(): string;

  /**
   * This method will be called by the drop target after a successful drop operation. It
   * should return the data which which should be passed to the drop target. The type can
   * usually be inferred from the `getDataType` method.
   *
   * @returns The data which should be passed to the drop target.
   */
  getData(): unknown;

  /**
   * This method is called when the draggable element is clicked. If the mouse is moved
   * more than a few pixels during the click, the `onDragStart` method will be called
   * later.
   */
  onMouseDown(): void;

  /**
   * This method is called when the mouse button is released after the drag-drop operation
   * or after a click.
   */
  onMouseUp(): void;

  /**
   * This method is called when the pointer was not moved more than a few pixels during
   * the click and no drag operation was started.
   */
  onClick(): void;

  /**
   * This method is called when a drag operation is started. You can use it to update the
   * appearance of the draggable element.
   */
  onDragStart(): void;

  /**
   * This method is called when the drag operation is successfully finished. You can use
   * it to remove the draggable element from the DOM. It will be called before the
   * corresponding `onDrop` method of the drop target.
   *
   * @param target The drop target on which the draggable element was dropped.
   */
  onDrop(target: IDropTarget): void;

  /**
   * This method is called when the drag operation is canceled. You can use it to update
   * the appearance of the draggable element.
   */
  onDragCancel(): void;

  /**
   * This method is called when the draggable element is dragged around. You can use it to
   * update the position of the draggable element.
   *
   * @param viewportCoords The current coordinates of the pointer in viewport space.
   * @param parentCoords The current coordinates of the pointer in the space of the
   *   draggable element's parent.
   * @param grabOffset The offset between the pointer and the draggable element's top-left
   *   corner when the drag operation started.
   */
  onDragMove(viewportCoords: IVec2, parentCoords: IVec2, grabOffset: IVec2): void;
}

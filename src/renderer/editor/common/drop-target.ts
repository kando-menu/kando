//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IVec2 } from '../../../common';
import { IDraggable } from './draggable';

/**
 * This interface is implemented by all drop targets in the editor. It is used by the
 * `DnDManager` to handle drag and drop operations.
 */
export interface IDropTarget {
  /**
   * This method is called to check whether the given coordinates are a valid drop
   * location for the given draggable.
   *
   * @param draggable The draggable which is currently dragged.
   * @param coords The viewport coordinates to check.
   * @returns `true` if the given coordinates are a valid drop location.
   */
  accepts(draggable: IDraggable, coords: IVec2): boolean;

  /** This method is called when a draggable enters the drop target. */
  onDropEnter(): void;

  /** This method is called when a draggable leaves the drop target. */
  onDropLeave(): void;

  /**
   * This method is called when a draggable is moved over the drop target.
   *
   * @param coords The viewport coordinates of the draggable.
   */
  onDropMove(coords: IVec2): void;

  /**
   * This method is called when a draggable is dropped onto the drop target. The
   * corresponding `onDrop` method of the draggable is called before this method.
   *
   * @param source The draggable which was dropped onto the target.
   */
  onDrop(source: IDraggable): void;

  /**
   * This method is called when the drag operation is canceled while the draggable is over
   * the drop target. In this case, the `onDropLeave` method is not called.
   */
  onDropCancel(): void;
}

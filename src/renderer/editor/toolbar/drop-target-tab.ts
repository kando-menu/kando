//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';

import { IDropTarget } from '../common/drop-target';
import { IDraggable } from '../common/draggable';
import { DnDManager } from '../common/dnd-manager';
import { IVec2 } from '../../../common';

/**
 * There are several tabs in the toolbar which accept drag'n'drop operations. This class
 * is the base class for all of them. It provides some common functionality like
 * highlighting the tab when a draggable is dragged over it.
 *
 * This class extends EventEmitter so that derived classes can emit events. It does not
 * emit any events itself.
 */
export class DropTargetTab extends EventEmitter implements IDropTarget {
  /**
   * This constructor registers the tab as a drop target and highlights it when a
   * draggable is dragged over it.
   *
   * @param dndManager This is used to manage the drag'n'drop operations.
   * @param acceptedTypes This is an array of draggable data types which are accepted by
   *   the tab.
   * @param tabHeader This is the tab's HTML element.
   * @param tabContent This is the HTML element which contains the tab's content.
   */
  constructor(
    dndManager: DnDManager,
    private acceptedTypes: string[],
    protected tabHeader: HTMLElement,
    protected tabContent: HTMLElement
  ) {
    super();

    dndManager.registerDropTarget(this);

    // If a menu is started to be dragged, we highlight the menu tab.
    dndManager.on('drag-start', (draggable) => {
      if (this.acceptedTypes.includes(draggable.getDataType())) {
        this.tabHeader.classList.add('highlight-drop-target');
      }
    });

    // And remove the highlight when the drag operation ends.
    dndManager.on('drag-end', () => {
      this.tabHeader.classList.remove('highlight-drop-target');
    });
  }

  // IDropTarget implementation ----------------------------------------------------------

  /** @inheritdoc */
  accepts(draggable: IDraggable, coords: IVec2) {
    if (!this.acceptedTypes.includes(draggable.getDataType())) {
      return false;
    }

    // If the coords are inside the trash tab content, we accept the draggable.
    const rect = this.tabContent.getBoundingClientRect();
    if (
      coords.x >= rect.left &&
      coords.x <= rect.right &&
      coords.y >= rect.top &&
      coords.y <= rect.bottom
    ) {
      return true;
    }

    // Also accept the draggable if the coords are inside the trash tab header.
    const headerRect = this.tabHeader.getBoundingClientRect();
    if (
      coords.x >= headerRect.left &&
      coords.x <= headerRect.right &&
      coords.y >= headerRect.top &&
      coords.y <= headerRect.bottom
    ) {
      return true;
    }

    return false;
  }

  /** @inheritdoc */
  onDragEnter() {
    // If the trash tab is currently shown, we highlight it.
    if (this.tabContent.classList.contains('active')) {
      this.tabContent.classList.add('drop-target');
      return;
    }

    // Else we highlight the trash tab header.
    this.tabHeader.classList.add('drop-target');
  }

  /** @inheritdoc */
  onDragLeave() {
    this.tabContent.classList.remove('drop-target');
    this.tabHeader.classList.remove('drop-target');
  }

  /** @inheritdoc */
  onDropMove() {}

  /** @inheritdoc */
  onDropCancel() {
    this.tabContent.classList.remove('drop-target');
    this.tabHeader.classList.remove('drop-target');
  }

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDrop(draggable: IDraggable) {
    this.tabContent.classList.remove('drop-target');
    this.tabHeader.classList.remove('drop-target');
  }
}

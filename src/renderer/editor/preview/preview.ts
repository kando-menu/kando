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
import * as utils from './utils';
import { IEditorMenuItem } from '../common/editor-menu-item';
import { PreviewDraggable } from './preview-draggable';
import { PreviewDropTarget } from './preview-drop-target';
import { IVec2, IMenu } from '../../../common';
import { IconThemeRegistry } from '../../icon-themes/icon-theme-registry';
import { DnDManager } from '../common/dnd-manager';

/**
 * This class is responsible for displaying the menu preview of the editor. It supports
 * navigation through the menu hierarchy by clicking on the menu items in the preview. It
 * also supports the reordering of the menu items by drag'n'drop.
 *
 * It will emit the following events:
 *
 * - @fires select-root - This is emitted when the root menu item is selected. No event data
 *   is emitted and also no select-item event is emitted.
 * - @fires select-item - This is emitted when a menu item is selected. The event data is
 *   the selected menu item.
 */
export class Preview extends EventEmitter {
  /**
   * The container is the HTML element which contains the menu preview. It is created in
   * the constructor and returned by the getContainer() method.
   */
  private container: HTMLElement = null;

  /**
   * The canvas is the HTML element which contains the menu items. It is a sub-element of
   * the container. The intermediate elements are used to center the preview and to create
   * a fixed aspect ratio.
   */
  private canvas: HTMLElement = null;

  /**
   * The backlink is the HTML element which contains the button to navigate back to the
   * parent menu.
   */
  private backlink: HTMLElement = null;

  /**
   * This array contains the chain of selected menu items up to the item which is
   * currently shown in the center. The first element is the menu's root, the second
   * element is the selected child of the root (if any), and so on.
   */
  private selectionChain: Array<IEditorMenuItem> = [];

  /**
   * The menu item which has been selected last time. This item has a special style in the
   * preview and its properties are drawn in the property editor on the right.
   */
  private activeItem?: IEditorMenuItem = null;

  /** This is used to drag'n'drop menu items. */
  private dndManager: DnDManager = null;
  private dropTarget: PreviewDropTarget = null;
  private draggables: Array<PreviewDraggable> = [];

  /**
   * This is a little div which becomes visible when something is dragged over the
   * preview. This is used to indicate where the dragged item would be dropped.
   */
  private dropIndicator: HTMLElement = null;

  /**
   * This constructor creates the HTML elements for the menu preview and wires up all the
   * functionality.
   */
  constructor(dndManager: DnDManager) {
    super();

    const template = require('./templates/preview.hbs');

    const div = document.createElement('div');
    div.innerHTML = template({
      areaId: 'kando-menu-preview-area',
      canvasId: 'kando-menu-preview-canvas',
    });

    this.container = div.firstElementChild as HTMLElement;

    // Register the menu preview as potential drop target.
    this.dndManager = dndManager;
    this.dropTarget = new PreviewDropTarget(this.container);
    this.dndManager.registerDropTarget(this.dropTarget);

    // Keep a reference to the 'canvas' element. It is not the HTML5 canvas element, but
    // the element into which the menu items are rendered using HTML and CSS.
    this.canvas = this.container.querySelector(
      '#kando-menu-preview-canvas'
    ) as HTMLElement;

    this.initDragAndDrop();
  }

  /** This method returns the container of the menu preview. */
  public getContainer(): HTMLElement {
    return this.container;
  }

  /**
   * This method shows the menu preview. This is used when the toolbar of the editor is
   * collapsed.
   */
  public show() {
    this.container.classList.add('visible');
  }

  /**
   * This method hides the menu preview. This is used when the toolbar of the editor is
   * expanded.
   */
  public hide() {
    this.container.classList.remove('visible');
  }

  /**
   * This method is called when the menu preview should display a new menu. It is called
   * initially from the editor for the root menu. If no menu is given, the menu preview
   * will be cleared.
   */
  public setMenu(menu?: IMenu) {
    this.selectionChain = [];

    if (menu) {
      this.computeItemAnglesRecursively(menu.root.children);
      this.selectItem(menu.root);
    } else {
      this.hideOldMenuItems({ x: 0, y: 0 });
    }
  }

  /**
   * This method redraws the name and icon of the currently selected menu item. This is
   * called when the user changes the name or icon in the properties editor.
   */
  public updateActiveItem() {
    if (!this.activeItem) {
      return;
    }

    // Update the label if it is a child item.
    const label = this.activeItem.div.querySelector('.kando-menu-preview-label');
    if (label) {
      label.textContent = this.activeItem.name;
    }

    // Update the icon.
    const icon = this.activeItem.div.querySelector('.icon-container');
    icon.remove();
    this.activeItem.div.prepend(
      IconThemeRegistry.getInstance().createIcon(
        this.activeItem.iconTheme,
        this.activeItem.icon
      )
    );
  }

  /**
   * This returns the menu item which is currently shown in the center of the preview.
   *
   * @returns The menu item which is currently in the center of the preview.
   */
  private getCenterItem(): IEditorMenuItem {
    return this.selectionChain[this.selectionChain.length - 1];
  }

  /**
   * This returns the parent item of the currently selected item. If the currently
   * selected item is the root item, this method returns null.
   *
   * @returns The parent of the currently selected item or null if the currently selected
   *   item is the root item.
   */
  private getParentItem(): IEditorMenuItem | null {
    return this.selectionChain[this.selectionChain.length - 2] ?? null;
  }

  /**
   * This method initializes the drag'n'drop functionality of the menu preview. This is
   * used to move menu items around in the preview. Normal items can be reordered, dropped
   * into submenus, or dropped onto the parent menu item. Menu items with fixed angles can
   * only be rotated around the parent item.
   */
  private initDragAndDrop() {
    // This is a small helper function which returns the index of the given item in the
    // children list of the center item. If the item is not a child of the center item,
    // this function returns null.
    const getDragIndex = (item: IEditorMenuItem) => {
      const centerItem = this.getCenterItem();
      const index = centerItem.children.indexOf(item);
      return index >= 0 ? index : null;
    };

    // This is called when a menu item enters the preview area.
    this.dropTarget.on('drag-enter', () => {
      this.dropIndicator.classList.add('visible');
    });

    // This is called when the dragged item leaves the preview area.
    this.dropTarget.on('drag-leave', (item) => {
      this.dropIndicator.classList.remove('visible');
      this.recomputeItemAngles(getDragIndex(item));
      this.updateAllPositions();
    });

    // This is called when the operation is canceled while the dragged item is over the
    // preview area.
    this.dropTarget.on('drag-cancel', () => {
      this.dropIndicator.classList.remove('visible');
      this.recomputeItemAngles();
      this.updateAllPositions();
    });

    // Move the drop indicator either to the submenu, to the back-navigation link, or to
    // the drop index position when an item is dragged around.
    this.dropTarget.on('drag-move', (item, dropTarget, dropIndex) => {
      const parentItem = this.getParentItem();
      const centerItem = this.getCenterItem();
      const dragIndex = getDragIndex(item);
      let indicatorAngle = null;

      // If the item is to be dropped somewhere in the currently displayed menu, we have
      // to incorporate the dropIndex to leave an angular gap for the to-be-dropped item.
      if (dropTarget === centerItem) {
        indicatorAngle = this.recomputeItemAngles(dragIndex, dropIndex);
      }
      // If the drop target is not the center item, it is either the parent item (via
      // the back-navigation link) or a submenu. In this case, there is no need to leave a
      // gap for the item.
      else {
        this.recomputeItemAngles(dragIndex);
        indicatorAngle =
          dropTarget === parentItem
            ? utils.getParentAngle(centerItem)
            : dropTarget.computedAngle;
      }

      // Update the drop indicator position.
      const position = math.getDirection(indicatorAngle, 1.0);
      this.dropIndicator.style.setProperty('--dir-x', position.x + '');
      this.dropIndicator.style.setProperty('--dir-y', position.y + '');

      // Update the positions of all items.
      this.updateAllPositions();
    });

    // This is called when a menu item is successfully dropped somewhere.
    this.dropTarget.on('drop', (item, dropInto, dropIndex) => {
      this.dropIndicator.classList.remove('visible');

      // If it was a preview-internal drag operation, this will be the original index of
      // the item in the children list of the center item. Else it will be null.
      const dragIndex = getDragIndex(item);

      // We then check whether the menu item has been dropped into a submenu, or into the
      // parent item. In both cases, the item's div is removed from the DOM and the menu
      // item is added to the children of the drop target.
      const centerItem = this.getCenterItem();
      if (dropInto !== centerItem) {
        // If a drag index is given, it was an internal drag operation. In this case, we
        // have to remove the item from the children of the center item.
        if (dragIndex != null) {
          this.removeItem(item);
        }

        dropInto.children.push(item);

        // Recompute all item angles of the drop target after adding the new item.
        this.computeItemAnglesRecursively(
          dropInto.children,
          utils.getParentAngle(dropInto)
        );

        this.updateAllPositions();

        return;
      }

      // If the drag index is given, it was an internal drag operation. In this case, we
      // have to remove the item from the children of the center item first.
      if (dragIndex != null) {
        centerItem.children.splice(dragIndex, 1);
      }

      // Add the item to the children of the center item at the given drop index.
      centerItem.children.splice(dropIndex, 0, item);

      // If it was a drag operation from outside the preview, we have to add a new
      // div for the item and make it draggable.
      if (dragIndex === null) {
        const container = this.canvas.querySelector(
          '.kando-menu-preview-container.visible'
        ) as HTMLElement;
        this.drawItem(item, container);
        this.makeDraggable(item);
      }

      // As long as the item is not a submenu, we select it immediately. Selecting a
      // submenu would be weird because the preview would transition to the submenu and.
      if (item.type !== 'submenu') {
        this.selectItem(item);
      }

      // In any case, we select the item and redraw the menu.
      this.recomputeItemAngles();
      this.updateAllPositions();
    });
  }

  /**
   * This method is called whenever a new (sub-)menu should be displayed. All currently
   * displayed menu items are removed and the new ones are added. A subtle animation is
   * used to indicate the change.
   *
   * @param transitionAngle The existing menu items are faded out and slighly moved in the
   *   direction of this angle. The new menu items are faded in and moved in the from the
   *   opposite direction.
   */
  private drawMenu(transitionAngle?: number) {
    // Sanity check: If the selection chain is empty, we do nothing.
    if (this.selectionChain.length === 0) {
      return;
    }

    // Clear all previous draggables. We will register all new items further below via the
    // `drawItem()` method.
    this.draggables.forEach((draggable) =>
      this.dndManager.unregisterDraggable(draggable)
    );
    this.draggables = [];

    // First, fade out all currently displayed menu items.
    let transitionDirection = { x: 0, y: 0 };
    if (transitionAngle != null) {
      transitionDirection = math.getDirection(transitionAngle, 1.0);
    }
    this.hideOldMenuItems(transitionDirection);

    // Now we create a new container for the new menu items.
    const container = document.createElement('div');
    container.classList.add('kando-menu-preview-container');
    container.style.setProperty('--dir-x', -transitionDirection.x + '');
    container.style.setProperty('--dir-y', -transitionDirection.y + '');
    this.canvas.appendChild(container);

    // The big center div shows the icon of the currently selected menu.
    const centerItem = this.getCenterItem();
    centerItem.div = utils.createCenterDiv(centerItem);
    container.appendChild(centerItem.div);

    // Make the center item selectable.
    centerItem.div.addEventListener('click', () => this.selectItem(centerItem));
    centerItem.div.addEventListener('pointerdown', () => {
      centerItem.div.classList.add('clicking');
    });

    centerItem.div.addEventListener('pointerup', () => {
      centerItem.div.classList.remove('clicking');
    });

    // Add the children of the currently selected menu.
    centerItem.children?.forEach((child) => {
      this.drawItem(child as IEditorMenuItem, container);
      this.makeDraggable(child as IEditorMenuItem);
    });

    // Let the dragDrop know that we have a new center item.
    this.dropTarget.setCenterItem(centerItem, this.getParentItem());

    // If we are currently showing a submenu, we add the back navigation link towards
    // the direction of the parent menu.
    if (this.selectionChain.length > 1) {
      const parent = this.selectionChain[this.selectionChain.length - 2];
      this.backlink = document.createElement('div');
      this.backlink.classList.add('kando-menu-preview-backlink');
      this.backlink.appendChild(
        IconThemeRegistry.getInstance().createIcon(
          'material-symbols-rounded',
          'arrow_back'
        )
      );
      container.appendChild(this.backlink);

      // Make the back link selectable.
      this.backlink.addEventListener('click', () => this.selectItem(parent));
    } else {
      this.backlink = null;
    }

    // We also add a little div which becomes visible when something is dragged over
    // the preview. This is used to indicate where the dragged item would be dropped.
    this.dropIndicator = document.createElement('div');
    this.dropIndicator.classList.add('kando-menu-preview-drop-indicator');
    container.appendChild(this.dropIndicator);

    // Now we update the angles of all children.
    this.updateAllPositions();

    // Finally, we fade in all menu items with a little delay.
    setTimeout(() => container.classList.add('visible'), 50);
  }

  /**
   * This method is called whenever a new menu item should be added to the preview. It
   * creates a new div for the item and adds it to the given container. The item is also
   * made draggable and selectable.
   *
   * @param item The menu item which should be added to the preview.
   * @param container The container to which the item should be added.
   */
  private drawItem(item: IEditorMenuItem, container: HTMLElement) {
    // Create a div for the child.
    item.div = utils.createChildDiv(item);
    container.appendChild(item.div);

    // Create the fixed-angle lock.
    const lock = utils.createLockDiv(item.angle !== undefined, (locked) => {
      if (locked) {
        item.angle = item.computedAngle;
      } else {
        item.angle = undefined;
        this.recomputeItemAngles();
        this.updateAllPositions();
      }
    });
    item.div.appendChild(lock);
  }

  /**
   * This method creates a new PreviewDraggable for the given menu item. The draggable can
   * be used to move the item around in the preview.
   */
  private makeDraggable(item: IEditorMenuItem) {
    const draggable = new PreviewDraggable(this.container, item);

    // Make the child div selectable and draggable.
    // Select an item when it is clicked.
    draggable.on('select', () => {
      this.selectItem(item);
    });

    // If the item is moved to somewhere outside the preview, we have to remove it from the
    // children list of the current center item.
    draggable.on('drop', (target, shouldCopy) => {
      if (target !== this.dropTarget) {
        if (shouldCopy) {
          this.recomputeItemAngles();
          this.updateAllPositions();
        } else {
          this.removeItem(item);
        }
      }
    });

    // If the drag operation is canceled, we have to recompute the item angles and update
    // all positions.
    draggable.on('drag-cancel', () => {
      this.recomputeItemAngles();
      this.updateAllPositions();
    });

    // This is called whenever a item with a fixed angle is dragged around.
    draggable.on('update-fixed-angle', (angle) => {
      item.angle = angle;

      // Within the list of children, the fixed angles must by monotonically increasing.
      // That means that we may have to reorder the children if the item is dragged
      // beyond the next or previous child with a fixed angle.
      const centerItem = this.getCenterItem();
      let index = centerItem.children.indexOf(item);

      // First, we search for the child with the largest fixed angle which is smaller
      // than the angle of the dragged item. For this, we iterate the children list from
      // the back. If we find any, we have to move the dragged item to the next position.
      for (let i = centerItem.children.length - 1; i > index; --i) {
        const child = centerItem.children[i];
        if (child.angle !== undefined && child.angle < item.angle) {
          centerItem.children.splice(index, 1);
          centerItem.children.splice(i, 0, item);
          index = i;
          break;
        }
      }

      // Second, we search for the child with the smallest fixed angle which is larger
      // than the angle of the dragged item.
      for (let i = 0; i < index; ++i) {
        const child = centerItem.children[i];
        if (child.angle !== undefined && child.angle > item.angle) {
          centerItem.children.splice(index, 1);
          centerItem.children.splice(i, 0, item);
          break;
        }
      }

      this.recomputeItemAngles();
      this.updateAllPositions();
    });

    this.draggables.push(draggable);
    this.dndManager.registerDraggable(draggable);
  }

  /**
   * This method fades out all currently visible menu items and removes them from the DOM.
   * If a transition direction is given, the menu items are moved in this direction during
   * the fade-out animation.
   *
   * @param transitionDirection The direction in which the old menu items should be moved.
   */
  private hideOldMenuItems(transitionDirection: IVec2) {
    this.canvas.childNodes.forEach((c) => {
      const container = c as HTMLElement;
      if (
        c instanceof HTMLElement &&
        container.classList.contains('visible') &&
        container.classList.contains('kando-menu-preview-container')
      ) {
        container.classList.remove('visible');
        container.style.setProperty('--dir-x', transitionDirection.x + '');
        container.style.setProperty('--dir-y', transitionDirection.y + '');

        // After the animation is finished, we remove the menu item from the DOM.
        setTimeout(() => c.remove(), 500);
      }
    });
  }

  /**
   * This method updates the CSS variables for the position and rotation of all currently
   * visible menu items, including the back link div.
   */
  private updateAllPositions() {
    const centerItem = this.getCenterItem();
    if (centerItem.children?.length > 0) {
      centerItem.children.forEach((child) => {
        this.updateChildPosition(child);
      });
    }

    if (this.backlink) {
      const position = math.getDirection(centerItem.computedAngle, 1.0);
      this.backlink.style.setProperty('--rotation', centerItem.computedAngle + 'deg');
      this.backlink.style.setProperty('--dir-x', position.x + '');
      this.backlink.style.setProperty('--dir-y', position.y + '');
    }
  }

  /**
   * This method updates the CSS variables for the position and rotation of the given
   * child based on its `computedAngle` property. It also updates the CSS variables for
   * the position and rotation of the label, and the position of the grandchildren.
   *
   * @param child The child item for which to update the position.
   */
  private updateChildPosition(child: IEditorMenuItem) {
    // Set the CSS variables for the position and rotation of the child.
    const position = math.getDirection(child.computedAngle, 1.0);
    child.div.style.setProperty('--rotation', child.computedAngle + 'deg');
    child.div.style.setProperty('--dir-x', position.x + '');
    child.div.style.setProperty('--dir-y', position.y + '');

    // Set the CSS variables for the position and rotation of the label.
    const labelDivContainer = child.div.querySelector(
      '.kando-menu-preview-label-container'
    ) as HTMLElement;
    labelDivContainer.style.setProperty('--rotation', child.computedAngle + 'deg');

    labelDivContainer.classList.remove('left');
    labelDivContainer.classList.remove('right');
    labelDivContainer.classList.remove('top');
    labelDivContainer.classList.remove('bottom');

    if (position.x < -0.001) {
      labelDivContainer.classList.add('left');
    } else if (position.x > 0.001) {
      labelDivContainer.classList.add('right');
    } else if (position.y < 0) {
      labelDivContainer.classList.add('top');
    } else {
      labelDivContainer.classList.add('bottom');
    }

    // If the child has grandchildren, also position them in a circle around the child.
    if (child.type === 'submenu') {
      const grandChildContainer = child.div.querySelector(
        '.kando-menu-preview-grandchild-container'
      ) as HTMLElement;

      while (grandChildContainer.childElementCount < child.children.length) {
        const grandChildDiv = document.createElement('div');
        grandChildDiv.classList.add('kando-menu-preview-grandchild');
        grandChildContainer.appendChild(grandChildDiv);
      }

      while (grandChildContainer.childElementCount > child.children.length) {
        grandChildContainer.lastChild.remove();
      }

      child.children.forEach((grandChild, i) => {
        (grandChildContainer.childNodes[i] as HTMLElement).style.setProperty(
          '--rotation',
          (grandChild as IEditorMenuItem).computedAngle + 'deg'
        );
      });
    }
  }

  /**
   * This method is called when a menu item is selected. If the menu item has children, it
   * is pushed to the selection chain and the preview is redrawn. In any case, the
   * 'select-root' or 'select-item' event is emitted.
   *
   * @param item The menu item which has been selected.
   */
  private selectItem(item: IEditorMenuItem) {
    // Only submenus can be part of the selection chain.
    if (item.type === 'submenu') {
      // If the item is already the last one in the selection chain, we do nothing. If it
      // is not the last one but somewhere else in the selection chain, we remove all
      // items after it. If it is not in the selection chain at all, we add it to the end.
      const index = this.selectionChain.indexOf(item);
      if (index >= 0 && index < this.selectionChain.length - 1) {
        const lastSelected = this.selectionChain[index + 1];
        this.selectionChain.splice(index + 1);
        this.drawMenu(lastSelected.computedAngle);
      } else if (index === -1) {
        this.selectionChain.push(item);

        this.drawMenu(item.computedAngle == null ? null : item.computedAngle + 180);
      }
    }

    if (this.activeItem) {
      this.activeItem.div.classList.remove('active');
    }

    this.activeItem = item;
    item.div.classList.add('active');

    if (item === this.selectionChain[0]) {
      this.emit('select-root');
    } else {
      this.emit('select-item', item);
    }
  }

  /**
   * This method removes the given item from the preview. It removes the div from the DOM,
   * removes the draggable, and removes the item from the children list of the center
   * item.
   *
   * @param item The item which should be removed.
   */
  private removeItem(item: IEditorMenuItem) {
    // Remove the child.
    const centerItem = this.getCenterItem();
    const index = centerItem.children.indexOf(item);
    centerItem.children.splice(index, 1);

    // Remove the corresponding draggable.
    const draggable = this.draggables.find((d) => d.getData() === item);
    this.draggables = this.draggables.filter((d) => d.getData() !== item);
    this.dndManager.unregisterDraggable(draggable);

    // Remove the div from the DOM.
    item.div.remove();

    // If it was selected, we select the center item instead.
    if (this.activeItem === item) {
      this.selectItem(centerItem);
    }
  }

  /**
   * This method computes the `computedAngle` properties for the given set of menu items.
   * The `computedAngle` property is the angle of the child relative to its parent. It is
   * computed from the `computedAngle` property of the parent and the optional "fixed"
   * `angle` properties of itself and its siblings.
   *
   * @param items The items for which to setup the angles recursively.
   */
  private computeItemAnglesRecursively(items?: IEditorMenuItem[], parentAngle?: number) {
    if (!items || items.length === 0) {
      return;
    }

    // For all other cases, we have to compute the angles of the children. First, we
    // compute the angle towards the parent item. This will be undefined for the root
    // item.
    const itemAngles = math.computeItemAngles(items, parentAngle);

    // Now we assign the corresponding angles to the children.
    for (let i = 0; i < items.length; ++i) {
      const child = items[i] as IEditorMenuItem;
      child.computedAngle = itemAngles[i];

      // Finally, we recursively setup the angles for the children of the child.
      this.computeItemAnglesRecursively(child.children, utils.getParentAngle(child));
    }
  }

  /**
   * This method is similar to the computeItemAnglesRecursively method. However, it always
   * acts on the children of the currently selected item. In addition, it allows to pass
   * an additional drag and / or drop index. If given, the computed item angles will leave
   * a gap for the to-be-dropped item and ignore the dragged item during the angle
   * computation. If a drop index is given, the method also returns the angle of the
   * to-be-dropped item.
   *
   * @param dragIndex If a child is currently being dragged, this is the index of the
   *   dragged child. It will be ignored when computing the angles.
   * @param dropIndex The index of the location where something is about to be dropped. If
   *   this is given, the method will leave a gap for the to-be-dropped item.
   * @returns The angle of the to-be-dropped item.
   */
  private recomputeItemAngles(dragIndex?: number, dropIndex?: number) {
    const centerItem = this.getCenterItem();

    // If the item has no children, we can stop here.
    if (!centerItem.children || centerItem.children.length === 0) {
      return centerItem.computedAngle ?? 0;
    }

    // Also, if the only child is the dragged child, we can stop here.
    if (centerItem.children.length === 1 && dragIndex === 0) {
      return centerItem.computedAngle ?? 0;
    }

    // We do not need to recompute the angle of the dragged item.
    const items = centerItem.children.filter((_, i) => i !== dragIndex);

    // If no drop index is given, we simply compute the angles as usual.
    if (dropIndex === undefined) {
      this.computeItemAnglesRecursively(items, utils.getParentAngle(centerItem));
      return;
    }

    // For all other cases, we have to compute the angles of the children. First, we
    // compute the angle towards the parent item. This will be undefined for the root
    // item.
    const { itemAngles, dropAngle } = utils.computeItemAnglesWithDropIndex(
      items,
      dropIndex,
      utils.getParentAngle(centerItem)
    );

    // Now we assign the corresponding angles to the children.
    for (let i = 0; i < items.length; ++i) {
      const child = items[i] as IEditorMenuItem;
      child.computedAngle = itemAngles[i];

      // Finally, we recursively setup the angles for the children of the child.
      this.computeItemAnglesRecursively(child.children, utils.getParentAngle(child));
    }

    return dropAngle;
  }
}

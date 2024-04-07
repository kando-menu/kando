//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import Handlebars from 'handlebars';
import { EventEmitter } from 'events';

import * as math from '../../math';
import * as themedIcon from '../common/themed-icon';
import * as utils from './utils';
import { IEditorNode } from '../common/editor-node';
import { Dragger } from '../common/dragger';
import { IVec2, IMenu } from '../../../common';

/**
 * This class is responsible for displaying the menu preview of the editor. It supports
 * navigation through the menu hierarchy by clicking on the menu items in the preview. It
 * also supports the reordering of the menu items by drag'n'drop.
 *
 * It will emit the following events:
 *
 * - 'select-item': This is emitted when a menu item is selected. The event data is the
 *   selected menu item.
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
   * The breadcrumbs are the HTML element which contains the breadcrumbs for the current
   * selection chain. It is a sub-element of the container.
   */
  private breadcrumbs: HTMLElement = null;

  /**
   * This array contains the chain of selected menu items up to the item which is
   * currently shown in the center. The first element is the menu's root, the second
   * element is the selected child of the root (if any), and so on.
   */
  private selectionChain: Array<IEditorNode> = [];

  /**
   * The menu item which has been selected last time. This node has a special style in the
   * preview and its properties are drawn in the property editor on the right.
   */
  private activeNode?: IEditorNode = null;

  /** This is used to drag'n'drop menu items. */
  private dragger = new Dragger();

  /**
   * This is a little div which becomes visible when something is dragged over the
   * preview. This is used to indicate where the dragged item would be dropped.
   */
  private dropIndicator: HTMLElement = null;

  /**
   * This is the position of the preview center. It is used to compute the angles of the
   * menu items during drag'n'drop.
   */
  private previewCenter?: IVec2 = null;

  /**
   * This constructor creates the HTML elements for the menu preview and wires up all the
   * functionality.
   */
  constructor() {
    super();

    const template = Handlebars.compile(require('./templates/preview.hbs').default);

    const div = document.createElement('div');
    div.innerHTML = template({
      areaId: 'kando-menu-preview-area',
      canvasId: 'kando-menu-preview-canvas',
      breadcrumbsId: 'kando-menu-preview-breadcrumbs',
    });

    this.container = div.firstElementChild as HTMLElement;

    // Keep a reference to the 'canvas' element. It is not the HTML5 canvas element, but
    // the element into which the menu items are rendered using HTML and CSS.
    this.canvas = this.container.querySelector(
      '#kando-menu-preview-canvas'
    ) as HTMLElement;

    // Keep a reference to the breadcrumbs element. It is used to display the current
    // selection chain.
    this.breadcrumbs = this.container.querySelector(
      '#kando-menu-preview-breadcrumbs'
    ) as HTMLElement;

    // When the window is resized, we have to recompute the preview center. It is used
    // to compute the angles of the menu items during drag'n'drop.
    window.addEventListener('resize', () => {
      this.previewCenter = utils.computeCenter(this.canvas);
    });

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
      this.computeItemAnglesRecursively(menu.nodes);
      this.selectNode(menu.nodes);
    } else {
      this.hideOldMenuItems();
    }

    // This actually has to be done only once after the menu preview has been added to
    // the DOM and during window resize events. However, we do not have a good place for
    // this, so we do it here.
    this.previewCenter = utils.computeCenter(this.canvas);
  }

  /**
   * This returns the menu item which is currently shown in the center of the preview.
   *
   * @returns The menu node which is currently in the center of the preview.
   */
  private getCenterItem(): IEditorNode {
    return this.selectionChain[this.selectionChain.length - 1];
  }

  /**
   * This returns the parent item of the currently selected item. If the currently
   * selected item is the root item, this method returns null.
   *
   * @returns The parent of the currently selected item or null if the currently selected
   *   item is the root item.
   */
  private getParentItem(): IEditorNode | null {
    return this.selectionChain[this.selectionChain.length - 2] ?? null;
  }

  /** This method initializes the drag'n'drop functionality of the menu preview. */
  private initDragAndDrop() {
    let dropIndex: number | null = null;
    let dropTarget: IEditorNode | null = null;
    let dragIndex: number | null = null;
    let dragOverPreview = false;

    const dragEnter = () => {
      dragOverPreview = true;
    };

    const dragLeave = () => {
      dragOverPreview = false;
      dropIndex = null;
    };

    this.dragger.on('mouse-down', (node, itemDiv) => {
      itemDiv.classList.add('clicking');
    });

    this.dragger.on('mouse-up', (node, itemDiv) => {
      itemDiv.classList.remove('clicking');
    });

    // This is called when a menu item is started to be dragged. Menu items without fixed
    // angles can be dragged freely around and will be detached from the parent menu
    // during the drag. Items with fixed angles cannot be dragged freely but will only
    // rotate around the parent menu item.
    this.dragger.on('drag-start', (node, itemDiv) => {
      document.body.style.cursor = 'grabbing';

      // If the node has a fixed angle, we do nothing. In this case, the item will be
      // rotated during the drag-move listener further down.
      if (node.angle !== undefined) {
        return;
      }

      // Store the index of the dragged child. We need this to re-add the child to the
      // correct position when the drag operation is aborted.
      const centerItem = this.getCenterItem();
      dragIndex = centerItem.children.indexOf(node);

      // Remove the dragged child from parent's children.
      const index = centerItem.children.indexOf(node);
      centerItem.children.splice(index, 1);

      itemDiv.classList.add('dragging');

      dragOverPreview = true;
      this.container.addEventListener('pointerenter', dragEnter);
      this.container.addEventListener('pointerleave', dragLeave);
    });

    // This is called when a menu item is dragged around. Menu items without fixed angles
    // will be moved around freely. If the item has a fixed angle, it will be rotated
    // around the parent menu item.
    this.dragger.on('drag-move', (node, itemDiv, relative, absolute) => {
      // Compute the angle towards the dragged item.
      const relativePosition = math.subtract(absolute, this.previewCenter);
      const dragAngle = math.getAngle(relativePosition);
      const centerItem = this.getCenterItem();

      // If the node has a fixed angle, we cannot move it around freely. Instead, we
      // update its fixed angle when it's dragged around. For now, we limit the movement
      // to 15 degree steps.
      if (node.angle !== undefined) {
        node.angle = Math.round(dragAngle / 15) * 15;

        // Within the list of children, the fixed angles must by monotonically increasing.
        // That means that we may have to reorder the children if the node is dragged
        // beyond the next or previous child with a fixed angle.
        let index = centerItem.children.indexOf(node);

        // First, we search for the child with the largest fixed angle which is smaller
        // than the angle of the dragged node. For this, we iterate the children list from
        // the back. If we find any, we have to move the dragged node to the next position.
        for (let i = centerItem.children.length - 1; i > index; --i) {
          const child = centerItem.children[i];
          if (child.angle !== undefined && child.angle < node.angle) {
            centerItem.children.splice(index, 1);
            centerItem.children.splice(i, 0, node);
            index = i;
            break;
          }
        }

        // Second, we search for the child with the smallest fixed angle which is larger
        // than the angle of the dragged node.
        for (let i = 0; i < index; ++i) {
          const child = centerItem.children[i];
          if (child.angle !== undefined && child.angle > node.angle) {
            centerItem.children.splice(index, 1);
            centerItem.children.splice(i, 0, node);
            break;
          }
        }

        this.recomputeItemAngles();
        this.updateAllPositions();
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
        const result = utils.computeDropTarget(centerItem, dragAngle);

        // If the returned drop target is null, it is supposed to be dropped on the
        // parent item.
        newDropTarget = result.dropTarget ?? this.getParentItem();
        newDropIndex = result.dropIndex;
      }

      if (newDropTarget !== dropTarget || newDropIndex !== dropIndex) {
        dropIndex = newDropIndex;
        dropTarget = newDropTarget;

        if (dropTarget === centerItem) {
          node.computedAngle = this.recomputeItemAngles(dropIndex);
          this.computeItemAnglesRecursively(node);
          this.updateChildPosition(node);
        } else {
          this.recomputeItemAngles();
        }
      }

      // Move the drop indicator either to the submenu, to the back-navigation link, or to
      // the drop index position.
      const parentItem = this.getParentItem();

      if (dropTarget === parentItem) {
        this.updateDropIndicatorPosition(utils.getParentAngle(centerItem));
      } else if (dropTarget === centerItem) {
        this.updateDropIndicatorPosition(node.computedAngle);
      } else if (dropTarget !== null) {
        this.updateDropIndicatorPosition(dropTarget.computedAngle);
      }

      // We show the drop indicator if something is dragged over the preview and if there
      // is a potential drop location.
      if (dragOverPreview && dropIndex !== null) {
        this.dropIndicator.classList.add('visible');
      } else {
        this.dropIndicator.classList.remove('visible');
      }

      this.updateAllPositions();
    });

    // This is called when a drag operation is finished. This happens either when the
    // dragged item is dropped or when the drag operation is aborted.
    const onDragEnd = (itemDiv: HTMLElement) => {
      // Reset the position of the dragged div.
      document.body.style.cursor = '';
      itemDiv.style.left = '';
      itemDiv.style.top = '';
      itemDiv.classList.remove('dragging');

      // Hide the drop indicator.
      this.dropIndicator.classList.remove('visible');
      this.container.removeEventListener('pointerenter', dragEnter);
      this.container.removeEventListener('pointerleave', dragLeave);
    };

    // This is called when a menu item is dropped.
    this.dragger.on('drag-end', (node, itemDiv) => {
      // If the node has a fixed angle, we do nothing. In this case, the item was only
      // rotated during the drag operation but not removed from the parent menu.
      if (node.angle !== undefined) {
        return;
      }

      // Reset the position of the dragged div and hide the drop indicator.
      onDragEnd(itemDiv);

      // We check whether the node has been dropped into a submenu, or into the parent
      // node. In both cases, the node div is removed from the DOM and the menu item is
      // added to the children of the drop target.
      const centerItem = this.getCenterItem();

      if (dropTarget && dropTarget !== centerItem) {
        dropTarget.children.push(node);
        this.computeItemAnglesRecursively(dropTarget);

        // Remove the dragged item from the DOM.
        itemDiv.remove();

        dropIndex = null;
        dragIndex = null;

        this.updateAllPositions();

        return;
      }

      // If the node has been dropped on the canvas, we add it to the children of the
      // center item at the correct position. If there is currently no drop index, we
      // drop the item where it was before.
      if (dropIndex !== null || dragIndex !== null) {
        centerItem.children.splice(dropIndex ?? dragIndex, 0, node);
        dropIndex = null;
        dragIndex = null;
      }

      // In any case, we redraw the menu.
      this.recomputeItemAngles();
      this.updateAllPositions();
    });

    // This is called when a drag operation is aborted. The dragged item is re-added to the
    // parent menu.
    this.dragger.on('drag-cancel', (node, itemDiv) => {
      // If the node has a fixed angle, we do nothing. In this case, the item was only
      // rotated during the drag operation but not removed from the parent menu.
      if (node.angle !== undefined) {
        return;
      }

      // Reset the position of the dragged div and hide the drop indicator.
      onDragEnd(itemDiv);

      // We simply drop the item where it was before.
      if (dragIndex !== null) {
        this.getCenterItem().children.splice(dragIndex, 0, node);
        dropIndex = null;
        dragIndex = null;
      }

      // Finally, redraw the menu.
      this.recomputeItemAngles();
      this.updateAllPositions();
    });

    // Select a node when it is clicked.
    this.dragger.on('click', (node) => {
      this.selectNode(node);
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
  private redrawMenu(transitionAngle: number) {
    // Sanity check: If the selection chain is empty, we do nothing.
    if (this.selectionChain.length === 0) {
      return;
    }

    // This node is drawn in the center of the preview.
    const centerItem = this.getCenterItem();

    // First, fade out all currently displayed menu items.
    const transitionDirection = math.getDirection(transitionAngle, 1.0);
    this.hideOldMenuItems(transitionDirection);

    // Now we create a new container for the new menu items.
    const container = document.createElement('div');
    container.classList.add('kando-menu-preview-container');
    container.style.setProperty('--dir-x', -transitionDirection.x + '');
    container.style.setProperty('--dir-y', -transitionDirection.y + '');
    this.canvas.appendChild(container);

    // The big center div shows the icon of the currently selected menu.
    centerItem.itemDiv = utils.createCenterDiv(centerItem);
    container.appendChild(centerItem.itemDiv);

    // Make the center item selectable.
    centerItem.itemDiv.addEventListener('click', () => this.selectNode(centerItem));
    centerItem.itemDiv.addEventListener('mousedown', () => {
      centerItem.itemDiv.classList.add('clicking');
    });

    centerItem.itemDiv.addEventListener('mouseup', () => {
      centerItem.itemDiv.classList.remove('clicking');
    });

    // Add the children of the currently selected menu.
    if (centerItem.children?.length > 0) {
      centerItem.children.forEach((c) => {
        const child = c as IEditorNode;

        // Create a div for the child.
        child.itemDiv = utils.createChildDiv(child);
        container.appendChild(child.itemDiv);

        // Create the fixed-angle lock.
        const lock = utils.createLockDiv(child.angle !== undefined, (locked) => {
          if (locked) {
            child.angle = child.computedAngle;
          } else {
            child.angle = undefined;
            this.recomputeItemAngles();
            this.updateAllPositions();
          }
        });
        child.itemDiv.appendChild(lock);

        // Make the child div selectable and draggable.
        this.dragger.addDraggable(child.itemDiv, child);
      });
    }

    // If we are currently showing a submenu, we add the back navigation link towards
    // the direction of the parent menu.
    if (this.selectionChain.length > 1) {
      const parent = this.selectionChain[this.selectionChain.length - 2];
      this.backlink = document.createElement('div');
      this.backlink.classList.add('kando-menu-preview-backlink');
      this.backlink.appendChild(
        themedIcon.createDiv('arrow_back', 'material-symbols-rounded')
      );
      container.appendChild(this.backlink);

      // Make the back link selectable.
      this.backlink.addEventListener('click', () => this.selectNode(parent));
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
   * This method is called whenever the selection chain changes. It redraws the
   * breadcrumbs to display the current selection chain.
   */
  private redrawBreadcrumbs() {
    this.breadcrumbs.innerHTML = '';

    // Then we add the breadcrumbs for the current selection chain.
    this.selectionChain.forEach((node) => {
      const breadcrumb = document.createElement('div');
      breadcrumb.classList.add('kando-menu-preview-breadcrumb');
      breadcrumb.textContent = node.name;
      this.breadcrumbs.appendChild(breadcrumb);

      breadcrumb.addEventListener('click', () => this.selectNode(node));
    });
  }

  /**
   * This method fades out all currently visible menu items and removes them from the DOM.
   * If a transition direction is given, the menu items are moved in this direction during
   * the fade-out animation.
   *
   * @param transitionDirection The direction in which the old menu items should be moved.
   */
  private hideOldMenuItems(transitionDirection?: IVec2) {
    this.canvas.childNodes.forEach((c) => {
      const child = c as HTMLElement;
      if (
        c instanceof HTMLElement &&
        child.classList.contains('visible') &&
        child.classList.contains('kando-menu-preview-container')
      ) {
        child.classList.remove('visible');

        if (transitionDirection) {
          child.style.setProperty('--dir-x', transitionDirection.x + '');
          child.style.setProperty('--dir-y', transitionDirection.y + '');
        }

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
   * @param child The child node for which to update the position.
   */
  private updateChildPosition(child: IEditorNode) {
    // Set the CSS variables for the position and rotation of the child.
    const position = math.getDirection(child.computedAngle, 1.0);
    child.itemDiv.style.setProperty('--rotation', child.computedAngle + 'deg');
    child.itemDiv.style.setProperty('--dir-x', position.x + '');
    child.itemDiv.style.setProperty('--dir-y', position.y + '');

    // Set the CSS variables for the position and rotation of the label.
    const labelDivContainer = child.itemDiv.querySelector(
      '.kando-menu-preview-label-container'
    ) as HTMLElement;
    labelDivContainer.style.setProperty('--rotation', child.computedAngle + 'deg');

    labelDivContainer.classList.remove('left');
    labelDivContainer.classList.remove('right');
    labelDivContainer.classList.remove('top');
    labelDivContainer.classList.remove('bottom');

    if (position.x < -0.001) labelDivContainer.classList.add('left');
    else if (position.x > 0.001) labelDivContainer.classList.add('right');
    else if (position.y < 0) labelDivContainer.classList.add('top');
    else labelDivContainer.classList.add('bottom');

    // If the child has grandchildren, also position them in a circle around the child.
    if (child.type === 'submenu') {
      const grandChildContainer = child.itemDiv.querySelector(
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
          (grandChild as IEditorNode).computedAngle + 'deg'
        );
      });
    }
  }

  /**
   * This method updates the CSS variables for the position of the drop indicator.
   *
   * @param angle The angle of the to-be-dropped item.
   */
  private updateDropIndicatorPosition(angle: number) {
    const position = math.getDirection(angle, 1.0);
    this.dropIndicator.style.setProperty('--dir-x', position.x + '');
    this.dropIndicator.style.setProperty('--dir-y', position.y + '');
  }

  /**
   * This method is called when a menu item is selected. If the menu item has children,
   * the node is pushed to the selection chain and the preview is redrawn. In any case,
   * the 'select' event is emitted.
   *
   * @param node The node which has been selected.
   */
  private selectNode(node: IEditorNode) {
    // Only submenus can be part of the selection chain.
    if (node.type === 'submenu') {
      // If the node is already the last one in the selection chain, we do nothing. If it
      // is not the last one but somewhere else in the selection chain, we remove all
      // nodes after it. If it is not in the selection chain at all, we add it to the end.
      const index = this.selectionChain.indexOf(node);
      if (index >= 0 && index < this.selectionChain.length - 1) {
        const lastSelected = this.selectionChain[index + 1];
        this.selectionChain.splice(index + 1);
        this.redrawMenu(lastSelected.computedAngle);
        this.redrawBreadcrumbs();
      } else if (index === -1) {
        this.selectionChain.push(node);
        this.redrawMenu(node.computedAngle + 180);
        this.redrawBreadcrumbs();
      }
    }

    if (this.activeNode) {
      this.activeNode.itemDiv.classList.remove('active');
    }

    this.activeNode = node;
    node.itemDiv.classList.add('active');

    this.emit('select-item', node);
  }

  /**
   * This method computes the `computedAngle` properties for the children of the given
   * node. The `computedAngle` property is the angle of the child relative to its parent.
   * It is computed from the `computedAngle` property of the parent and the optional
   * "fixed" `angle` properties of itself and its siblings.
   *
   * @param node The node for which to setup the angles recursively.
   */
  private computeItemAnglesRecursively(node: IEditorNode) {
    // If the node has no children, we can stop here.
    if (!node.children || node.children.length === 0) {
      return;
    }

    // For all other cases, we have to compute the angles of the children. First, we
    // compute the angle towards the parent node. This will be undefined for the root
    // node.
    const itemAngles = math.computeItemAngles(node.children, utils.getParentAngle(node));

    // Now we assign the corresponding angles to the children.
    for (let i = 0; i < node.children?.length; ++i) {
      const child = node.children[i] as IEditorNode;
      child.computedAngle = itemAngles[i];

      // Finally, we recursively setup the angles for the children of the child.
      this.computeItemAnglesRecursively(child);
    }
  }

  /**
   * This method is similar to the computeItemAnglesRecursively method. However, it always
   * acts on the children of the currently selected node. In addition, it allows to pass
   * an additional drop index. The computed item angles will leave a gap for the
   * to-be-dropped item. If a drop index is given, the method also returns the angle of
   * the to-be-dropped item.
   *
   * @param dropIndex The index of the location where something is about to be dropped.
   * @returns The angle of the to-be-dropped item.
   */
  private recomputeItemAngles(dropIndex?: number) {
    const centerItem = this.getCenterItem();

    // If the node has no children, we can stop here.
    if (!centerItem.children || centerItem.children.length === 0) {
      return;
    }

    // If no drop index is given, we simply compute the angles as usual.
    if (dropIndex === undefined) {
      this.computeItemAnglesRecursively(centerItem);
      return;
    }

    // For all other cases, we have to compute the angles of the children. First, we
    // compute the angle towards the parent node. This will be undefined for the root
    // node.
    const { itemAngles, dropAngle } = utils.computeItemAnglesWithDropIndex(
      centerItem.children,
      dropIndex,
      utils.getParentAngle(centerItem)
    );

    // Now we assign the corresponding angles to the children.
    for (let i = 0; i < centerItem.children?.length; ++i) {
      const child = centerItem.children[i] as IEditorNode;
      child.computedAngle = itemAngles[i];

      // Finally, we recursively setup the angles for the children of the child.
      this.computeItemAnglesRecursively(child);
    }

    return dropAngle;
  }
}

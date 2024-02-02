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
import * as utils from './utils';
import { IEditorNode } from '../editor-node';
import { ItemDragger } from '../common/item-dragger';
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
  private itemDragger = new ItemDragger();

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
      containerId: 'kando-menu-preview-container',
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
   * initially from the editor for the root menu.
   */
  public setMenu(menu: IMenu) {
    this.selectionChain = [];
    this.computeItemAnglesRecursively(menu.nodes);
    this.selectNode(menu.nodes);

    // This actually has to be done only once after the menu preview has been added to
    // the DOM. However, we do not have a good place for this, so we do it here.
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

  /** This method initializes the drag'n'drop functionality of the menu preview. */
  private initDragAndDrop() {
    let dropIndex: number | null = null;
    let dragIndex: number | null = null;
    let dragOverPreview = false;
    let dropWedges: { start: number; end: number }[] | null = null;

    const dragEnter = () => {
      dragOverPreview = true;
    };

    const dragLeave = () => {
      dragOverPreview = false;
      dropIndex = null;
    };

      document.body.style.cursor = 'grabbing';
      // Store the index of the dragged child. We need this to re-add the child to the
      // correct position when the drag operation is aborted.
      const centerItem = this.getCenterItem();
      dragIndex = centerItem.children.indexOf(node);

      // Remove the dragged child from parent's children.
      const index = centerItem.children.indexOf(node);
      centerItem.children.splice(index, 1);

      dragOverPreview = true;
      this.canvas.addEventListener('pointerenter', dragEnter);
      this.canvas.addEventListener('pointerleave', dragLeave);
    });

    // This is called when a menu item is dragged around.
    this.itemDragger.on('drag-move', (node, itemDiv, targetDiv, relative, absolute) => {
      // Update the position of the dragged div.
      itemDiv.style.left = `${relative.x}px`;
      itemDiv.style.top = `${relative.y}px`;

      // Compute the angle towards the dragged item.
      const relativePosition = math.subtract(absolute, this.previewCenter);
      const dragAngle = math.getAngle(relativePosition);

      // If something is dragged over the preview, we compute the index where the item
      // would be dropped. The child items will be re-arranged to leave a gap for the
      // to-be-dropped item.
      if (dragOverPreview) {
        if (dropWedges === null) {
          const centerItem = this.getCenterItem();
          const childAngles = centerItem.children.map(
            (c) => (c as IEditorNode).computedAngle
          );

          // If the drag started on the preview, the dragged item is not in the list of
          // children. We have to add it to the list of child angles to compute the drop
          // wedges correctly.
          if (dragIndex !== null) {
            childAngles.push(node.computedAngle);
            childAngles.sort((a, b) => a - b);
          }

          dropWedges = math.computeItemWedges(
            childAngles,
            utils.getParentAngle(centerItem)
          );

          // In order to allow dropping into submenus, we reduce the size of the drop-zone
          // wedges of submenus. We move the edge which is closest to the drag angle a bit
          // away, up to the center of the wedge. Consequently, the corresponding submenu
          // item will only dodge the dragged item once the cursor passes the center of the
          // wedge.
          centerItem.children.forEach((c) => {
            const child = c as IEditorNode;
            if (child.type === 'submenu') {
              // Find the wedge of this item.
              const wedge = dropWedges.find((w) =>
                math.isAngleBetween(child.computedAngle, w.start, w.end)
              );

              // Move the edge which is closest to the drag angle to the center of the wedge.
              if (
                math.getAngularDifference(dragAngle, wedge.start) <
                math.getAngularDifference(dragAngle, wedge.end)
              ) {
                wedge.start = child.computedAngle;
              } else {
                wedge.end = child.computedAngle;
              }
            }
          });
        }

        // Choose the drop index from the drop wedges. This will be negative if the
        // pointer is not inside any of the wedges.
        const newDropIndex = utils.computeDropIndex(dropWedges, dragAngle);

        if (newDropIndex >= 0 && newDropIndex !== dropIndex) {
          dropIndex = newDropIndex;
          dropWedges = null;

          node.computedAngle = this.recomputeItemAngles(dropIndex);
          this.computeItemAnglesRecursively(node);

          // Make sure that the grand children of the dragged item are also updated.
          this.updateChildPosition(node);
        }
      } else {
        this.recomputeItemAngles();
      }

      // Move the drop indicator either to the submenu, to the back-navigation link, or to
      // the drop index position.
      const submenuNode = this.belongsToSubmenu(targetDiv);
      const parentNode = this.belongsToBacklink(targetDiv);

      if (submenuNode) {
        this.updateDropIndicatorPosition(submenuNode.computedAngle);
      } else if (parentNode) {
        this.updateDropIndicatorPosition(utils.getParentAngle(this.getCenterItem()));
      } else {
        this.updateDropIndicatorPosition(node.computedAngle);
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

    // This is called when a menu item is dropped.
    this.itemDragger.on('drag-end', (node, itemDiv, targetDiv) => {
      document.body.style.cursor = '';
      // Reset the position of the dragged div.
      itemDiv.style.left = '';
      itemDiv.style.top = '';

      dropWedges = null;

      // Hide the drop indicator.
      this.dropIndicator.classList.remove('visible');
      this.canvas.removeEventListener('pointerenter', dragEnter);
      this.canvas.removeEventListener('pointerleave', dragLeave);

      // Check whether the target div is a submenu item or the back-navigation link. If
      // so, we drop the dragged item into the submenu or the parent menu respectively.
      const submenuNode = this.belongsToSubmenu(targetDiv);
      const parentNode = this.belongsToBacklink(targetDiv);

      if (submenuNode) {
        submenuNode.children.push(node);
        this.recomputeItemAngles();
      } else if (parentNode) {
        parentNode.children.push(node);
        this.computeItemAnglesRecursively(parentNode);
      }

      if (submenuNode || parentNode) {
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
        this.getCenterItem().children.splice(dropIndex ?? dragIndex, 0, node);
        dropIndex = null;
        dragIndex = null;
      }

      // In any case, we redraw the menu.
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
  private redrawMenu(transitionAngle: number) {
    // Sanity check: If the selection chain is empty, we do nothing.
    if (this.selectionChain.length === 0) {
      return;
    }

    // This node is drawn in the center of the preview.
    const centerItem = this.getCenterItem();

    // First, fade out all currently displayed menu items.
    const transitionDirection = math.getDirection(transitionAngle, 1.0);

    this.canvas.childNodes.forEach((c) => {
      const child = c as HTMLElement;
      if (
        c instanceof HTMLElement &&
        child.classList.contains('visible') &&
        child.classList.contains('kando-menu-preview-container')
      ) {
        child.classList.remove('visible');
        child.style.setProperty('--dir-x', transitionDirection.x + '');
        child.style.setProperty('--dir-y', transitionDirection.y + '');

        // After the animation is finished, we remove the menu item from the DOM.
        setTimeout(() => c.remove(), 500);
      }
    });

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

    // Add the children of the currently selected menu.
    if (centerItem.children?.length > 0) {
      centerItem.children.forEach((c) => {
        const child = c as IEditorNode;

        // Create a div for the child.
        child.itemDiv = utils.createChildDiv(child);
        container.appendChild(child.itemDiv);

        // If the child is selected, push its index to the selection chain.
        child.itemDiv.addEventListener('click', () => this.selectNode(child));

        // Make the child div draggable.
        this.itemDragger.addDraggable(child.itemDiv, child);
      });
    }

    // If we are currently showing a submenu, we add the back navigation link towards
    // the direction of the parent menu.
    if (this.selectionChain.length > 1) {
      const parent = this.selectionChain[this.selectionChain.length - 2];
      this.backlink = document.createElement('div');
      this.backlink.classList.add('kando-menu-preview-backlink');
      this.backlink.appendChild(
        utils.createIcon('arrow_back', 'material-symbols-rounded')
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
   * This method is called during drag'n'drop to find whether a div below the cursor
   * belongs to an menu item which represents a submenu. If so, the corresponding node is
   * returned.
   *
   * @param div A div which is potentially nested inside a submenu item.
   * @returns The node which represents the submenu item or null if the div is not nested
   *   inside a submenu item.
   */
  private belongsToSubmenu(div: HTMLElement): IEditorNode {
    const targetItemDiv = utils.getParentWithClass(div, 'kando-menu-preview-child');

    if (targetItemDiv) {
      const targetNode = this.getCenterItem().children.find(
        (c) => (c as IEditorNode).itemDiv === targetItemDiv
      ) as IEditorNode;

      if (targetNode && targetNode.type === 'submenu') {
        return targetNode;
      }
    }

    return null;
  }

  /**
   * This method is called during drag'n'drop to find whether a div below the cursor
   * belongs to the back link. If so, the parent node is returned.
   *
   * @param div A div which is potentially nested inside the back link.
   * @returns The parent node or null if the div is not nested inside the back link.
   */
  private belongsToBacklink(div: HTMLElement): IEditorNode {
    if (utils.getParentWithClass(div, 'kando-menu-preview-backlink') !== null) {
      return this.selectionChain[this.selectionChain.length - 2];
    }

    return null;
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

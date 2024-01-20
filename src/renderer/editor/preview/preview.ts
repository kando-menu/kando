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
import { IEditorNode } from '../editor-node';
import { ItemDragger } from '../common/item-dragger';

/**
 * This class is responsible for displaying the menu preview of the editor. It supports
 * navigation through the menu hierarchy by clicking on the menu items in the preview. It
 * also supports the reordering of the menu items by drag'n'drop.
 *
 * It will emit the following events:
 *
 * - 'select': This is emitted when a menu item is selected. The event data is the selected
 *   menu item.
 */
export class Preview extends EventEmitter {
  // The container is the HTML element which contains the menu preview. It is created in
  // the constructor and returned by the getContainer() method.
  private container: HTMLElement = null;

  // The canvas is the HTML element which contains the menu items. It is a sub-element
  // of the container. The intermediate elements are used to center the preview and to
  // create a fixed aspect ratio.
  private canvas: HTMLElement = null;

  // The breadcrumbs are the HTML element which contains the breadcrumbs for the current
  // selection chain. It is a sub-element of the container.
  private breadcrumbs: HTMLElement = null;

  // This array contains the chain of selected menu items up to the item which is
  // currently shown in the center. The first element is the menu's root, the second
  // element is the selected child of the root (if any), and so on.
  private selectionChain: Array<IEditorNode> = [];

  // The menu item which has been selected last time. This node has a special style in
  // the preview and its properties are drawn in the property editor on the right.
  private activeNode?: IEditorNode = null;

  private itemDragger = new ItemDragger();

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

    this.itemDragger.on('drag-start', (node) => {
      // This node is drawn in the center of the preview.
      const centerItem = this.selectionChain[this.selectionChain.length - 1];

      // Remove the child from parent's children.
      const index = centerItem.children.indexOf(node);

      if (index >= 0) {
        centerItem.children.splice(index, 1);

        // Update the angles of the children.
        this.setupAngles(centerItem);
        this.updateItemAngles();
      }
    });

    this.itemDragger.on('drag-end', (node, div) => {
      div.style.transform = '';
    });

    this.itemDragger.on('drag-move', (node, div, offset) => {
      div.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(0.9)`;
    });
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
  public setMenu(root: IEditorNode) {
    this.selectionChain = [];
    this.setupAngles(root);
    this.selectNode(root);
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
    const centerItem = this.selectionChain[this.selectionChain.length - 1];

    // First, fade out all currently displayed menu items.
    const transitionDirection = math.getDirection(transitionAngle + 90, 1.0);

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
    centerItem.itemDiv = this.createCenterDiv(centerItem);
    container.appendChild(centerItem.itemDiv);

    // Add the children of the currently selected menu.
    if (centerItem.children?.length > 0) {
      centerItem.children.forEach((c) => {
        const child = c as IEditorNode;

        // Create a div for the child.
        child.itemDiv = this.createChildDiv(child);
        container.appendChild(child.itemDiv);

        // Make the child div draggable.
        this.itemDragger.addDraggable(child.itemDiv, child);
      });
    }

    // If we are currently showing a submenu, we add the back navigation link towards
    // the direction of the parent menu.
    if (this.selectionChain.length > 1) {
      const parent = this.selectionChain[this.selectionChain.length - 2];
      const position = math.getDirection(centerItem.computedAngle - 90, 1.0);

      const backDiv = document.createElement('div');
      backDiv.classList.add('kando-menu-preview-backlink');
      backDiv.style.setProperty('--rotation', centerItem.computedAngle - 90 + 'deg');
      backDiv.style.setProperty('--dir-x', position.x + '');
      backDiv.style.setProperty('--dir-y', position.y + '');
      backDiv.appendChild(this.createIcon('arrow_back', 'material-symbols-rounded'));
      container.appendChild(backDiv);

      // Make the back link selectable.
      backDiv.addEventListener('click', () => this.selectNode(parent));
    }

    // Now we update the angles of all children.
    this.updateItemAngles();

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
   * visible menu items.
   */
  private updateItemAngles() {
    // This node is drawn in the center of the preview.
    const centerItem = this.selectionChain[this.selectionChain.length - 1];

    // Position the children of the currently selected menu in a circle around the center.
    if (centerItem.children?.length > 0) {
      centerItem.children.forEach((c) => {
        const child = c as IEditorNode;

        // Compute the direction towards the child.
        const position = math.getDirection(child.computedAngle - 90, 1.0);

        // Set the CSS variables for the position and rotation of the child.
        child.itemDiv.style.setProperty('--rotation', child.computedAngle - 90 + 'deg');
        child.itemDiv.style.setProperty('--dir-x', position.x + '');
        child.itemDiv.style.setProperty('--dir-y', position.y + '');

        // Set the CSS variables for the position and rotation of the label.
        const labelDivContainer = child.itemDiv.querySelector(
          '.kando-menu-preview-label-container'
        ) as HTMLElement;

        labelDivContainer.style.setProperty(
          '--rotation',
          child.computedAngle - 90 + 'deg'
        );

        // Remove all previous position classes from the label div container.
        labelDivContainer.classList.remove('left');
        labelDivContainer.classList.remove('right');
        labelDivContainer.classList.remove('top');
        labelDivContainer.classList.remove('bottom');

        // Add the correct position class.
        if (position.x < -0.001) labelDivContainer.classList.add('left');
        else if (position.x > 0.001) labelDivContainer.classList.add('right');
        else if (position.y < 0) labelDivContainer.classList.add('top');
        else labelDivContainer.classList.add('bottom');

        // If the child has children, also position them in a circle around the child.
        if (child.children?.length > 0) {
          const grandChildrenDivs = child.itemDiv.querySelectorAll(
            '.kando-menu-preview-grandchild'
          ) as NodeListOf<HTMLElement>;

          child.children.forEach((grandChild, i) => {
            grandChildrenDivs[i].style.setProperty(
              '--rotation',
              (grandChild as IEditorNode).computedAngle - 90 + 'deg'
            );
          });
        }
      });
    }
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
        this.redrawMenu(lastSelected.computedAngle + 180);
        this.redrawBreadcrumbs();
      } else if (index === -1) {
        this.selectionChain.push(node);
        this.redrawMenu(node.computedAngle);
        this.redrawBreadcrumbs();
      }
    }

    if (this.activeNode) {
      this.activeNode.itemDiv.classList.remove('active');
    }

    this.activeNode = node;
    node.itemDiv.classList.add('active');

    this.emit('select', node);
  }

  /**
   * This method creates a div which contains an icon. The icon is created using the
   * 'material-symbols-rounded' or 'simple-icons' font.
   *
   * @param icon The name of the icon to create.
   * @param theme The name of the icon theme to use.
   * @returns A HTML element which contains the icon.
   */
  private createIcon(icon: string, theme: string) {
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('kando-menu-preview-icon-container');

    const iconDiv = document.createElement('i');
    containerDiv.appendChild(iconDiv);

    if (theme === 'material-symbols-rounded') {
      iconDiv.classList.add(theme);
      iconDiv.innerHTML = icon;
    } else if (theme === 'simple-icons') {
      iconDiv.classList.add('si');
      iconDiv.classList.add('si-' + icon);
    }

    return containerDiv;
  }

  /**
   * This method creates the big center div which shows the icon of the currently selected
   * menu.
   *
   * @param node The node for which to create the center div.
   */
  private createCenterDiv(node: IEditorNode) {
    const div = document.createElement('div');
    div.classList.add('kando-menu-preview-center');
    div.appendChild(this.createIcon(node.icon, node.iconTheme));

    // Make the center item selectable.
    div.addEventListener('click', () => this.selectNode(node));

    return div;
  }

  /**
   * This method creates a div visualizing a child node. It contains an icon, potentially
   * grandchildren, and a label.
   *
   * @param node The node for which to create the child div.
   */
  private createChildDiv(node: IEditorNode) {
    const div = document.createElement('div');
    div.classList.add('kando-menu-preview-child');

    // If the child is selected, push its index to the selection chain.
    div.addEventListener('click', () => this.selectNode(node));

    // Add the icon of the child.
    div.appendChild(this.createIcon(node.icon, node.iconTheme));

    // If the child has children, we add little grandchild divs to the child div.
    if (node.children?.length > 0) {
      const grandChildContainer = document.createElement('div');
      grandChildContainer.classList.add('kando-menu-preview-grandchild-container');
      div.appendChild(grandChildContainer);

      node.children.forEach(() => {
        const grandChildDiv = document.createElement('div');
        grandChildDiv.classList.add('kando-menu-preview-grandchild');
        grandChildContainer.appendChild(grandChildDiv);
      });
    }

    // Add a label to the child div. This is used to display the name of the menu
    // item. The label shows a connector line to the child div.
    const labelDivContainer = document.createElement('div');
    labelDivContainer.classList.add('kando-menu-preview-label-container');
    div.appendChild(labelDivContainer);

    // The actual label is in a nested div. This is used to ellipsize the text if
    // it is too long.
    const labelDiv = document.createElement('div');
    labelDiv.classList.add('kando-menu-preview-label');
    labelDiv.classList.add('kando-font');
    labelDiv.classList.add('fs-3');
    labelDiv.textContent = node.name;
    labelDivContainer.appendChild(labelDiv);

    return div;
  }

  /**
   * This method computes the `computedAngle` properties for the children of the given
   * node. The `computedAngle` property is the angle of the child relative to its parent.
   * It is computed from the `computedAngle` property of the parent and the optional
   * "fixed" `angle` properties of itself and its siblings.
   *
   * @param node The node for which to setup the angles recursively.
   */
  private setupAngles(node: IEditorNode) {
    // If the node has no children, we can stop here.
    if (!node.children || node.children.length === 0) {
      return;
    }

    // For all other cases, we have to compute the angles of the children. First, we
    // compute the angle towards the parent node. This will be undefined for the root
    // node.
    const parentAngle = (node.computedAngle + 180) % 360;
    const angles = math.computeItemAngles(node.children, parentAngle);

    // Now we assign the corresponding angles to the children.
    for (let i = 0; i < node.children?.length; ++i) {
      const child = node.children[i] as IEditorNode;
      child.computedAngle = angles[i];

      // Finally, we recursively setup the angles for the children of the child.
      this.setupAngles(child);
    }
  }
}

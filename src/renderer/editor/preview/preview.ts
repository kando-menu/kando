//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import Handlebars from 'handlebars';

import * as math from '../../math';
import { IEditorNode } from '../editor-node';

/**
 * This class is responsible for displaying the menu preview of the editor. It supports
 * navigation through the menu hierarchy by clicking on the menu items in the preview. It
 * also supports the reordering of the menu items by drag'n'drop.
 */
export class Preview {
  // The container is the HTML element which contains the menu preview. It is created in
  // the constructor and returned by the getContainer() method.
  private container: HTMLElement = null;

  // The canvas is the HTML element which contains the menu items. It is a sub-element
  // of the container. The intermediate elements are used to center the preview and to
  // create a fixed aspect ratio.
  private canvas: HTMLElement = null;

  // The root of the menu which is currently displayed in the preview.
  private root: IEditorNode = null;

  // This array contains the indices of the currently selected menu items. The first
  // element is the index of the a child of the root node, the second element is the
  // index of a child of the first child of the root node, etc.
  private selectionChain: Array<number> = [];

  /**
   * This constructor creates the HTML elements for the menu preview and wires up all the
   * functionality.
   */
  constructor() {
    const template = Handlebars.compile(require('./templates/preview.hbs').default);

    const div = document.createElement('div');
    div.innerHTML = template({
      containerId: 'kando-menu-preview-container',
      canvasId: 'kando-menu-preview-canvas',
    });

    this.container = div.firstElementChild as HTMLElement;

    // Keep a reference to the 'canvas' element. It is not the HTML5 canvas element, but
    // the element into which the menu items are rendered using HTML and CSS.
    this.canvas = this.container.querySelector(
      '#kando-menu-preview-canvas'
    ) as HTMLElement;
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
  public setMenu(menu: IEditorNode) {
    this.root = menu;
    this.selectionChain = [];
    this.setupAngles(this.root);
    this.update();
  }

  /**
   * This method is called whenever a new (sub-)menu should be displayed. All currently
   * displayed menu items are removed and the new ones are added. A subtle animation is
   * used to indicate the change.
   */
  private update() {
    this.canvas.innerHTML = '';

    const menu = this.getSelected();

    if (menu) {
      const centerDiv = document.createElement('div');
      centerDiv.classList.add('kando-menu-preview-center');
      this.canvas.appendChild(centerDiv);

      const icon = this.createIcon(menu.icon, menu.iconTheme);
      centerDiv.appendChild(icon);

      menu.children.forEach((child) => {
        const position = math.getDirection(child.angle - 90, 1.0);
        const childDiv = document.createElement('div');
        childDiv.classList.add('kando-menu-preview-child');
        childDiv.style.setProperty('--rotation', child.angle - 90 + 'deg');
        childDiv.style.setProperty('--dir-x', position.x + '');
        childDiv.style.setProperty('--dir-y', position.y + '');
        this.canvas.appendChild(childDiv);

        const icon = this.createIcon(child.icon, child.iconTheme);
        childDiv.appendChild(icon);

        if (child.children.length > 0) {
          const grandChildContainer = document.createElement('div');
          grandChildContainer.classList.add('kando-menu-preview-grandchild-container');
          childDiv.appendChild(grandChildContainer);

          child.children.forEach((grandChild) => {
            const grandChildDiv = document.createElement('div');
            grandChildDiv.classList.add('kando-menu-preview-grandchild');
            grandChildDiv.style.setProperty('--rotation', grandChild.angle - 90 + 'deg');

            grandChildContainer.appendChild(grandChildDiv);
          });
        }

        const labelDivContainer = document.createElement('div');
        labelDivContainer.classList.add('kando-menu-preview-label-container');
        labelDivContainer.style.setProperty('--rotation', child.angle - 90 + 'deg');
        childDiv.style.setProperty('--dir-x', position.x + '');
        childDiv.style.setProperty('--dir-y', position.y + '');

        if (position.x < -0.001) {
          labelDivContainer.classList.add('left');
        } else if (position.x > 0.001) {
          labelDivContainer.classList.add('right');
        } else if (position.y < 0) {
          labelDivContainer.classList.add('top');
        } else {
          labelDivContainer.classList.add('bottom');
        }

        childDiv.appendChild(labelDivContainer);

        const labelDiv = document.createElement('div');
        labelDiv.classList.add('kando-menu-preview-label');
        labelDiv.classList.add('kando-font');
        labelDiv.classList.add('fs-3');
        labelDiv.textContent = child.name;
        labelDivContainer.appendChild(labelDiv);
      });
    }
  }

  /**
   * This method creates a new SVG element with a text element inside. The text element
   * contains the given icon.
   *
   * @param icon The icon name to display.
   * @param theme The theme of the icon.
   * @returns A new SVG element with the given icon.
   */
  private createIcon(icon: string, theme: string) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('width', '100');
    svg.setAttribute('height', '100');

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '50');
    text.setAttribute('y', '50');
    text.setAttribute('class', theme);
    text.textContent = icon;
    svg.appendChild(text);

    return svg;
  }

  /**
   * A helper method which is used to get the currently selected menu item from the
   * selection chain.
   *
   * @returns The currently selected menu item or null if no item is selected.
   */
  private getSelected(): IEditorNode {
    let menu = this.root;

    for (const index of this.selectionChain) {
      if (menu.children.length <= index) {
        return null;
      }

      menu = menu.children[index];
    }

    return menu;
  }

  /**
   * This method computes the 'angle' properties for the children of the given node. The
   * 'angle' property is the angle of the child relative to its parent.
   *
   * @param node The node for which to setup the angles recursively.
   */
  private setupAngles(node: IEditorNode) {
    // If the node has no children, we can stop here.
    if (node.children.length === 0) {
      return;
    }

    // For all other cases, we have to compute the angles of the children. First, we
    // compute the angle towards the parent node. This will be undefined for the root
    // node.
    const parentAngle = (node.angle + 180) % 360;
    const angles = math.computeItemAngles(node.children, parentAngle);

    // Now we assign the corresponding angles to the children.
    for (let i = 0; i < node.children.length; ++i) {
      const child = node.children[i];
      child.angle = angles[i];

      // Finally, we recursively setup the angles for the children of the child.
      this.setupAngles(child);
    }
  }
}

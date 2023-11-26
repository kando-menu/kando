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

export class Preview {
  // The container is the HTML element which contains the menu preview. It is created in
  // the constructor and returned by the getContainer() method.
  private container: HTMLElement = null;

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
      id: 'kando-menu-preview',
    });

    this.container = div.firstElementChild as HTMLElement;
  }

  /** This method returns the container of the menu preview. */
  public getContainer(): HTMLElement {
    return this.container;
  }

  /**
   * This method shows the menu preview. This is used when the toolbar of the editor is
   * collapsed again.
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
    this.container.innerHTML = '';

    const menu = this.getSelected();

    if (menu) {
      menu.children.forEach((child) => {
        const div = document.createElement('div');
        div.classList.add('kando-menu-preview-item');
        div.innerHTML = child.name;

        // If the node is not dragged, move it to its position on the circle.
        const position = math.getDirection(child.angle - 90, 200);
        div.style.left = position.x + 'px';
        div.style.top = position.y + 'px';

        this.container.appendChild(div);
      });
    }
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

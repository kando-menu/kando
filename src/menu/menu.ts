//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do,                 //
//     . <   _|   .  | ____| |  | (   |    the open-source cross-platform pie menu.     //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import './menu.scss';
import './theme.scss';

import { computeItemAngles, IVec2 } from './math';
import { INode } from './node';

/**
 * Child nodes are always placed on a circle around the parent node. Grandchild nodes are
 * placed on a circle around the child node.
 *
 * Nodes can be in one of four states:
 *
 * - PARENT: The node is the parent of the currently selected node. All nodes along the
 *   chain from the root to the selected node are in this state. Nodes of this type will
 *   have the .parent css class.
 * - ACTIVE: The node is the currently selected node. Nodes of this type will have the
 *   .active css class.
 * - CHILD: The node is a child of the currently selected node. Nodes of this type will have
 *   the .child css class.
 * - GRANDCHILD: The node is a grandchild of the currently selected node. This state is also
 *   used for all children of parent nodes which have not been selected. Nodes of this
 *   type will have the .grandchild css class.
 *
 * In addition, child nodes can be be either hovered or dragged. Hovered nodes will have
 * the .hovered css class. Dragged nodes will have the .dragged css class.
 */

export class Menu {
  private container: HTMLElement = null;
  private root: INode = null;

  private hoveredNode: INode = null;
  private draggedNode: INode = null;
  private selectionChain: Array<INode> = [];

  private absoluteMousePosition: IVec2 = { x: 0, y: 0 };
  private relativeMousePosition: IVec2 = { x: 0, y: 0 };
  private mouseAngle = 0;
  private mouseDistance = 0;
  private mouseIsDown = false;

  private readonly CHILDREN_PER_LEVEL = [8, 5, 3, 3];
  private readonly CENTER_RADIUS = 50;
  private readonly CHILD_DISTANCE = 100;
  private readonly GRANDCHILD_DISTANCE = 25;

  constructor() {
    window.api.log('Menu constructor');

    this.container = document.getElementById('menu');

    this.container.addEventListener('mousemove', (e) => {
      e.preventDefault();
      e.stopPropagation();

      this.absoluteMousePosition = { x: e.clientX, y: e.clientY };

      if (this.root) {
        const position = { x: this.root.position.x, y: this.root.position.y };

        for (let i = 1; i < this.selectionChain.length; ++i) {
          const node = this.selectionChain[i];
          position.x += node.position.x;
          position.y += node.position.y;
        }

        this.relativeMousePosition = {
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        };

        this.mouseDistance = Math.sqrt(
          this.relativeMousePosition.x * this.relativeMousePosition.x +
            this.relativeMousePosition.y * this.relativeMousePosition.y
        );
        this.mouseAngle =
          (Math.acos(this.relativeMousePosition.x / this.mouseDistance) * 180) / Math.PI;

        if (this.relativeMousePosition.y < 0) {
          this.mouseAngle = 360 - this.mouseAngle;
        }

        // Turn 0° up.
        this.mouseAngle = (this.mouseAngle + 90) % 360;

        this.redraw();
      }
    });

    this.container.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      this.mouseIsDown = true;

      if (this.hoveredNode) {
        this.dragNode(this.hoveredNode);
      }

      this.redraw();
    });

    this.container.addEventListener('mouseup', (e) => {
      e.preventDefault();
      e.stopPropagation();

      this.mouseIsDown = false;

      if (this.draggedNode) {
        this.selectNode(this.draggedNode);
        this.dragNode(null);
        this.redraw();
      }
    });
  }

  public show(position: IVec2) {
    this.relativeMousePosition = { x: 0, y: 0 };
    this.absoluteMousePosition = { x: position.x, y: position.y };

    this.root = {
      name: 'Root',
      icon: '',
      children: [],
    };

    const TEST_ICONS = [
      'play_circle',
      'public',
      'arrow_circle_right',
      'terminal',
      'settings',
      'apps',
      'arrow_circle_left',
      'fullscreen',
    ];

    const addChildren = (parent: INode, level: number) => {
      if (level < this.CHILDREN_PER_LEVEL.length) {
        parent.children = [];
        for (let i = 0; i < this.CHILDREN_PER_LEVEL[level]; ++i) {
          const node: INode = {
            name: `Item ${level}.${i}`,
            icon: TEST_ICONS[i % TEST_ICONS.length],
            children: [],
          };
          parent.children.push(node);
          addChildren(node, level + 1);
        }
      }
    };

    addChildren(this.root, 0);

    // Multiply all number in CHILDREN_PER_LEVEL by each other.
    const count = this.CHILDREN_PER_LEVEL.reduce((a, b) => a * b, 1);
    window.api.log(`Created ${count} children!`);

    this.setupAngles(this.root);
    this.createNodeTree(this.root, this.container);

    this.selectNode(this.root);
    this.redraw();
  }

  /** Removes all DOM elements from the menu and resets the root node. */
  public hide() {
    window.api.log('Menu hide');

    this.container.innerHTML = '';
    this.root = null;

    this.hoveredNode = null;
    this.draggedNode = null;
    this.selectionChain = [];
  }

  // --------------------------------------------------------------------- private methods

  /**
   * This method creates the DOM tree for the given node and all its children. For each
   * node, a div element with the class ".node" is created and appended to the given
   * container. In addition to the child nodes, the div element contains a div with the
   * class ".item" which contains the visual representation of the node.
   *
   * @param node The node to create the DOM tree for.
   * @param container The container to append the DOM tree to.
   */
  private createNodeTree(node: INode, container: HTMLElement) {
    node.div = document.createElement('div');
    node.div.classList.add('node');

    const item = document.createElement('i');
    item.classList.add('item');
    item.classList.add('material-icons-round');
    item.innerHTML = node.icon;

    container.appendChild(node.div);
    node.div.appendChild(item);

    if (node.children) {
      for (const child of node.children) {
        this.createNodeTree(child, node.div);
      }
    }
  }

  /**
   * This method computes the node which is currently hovered by the mouse. This is either
   * one of the children of the currently selected item or the parent of the currently
   * selected item. The parent will be returned if the mouse pointer is either in the
   * parent's wedge or in the center of the menu.
   *
   * @returns The node that is currently hovered by the mouse. Can be null if the center
   *   of the root menu is hovered.
   */
  private computeHoveredNode(): INode {
    // If the mouse is in the center of the menu, return the parent of the currently
    // selected node.
    if (this.mouseDistance < this.CENTER_RADIUS) {
      if (this.selectionChain.length > 1) {
        return this.selectionChain[this.selectionChain.length - 2];
      }
      return null;
    }

    // If the mouse is not in the center, check if it is in one of the children of the
    // currently selected node.
    for (const child of this.selectionChain[this.selectionChain.length - 1].children) {
      if (
        (this.mouseAngle > child.startAngle && this.mouseAngle <= child.endAngle) ||
        (this.mouseAngle - 360 > child.startAngle &&
          this.mouseAngle - 360 <= child.endAngle)
      ) {
        return child;
      }
    }

    // If the mouse is not in the center and not in one of the children, it is most likely
    // in the parent's wedge. Return the parent of the currently selected node.
    if (this.selectionChain.length > 1) {
      return this.selectionChain[this.selectionChain.length - 2];
    }

    // This should actually never happen.
    return null;
  }

  private redraw() {
    this.hoverNode(this.computeHoveredNode());

    if (this.draggedNode && this.draggedNode !== this.hoveredNode) {
      this.dragNode(this.hoveredNode);
    }

    if (this.draggedNode && this.mouseDistance < this.CENTER_RADIUS) {
      this.dragNode(null);
    }

    if (
      this.mouseIsDown &&
      !this.draggedNode &&
      this.mouseDistance > this.CENTER_RADIUS &&
      this.hoveredNode
    ) {
      this.dragNode(this.hoveredNode);
    }

    this.updateTransform(this.root);
  }

  /**
   * This method updates the transformation of the given node and all its children. The
   * transformation is computed based on the given state.
   *
   * @param node The transformation will be recomputed for this node and all its children.
   * @param state The state of the given node. The transformation will be computed
   *   differently depending on the state.
   */
  private updateTransform(node: INode) {
    if (node.div.classList.contains('grandchild')) {
      const x = this.GRANDCHILD_DISTANCE * Math.cos(((node.angle - 90) * Math.PI) / 180);
      const y = this.GRANDCHILD_DISTANCE * Math.sin(((node.angle - 90) * Math.PI) / 180);
      node.div.style.transform = `translate(${x}px, ${y}px)`;
    } else if (node.div.classList.contains('child')) {
      let transform = '';

      // If the node is hovered, increase the scale a bit.
      if (this.mouseDistance > this.CENTER_RADIUS) {
        const angleDiff = Math.abs(node.angle - this.mouseAngle);
        let scale = 1.0 + 0.15 * Math.pow(1 - angleDiff / 180, 4.0);

        // If the node is hovered, increase the scale a bit more.
        if (node === this.hoveredNode) {
          scale += 0.05;
        }

        transform = `scale(${scale}) `;
      }

      // If the node is dragged, move it to the mouse position.
      if (node === this.draggedNode) {
        transform = `translate(${this.relativeMousePosition.x}px, ${this.relativeMousePosition.y}px)`;
      } else {
        // If the node is not dragged, move it to its position on the circle.
        const x = this.CHILD_DISTANCE * Math.cos(((node.angle - 90) * Math.PI) / 180);
        const y = this.CHILD_DISTANCE * Math.sin(((node.angle - 90) * Math.PI) / 180);
        transform += `translate(${x}px, ${y}px)`;
      }

      // Finally, apply the transformation to the node and update the transformation of
      // all its children.
      node.div.style.transform = transform;

      for (const child of node.children) {
        this.updateTransform(child);
      }
    } else if (
      node.div.classList.contains('active') ||
      node.div.classList.contains('parent')
    ) {
      node.div.style.transform = `translate(${node.position.x}px, ${node.position.y}px)`;
      for (const child of node.children) {
        this.updateTransform(child);
      }
    }
  }

  /**
   * This will assign the CSS class 'dragged' to the given node's div element. It will
   * also remove the class from the previously dragged node.
   *
   * @param node The node to drag. If null, the previously dragged node will be
   *   un-dragged.
   */
  private dragNode(node?: INode) {
    if (this.draggedNode === node) {
      return;
    }

    if (this.draggedNode) {
      this.draggedNode.div.classList.remove('dragged');
      this.draggedNode = null;
    }

    if (node) {
      this.draggedNode = node;
      this.draggedNode.div.classList.add('dragged');
    }
  }

  /**
   * This will assign the CSS class 'hovered' to the given node's div element. It will
   * also remove the class from the previously hovered node.
   *
   * @param node The node to hover. If null, the currently hovered node will be unhovered.
   */
  private hoverNode(node?: INode) {
    if (this.hoveredNode === node) {
      return;
    }

    if (this.hoveredNode) {
      this.hoveredNode.div.classList.remove('hovered');
      this.hoveredNode = null;
    }

    if (node) {
      this.hoveredNode = node;
      this.hoveredNode.div.classList.add('hovered');
    }
  }

  /**
   * Selects the given node. This will either push the node to the list of selected nodes
   * or pop the last node from the list of selected nodes if the newly selected node is
   * the parent of the previously selected node.
   *
   * @param node The newly selected node.
   */
  private selectNode(node: INode) {
    // If the node is already selected, do nothing.
    if (
      this.selectionChain.length > 0 &&
      this.selectionChain[this.selectionChain.length - 1] === node
    ) {
      return;
    }

    // If the node is the parent of the currently selected node, we have to pop the
    // currently selected node from the list of selected nodes.
    else if (
      this.selectionChain.length > 1 &&
      this.selectionChain[this.selectionChain.length - 2] === node
    ) {
      this.selectionChain.pop();
    }

    // If the node is a child of the currently selected node, we have to push it to the
    // list of selected nodes.
    else {
      this.selectionChain.push(node);
    }

    // Now we have to position the root element of the menu at a position so that the
    // newly selected node is at the mouse position. For this, we first compute the
    // absolute position of the last-but-one node in the selection chain. There is the
    // special case where there is only a single node in the selection chain. In this
    // case, we simply position the root element at the mouse position.
    if (this.selectionChain.length === 1) {
      this.root.position = this.absoluteMousePosition;
    } else {
      const x = this.mouseDistance * Math.cos(((node.angle - 90) * Math.PI) / 180);
      const y = this.mouseDistance * Math.sin(((node.angle - 90) * Math.PI) / 180);

      node.position = { x, y };

      const offset = {
        x: this.relativeMousePosition.x - node.position.x,
        y: this.relativeMousePosition.y - node.position.y,
      };

      this.root.position = {
        x: this.root.position.x + offset.x,
        y: this.root.position.y + offset.y,
      };
    }

    this.relativeMousePosition = { x: 0, y: 0 };
    this.mouseDistance = 0;

    // Finally update the CSS classes of all nodes according to the new selection chain.
    this.updateCSSClasses();
  }

  /**
   * Updates the CSS classes of all nodes according to the current selection chain. The
   * methods will assign the following CSS classes to the nodes:
   *
   * - 'active' to the last node in the selection chain.
   * - 'parent' to all nodes in the selection chain except the last one.
   * - 'child' to all children of the last node in the selection chain.
   * - 'grandchild' to all children of parents and children.
   */
  private updateCSSClasses() {
    for (let i = 0; i < this.selectionChain.length; ++i) {
      const node = this.selectionChain[i];
      if (i === this.selectionChain.length - 1) {
        node.div.className = 'node active';

        for (const child of node.children) {
          child.div.className = 'node child';

          for (const grandchild of child.children) {
            grandchild.div.className = 'node grandchild';
          }
        }
      } else {
        node.div.className = 'node parent';

        for (const child of node.children) {
          child.div.className = 'node grandchild';
        }
      }
    }
  }

  /**
   * This method computes the 'angle', 'startAngle' and 'endAngle' properties for the
   * given node and all its children. The 'angle' property is the angle of the node
   * itself, the 'startAngle' and 'endAngle' properties are the angular bounds of the
   * node's wedge.
   *
   * @param node The node to setup the angles for recursively.
   */
  private setupAngles(node: INode) {
    if (node.children.length === 0) {
      return;
    }

    const parentAngle = (node.angle + 180) % 360;
    const angles = computeItemAngles(node.children, parentAngle);

    for (let i = 0; i < node.children.length; ++i) {
      let previousAngle = angles[(i - 1 + angles.length) % angles.length];
      let nextAngle = angles[(i + 1) % angles.length];

      // Make sure we wrap around.
      if (nextAngle < previousAngle) {
        nextAngle += 360;
      }

      if (angles[i] < previousAngle) {
        nextAngle -= 360;
        previousAngle -= 360;
      }

      if (previousAngle < parentAngle && parentAngle < angles[i]) {
        previousAngle = parentAngle;
      } else if (previousAngle < parentAngle + 360 && parentAngle + 360 < angles[i]) {
        previousAngle = parentAngle + 360;
      } else if (angles[i] < parentAngle && parentAngle < nextAngle) {
        nextAngle = parentAngle;
      } else if (angles[i] < parentAngle + 360 && parentAngle + 360 < nextAngle) {
        nextAngle = parentAngle + 360;
      }

      const child = node.children[i];
      child.angle = angles[i];
      child.startAngle = (child.angle + previousAngle) / 2;
      child.endAngle = (child.angle + nextAngle) / 2;
      this.setupAngles(child);
    }
  }
}

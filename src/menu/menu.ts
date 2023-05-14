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

export class Menu {
  private container: HTMLElement = null;
  private root: INode = null;

  private hoveredNode: INode = null;
  private draggedNode: INode = null;

  private menuPosition: IVec2 = { x: 0, y: 0 };
  private mousePosition: IVec2 = { x: 0, y: 0 };
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

      if (this.root) {
        this.mousePosition.x = e.clientX - this.menuPosition.x;
        this.mousePosition.y = e.clientY - this.menuPosition.y;

        this.mouseDistance = Math.sqrt(
          this.mousePosition.x * this.mousePosition.x +
            this.mousePosition.y * this.mousePosition.y
        );
        this.mouseAngle =
          (Math.acos(this.mousePosition.x / this.mouseDistance) * 180) / Math.PI;

        if (this.mousePosition.y < 0) {
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
        this.setDraggedNode(this.hoveredNode);
      }

      this.redraw();
    });

    this.container.addEventListener('mouseup', (e) => {
      e.preventDefault();
      e.stopPropagation();

      this.mouseIsDown = false;

      this.setDraggedNode(null);
      this.redraw();
    });
  }

  public show(position: IVec2) {
    window.api.log(`Menu show at ${position.x}, ${position.y}`);

    this.menuPosition = position;
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

    this.redraw();
    this.root.div.classList.add('active');

    this.root.div.style.transform = `translate(${this.menuPosition.x}px, ${this.menuPosition.y}px)`;
  }

  /** Removes all DOM elements from the menu and resets the root node. */
  public hide() {
    window.api.log('Menu hide');

    this.container.innerHTML = '';
    this.root = null;
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

  private redraw() {
    this.hoveredNode = null;

    if (this.draggedNode && this.mouseDistance < this.CENTER_RADIUS) {
      this.setDraggedNode(null);
    }

    this.updateNodeTransform(this.root, 0);

    if (
      this.mouseIsDown &&
      !this.draggedNode &&
      this.mouseDistance > this.CENTER_RADIUS &&
      this.hoveredNode
    ) {
      this.setDraggedNode(this.hoveredNode);
    }
  }

  private updateNodeTransform(node: INode, level: number) {
    if (level > 2) {
      return;
    }

    if (level === 0) {
      if (this.mouseDistance > this.CENTER_RADIUS) {
        node.div.classList.remove('hovered');
      } else {
        node.div.classList.add('hovered');
      }
    } else if (level === 1) {
      let transform = '';
      let hovered = false;

      if (this.mouseDistance > this.CENTER_RADIUS) {
        hovered =
          (this.mouseAngle > node.startAngle && this.mouseAngle <= node.endAngle) ||
          (this.mouseAngle - 360 > node.startAngle &&
            this.mouseAngle - 360 <= node.endAngle);

        const angleDiff = Math.abs(node.angle - this.mouseAngle);
        let scale = 1.0 + 0.15 * Math.pow(1 - angleDiff / 180, 4.0);

        if (hovered) {
          scale += 0.05;
        }

        transform = `scale(${scale}) `;
      }

      if (hovered) {
        this.hoveredNode = node;
        node.div.classList.add('hovered');

        if (this.draggedNode && this.draggedNode !== node) {
          this.setDraggedNode(node);
        }
      } else {
        node.div.classList.remove('hovered');
      }

      if (node === this.draggedNode) {
        transform = `translate(${this.mousePosition.x}px, ${this.mousePosition.y}px)`;
      } else {
        const x = this.CHILD_DISTANCE * Math.cos(((node.angle - 90) * Math.PI) / 180);
        const y = this.CHILD_DISTANCE * Math.sin(((node.angle - 90) * Math.PI) / 180);
        transform += `translate(${x}px, ${y}px)`;
      }

      node.div.style.transform = transform;
    } else if (level === 2) {
      const x = this.GRANDCHILD_DISTANCE * Math.cos(((node.angle - 90) * Math.PI) / 180);
      const y = this.GRANDCHILD_DISTANCE * Math.sin(((node.angle - 90) * Math.PI) / 180);
      node.div.style.transform = `translate(${x}px, ${y}px)`;
    }

    for (const child of node.children) {
      this.updateNodeTransform(child, level + 1);
    }
  }

  private setDraggedNode(node?: INode) {
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

    const angles = computeItemAngles(node.children, (node.angle + 180) % 360);

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

      const child = node.children[i];
      child.angle = angles[i];
      child.startAngle = (child.angle + previousAngle) / 2;
      child.endAngle = (child.angle + nextAngle) / 2;
      this.setupAngles(child);
    }
  }
}

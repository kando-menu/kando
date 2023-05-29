//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import './menu.scss';
import './theme.scss';

import { EventEmitter } from 'events';

import * as math from './math';
import { INode } from './node';
import { GestureDetection } from './gesture-detection';

/**
 * The menu stores the logical state of the mouse. This will be set to CLICKED once the
 * left mouse button is pressed. If the mouse is moved more than a couple of pixels before
 * the mouse button is released, it is set to DRAGGING. When the mouse button is released,
 * it is set to RELEASED.
 */
enum MouseState {
  RELEASED,
  CLICKED,
  DRAGGING,
}

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

export class Menu extends EventEmitter {
  // The container is the HTML element which contains the menu. It is used to attach
  // event listeners.
  private container: HTMLElement = null;

  // The root node is the node which is placed at the center of the menu. It is the
  // parent of all other nodes. It will be created when the menu is shown and destroyed
  // when the menu is hidden.
  private root: INode = null;

  // The hovered node is the node which is currently hovered by the mouse. It is used
  // to highlight the node under the mouse cursor. This will only be null if the mouse
  // is over the center of the root node. If the center of an active child node is
  // hovered, the hovered node will be the parent of the active child node.
  private hoveredNode: INode = null;

  // The dragged node is the node which is currently dragged by the mouse.
  private draggedNode: INode = null;

  // The selection chain is the chain of nodes from the root node to the currently
  // selected node. The first element of the array is the root node, the last element
  // is the currently selected node.
  private selectionChain: Array<INode> = [];

  // This shows the name of the currently hovered child on the center item.
  private centerText: HTMLElement = null;

  // The gesture detection is used to detect node selections in marking mode.
  private gestureDetection: GestureDetection = null;

  // This object contains all information on the current mouse state. Is it updated
  // whenever the mouse is moved or a button is pressed.
  private mouse = {
    // This will be set to CLICKED once the left mouse button is pressed. If the mouse is
    // moved more than DRAG_THRESHOLD pixels before the mouse button is released, this is
    // set to DRAGGING. When the mouse button is released, this is set to RELEASED.
    state: MouseState.RELEASED,

    // The absolute mouse position is the position of the mouse in screen coordinates. It
    // is always updated when the mouse moves.
    absolutePosition: { x: 0, y: 0 },

    // The relative mouse position is the position of the mouse relative to the currently
    // selected node. It is always updated when the mouse moves.
    relativePosition: { x: 0, y: 0 },

    // The position where the mouse was when the user pressed the left mouse button the
    // last time.
    clickPosition: { x: 0, y: 0 },

    // The mouse angle is the angle of the mouse relative to the currently selected node.
    // 0° is up, 90° is right, 180° is down and 270° is left. It is always updated when
    // the mouse moves.
    angle: 0,

    // The mouse distance is the distance of the mouse to the center of the currently
    // selected node. It is always updated when the mouse moves.
    distance: 0,
  };

  // This is currently used to create the test menu. It defines the number of children
  // per level. The first number is the number of children of the root node, the second
  // number is the number of children of each child node and so on.
  private readonly CHILDREN_PER_LEVEL = [8, 7, 7];

  // The following constants define the layout of the menu. They are all in pixels and
  // should be configurable in the future.
  private readonly CENTER_RADIUS = 50;
  private readonly CHILD_DISTANCE = 100;
  private readonly PARENT_DISTANCE = 200;
  private readonly GRANDCHILD_DISTANCE = 25;
  private readonly DRAG_THRESHOLD = 5;

  constructor(container: HTMLElement) {
    super();

    window.api.log('Menu constructor');

    this.container = container;

    // This will be fed with motion events. If the pointer makes a turn or is stationary
    // for some time, a selection event will be emitted.
    this.gestureDetection = new GestureDetection();
    this.gestureDetection.on('selection', (coords: math.IVec2) => {
      // If there is a node currently dragged, select it. We only select nodes which have
      // children in marking mode in order to prevent unwanted actions. This way the user
      // can always check if the correct action was selected before executing it.
      if (this.draggedNode && this.draggedNode.children.length > 0) {
        // The selection event reports where the selection most likely occurred (e.g. the
        // position where the mouse pointer actually made a turn). We pretend that the
        // mouse pointer is currently at that position, so that the newly selected node
        // will be moved to this position.
        this.updateMouseInfo(coords);
        this.selectNode(this.draggedNode);
      }
    });

    // When the mouse is moved, we store the absolute mouse position, as well as the mouse
    // position, distance, and angle relative to the currently selected item.
    this.container.addEventListener('mousemove', (event) => {
      event.preventDefault();
      event.stopPropagation();

      this.updateMouseInfo({ x: event.clientX, y: event.clientY });

      // If the mouse move too much, the current mousedown - mouseup event is not
      // considered to be a click anymore. Set the current mouse state to
      // MouseState.DRAGGING
      if (
        this.mouse.state === MouseState.CLICKED &&
        math.getDistance(this.mouse.absolutePosition, this.mouse.clickPosition) >
          this.DRAG_THRESHOLD
      ) {
        this.mouse.state = MouseState.DRAGGING;
      }

      // If a modifier key is pressed, this is handled basically as if the left mouse
      // button is pressed. This allows for node selections without having to press a
      // mouse button if the menu was opened with a keyboard shortcut.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        this.mouse.state = MouseState.DRAGGING;
      } else if (this.mouse.state === MouseState.DRAGGING && event.buttons === 0) {
        this.mouse.state = MouseState.RELEASED;
      }

      // If the mouse pointer (or a modifier key) is held down, forward the motion event
      // to the gesture selection.
      if (this.mouse.state === MouseState.DRAGGING) {
        this.gestureDetection.onMotionEvent(this.mouse.absolutePosition);
      }

      this.redraw();
    });

    // When the left mouse button is pressed, the currently hovered node becomes the
    // dragged node.
    this.container.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();

      this.mouse.clickPosition = { x: event.clientX, y: event.clientY };
      this.mouse.state = MouseState.CLICKED;
      this.gestureDetection.reset();

      if (this.hoveredNode) {
        this.dragNode(this.hoveredNode);
      }

      this.redraw();
    });

    // When the left mouse button is released, the currently dragged node is selected.
    this.container.addEventListener('mouseup', (event) => {
      event.preventDefault();
      event.stopPropagation();

      // If we clicked the center of the root menu, the "cancel" signal is emitted.
      if (
        this.mouse.state === MouseState.CLICKED &&
        this.selectionChain.length === 1 &&
        this.mouse.distance < this.CENTER_RADIUS
      ) {
        this.emit('cancel');
        return;
      }

      this.mouse.state = MouseState.RELEASED;
      this.gestureDetection.reset();

      if (this.draggedNode) {
        this.selectNode(this.draggedNode);
      }
    });

    // If the last modifier is released while a node is dragged around, we select it. This
    // enables selections in "Turbo-Mode", where nodes are selected with modifier buttons
    // pressed instead of the left mouse button.
    document.addEventListener('keyup', (event) => {
      if (this.mouse.state === MouseState.DRAGGING) {
        const modifierReleased =
          event.key === 'Control' ||
          event.key === 'Shift' ||
          event.key === 'Alt' ||
          event.key === 'Meta';
        const stillAnyModifierPressed =
          event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;

        if (modifierReleased && !stillAnyModifierPressed) {
          this.mouse.state = MouseState.RELEASED;
          this.gestureDetection.reset();
          if (this.draggedNode) {
            this.selectNode(this.draggedNode);
          }
        }
      }
    });
  }

  /**
   * This method is called when the menu is shown. Currently, it just creates a test menu.
   *
   * @param position The position of the mouse cursor when the menu was opened.
   */
  public show(position: math.IVec2) {
    this.clear();

    this.mouse.relativePosition = { x: 0, y: 0 };
    this.mouse.absolutePosition = { x: position.x, y: position.y };

    this.root = {
      name: 'Node',
      icon: 'open_with',
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
            name: `${parent.name} ${i}`,
            icon: TEST_ICONS[i % TEST_ICONS.length],
            children: [],
          };
          parent.children.push(node);
          addChildren(node, level + 1);
        }
      }
    };

    addChildren(this.root, 0);

    // Print some statistics.
    const count = this.CHILDREN_PER_LEVEL.reduce((a, b) => a * b, 1);
    window.api.log(`Created ${count} menu nodes!`);

    this.setupAngles(this.root);
    this.createNodeTree(this.root, this.container);
    this.selectNode(this.root);

    // Finally, show the menu.
    this.container.classList.remove('hidden');
  }

  /** Hides the menu. */
  public hide() {
    this.container.classList.add('hidden');
  }

  /** Removes all DOM elements from the menu and resets the root node. */
  public clear() {
    this.container.className = 'kando hidden';

    this.gestureDetection.reset();

    this.container.innerHTML = '';
    this.root = null;
    this.centerText = null;
    this.mouse.state = MouseState.RELEASED;
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
    node.itemDiv = document.createElement('div');
    node.itemDiv.classList.add('node');

    const item = document.createElement('i');
    item.classList.add('item');
    item.classList.add('material-icons-round');
    item.innerHTML = node.icon;

    container.appendChild(node.itemDiv);
    node.itemDiv.appendChild(item);

    if (node.children) {
      node.connectorDiv = document.createElement('div');
      node.connectorDiv.classList.add('connector');
      node.itemDiv.appendChild(node.connectorDiv);

      for (const child of node.children) {
        this.createNodeTree(child, node.itemDiv);
      }
    }

    if (node === this.root) {
      this.centerText = document.createElement('div');
      this.centerText.classList.add('center-text');
      this.centerText.classList.add('hidden');
      node.itemDiv.appendChild(this.centerText);
    }
  }

  /**
   * Selects the given node. This will either push the node to the list of selected nodes
   * or pop the last node from the list of selected nodes if the newly selected node is
   * the parent of the previously selected node.
   *
   * Also, the root node is repositioned so that the given node is positioned at the mouse
   * cursor.
   *
   * If the given node is a leaf node, the "select" event is emitted.
   *
   * @param node The newly selected node.
   */
  private selectNode(node: INode) {
    // Make sure to un-hover the node if it was hovered before.
    if (node === this.hoveredNode) {
      this.hoverNode(null);
    }

    // Make sure to un-drag the node if it was dragged before.
    if (node === this.draggedNode) {
      this.dragNode(null);
    }

    // If the node is already selected, do nothing.
    if (
      this.selectionChain.length > 0 &&
      this.selectionChain[this.selectionChain.length - 1] === node
    ) {
      return;
    }

    // Is the node the parent of the currently active node?
    const selectedParent = this.isParentOfActiveNode(node);

    // Now we have to position the root element of the menu at a position so that the
    // newly selected node is at the mouse position. For this, we first compute ideal
    // position of the new node based on its angle and the mouse distance to the currently
    // active node. There is the special case where we select the root node. In this case,
    // we simply position the root element at the mouse position.
    if (node === this.root) {
      this.root.position = this.mouse.absolutePosition;
    } else if (selectedParent) {
      const active = this.selectionChain[this.selectionChain.length - 1];
      const offset = {
        x: this.mouse.relativePosition.x + active.position.x,
        y: this.mouse.relativePosition.y + active.position.y,
      };

      this.root.position = {
        x: this.root.position.x + offset.x,
        y: this.root.position.y + offset.y,
      };
    } else {
      // Compute the ideal position of the new node. The distance to the parent node is
      // set to be at least PARENT_DISTANCE. This is to avoid that the menu is too close
      // to the parent node.
      node.position = math.getDirection(
        node.angle - 90,
        Math.max(this.PARENT_DISTANCE, this.mouse.distance)
      );

      const offset = {
        x: this.mouse.relativePosition.x - node.position.x,
        y: this.mouse.relativePosition.y - node.position.y,
      };

      this.root.position = {
        x: this.root.position.x + offset.x,
        y: this.root.position.y + offset.y,
      };
    }

    // If the node is the parent of the currently selected node, we have to pop the
    // currently selected node from the list of selected nodes. If the node is a child of
    // the currently selected node, we have to push it to the list of selected nodes.
    if (selectedParent) {
      this.selectionChain.pop();
    } else {
      this.selectionChain.push(node);
    }

    this.mouse.relativePosition = { x: 0, y: 0 };
    this.mouse.distance = 0;

    // Finally update the CSS classes of all nodes according to the new selection chain
    // and update the connectors.
    this.updateCSSClasses();
    this.updateConnectors();
    this.redraw();

    if (node.children.length === 0) {
      this.container.classList.add('selected');
      this.emit('select');
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
      this.draggedNode.itemDiv.classList.remove('dragged');
      this.draggedNode = null;
    }

    if (node) {
      this.draggedNode = node;
      this.draggedNode.itemDiv.classList.add('dragged');
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
      this.hoveredNode.itemDiv.classList.remove('hovered');
      this.hoveredNode = null;
    }

    if (node) {
      this.hoveredNode = node;
      this.hoveredNode.itemDiv.classList.add('hovered');
    }
  }

  /** This method updates the transformation of all nodes in the menu. */
  private redraw() {
    if (!this.root) {
      return;
    }

    const newHoveredNode = this.computeHoveredNode();

    if (newHoveredNode !== this.hoveredNode) {
      this.hoverNode(newHoveredNode);

      if (this.isParentOfActiveNode(newHoveredNode) || newHoveredNode === this.root) {
        this.centerText.classList.add('hidden');
      } else {
        this.centerText.innerText = newHoveredNode.name;
        this.centerText.classList.remove('hidden');

        const position = this.getActiveNodePosition();
        position.x -= this.root.position.x;
        position.y -= this.root.position.y;
        this.centerText.style.transform = `translate(${position.x}px, ${position.y}px)`;
      }
    }

    if (this.draggedNode && this.draggedNode !== this.hoveredNode) {
      this.dragNode(this.hoveredNode);

      if (!this.draggedNode) {
        this.updateConnectors();
      }
    }

    // If the mouse is dragged over a node, make that node the dragged node.
    if (
      this.mouse.state === MouseState.DRAGGING &&
      !this.draggedNode &&
      this.mouse.distance > this.CENTER_RADIUS &&
      this.hoveredNode
    ) {
      this.dragNode(this.hoveredNode);
    }

    // Abort node-dragging when dragging the node over the center of the currently active
    // menu.
    if (
      this.mouse.state === MouseState.DRAGGING &&
      this.draggedNode &&
      this.mouse.distance < this.CENTER_RADIUS
    ) {
      this.dragNode(null);
      this.updateConnectors();
    }

    // Abort node dragging if the mouse button was released.
    if (this.mouse.state === MouseState.RELEASED && this.draggedNode) {
      this.dragNode(null);
      this.updateConnectors();
    }

    // Update all transformations.
    this.updateTransform(this.root);

    // If there is a node dragged around, we also have to redraw the connectors.
    if (this.draggedNode) {
      this.updateConnectors();
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
    if (this.mouse.distance < this.CENTER_RADIUS) {
      if (this.selectionChain.length > 1) {
        return this.selectionChain[this.selectionChain.length - 2];
      }
      return this.root;
    }

    // If the mouse is not in the center, check if it is in one of the children of the
    // currently selected node.
    for (const child of this.selectionChain[this.selectionChain.length - 1].children) {
      if (
        (this.mouse.angle > child.startAngle && this.mouse.angle <= child.endAngle) ||
        (this.mouse.angle - 360 > child.startAngle &&
          this.mouse.angle - 360 <= child.endAngle) ||
        (this.mouse.angle + 360 > child.startAngle &&
          this.mouse.angle + 360 <= child.endAngle)
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

  /**
   * This method updates the transformation of the given node and all its children. The
   * transformation is computed based on the given state.
   *
   * @param node The transformation will be recomputed for this node and all its children.
   * @param state The state of the given node. The transformation will be computed
   *   differently depending on the state.
   */
  private updateTransform(node: INode) {
    if (node.itemDiv.classList.contains('grandchild')) {
      node.position = math.getDirection(node.angle - 90, this.GRANDCHILD_DISTANCE);
      node.itemDiv.style.transform = `translate(${node.position.x}px, ${node.position.y}px)`;
    } else if (node.itemDiv.classList.contains('child')) {
      let transform = '';

      // If the node is hovered, increase the scale a bit.
      if (this.mouse.distance > this.CENTER_RADIUS) {
        const angleDiff = Math.abs(node.angle - this.mouse.angle);
        let scale = 1.0 + 0.15 * Math.pow(1 - angleDiff / 180, 4.0);

        // If the node is hovered, increase the scale a bit more.
        if (node === this.hoveredNode) {
          scale += 0.05;
        }

        transform = `scale(${scale}) `;
      }

      // If the node is dragged, move it to the mouse position.
      if (node === this.draggedNode && this.mouse.state === MouseState.DRAGGING) {
        node.position = this.mouse.relativePosition;
        transform = `translate(${node.position.x}px, ${node.position.y}px)`;
      } else {
        // If the node is not dragged, move it to its position on the circle.
        node.position = math.getDirection(node.angle - 90, this.CHILD_DISTANCE);
        transform += `translate(${node.position.x}px, ${node.position.y}px)`;
      }

      // Finally, apply the transformation to the node and update the transformation of
      // all its children.
      node.itemDiv.style.transform = transform;

      for (const child of node.children) {
        this.updateTransform(child);
      }
    } else if (
      node.itemDiv.classList.contains('active') ||
      node.itemDiv.classList.contains('parent')
    ) {
      node.itemDiv.style.transform = `translate(${node.position.x}px, ${node.position.y}px)`;
      for (const child of node.children) {
        this.updateTransform(child);
      }
    }
  }

  /**
   * Iterate over the selection chain and update the length (width) and rotation of all
   * connector divs so that they connect consecutive nodes.
   */
  private updateConnectors() {
    for (let i = 0; i < this.selectionChain.length; i++) {
      const node = this.selectionChain[i];
      let nextNode = this.selectionChain[i + 1];

      // For the last element in the selection chain (which is the currently active node),
      // we only draw a connector if one of its children is currently dragged around. We
      // have to ensure that the dragged node is not the parent of the active node.
      if (
        i === this.selectionChain.length - 1 &&
        !this.isParentOfActiveNode(this.draggedNode) &&
        this.draggedNode !== this.root
      ) {
        nextNode = this.draggedNode;
      }

      if (nextNode) {
        const length = math.getLength(nextNode.position);
        let angle = math.getAngle(nextNode.position);

        if (
          node.lastConnectorRotation &&
          Math.abs(node.lastConnectorRotation - angle) > 180
        ) {
          const fullTurns = Math.round((node.lastConnectorRotation - angle) / 360);
          angle += fullTurns * 360;
        }

        node.lastConnectorRotation = angle;

        node.connectorDiv.style.width = `${length}px`;
        node.connectorDiv.style.transform = `rotate(${angle}deg)`;
      } else {
        node.connectorDiv.style.width = '0px';
      }
    }
  }

  /**
   * Updates the CSS classes of all nodes according to the current selection chain. The
   * methods will assign the following CSS classes to the nodes:
   *
   * - 'active' to the last node in the selection chain.
   * - 'parent' to all nodes in the selection chain except the last one.
   * - 'child' to all children of the last node in the selection chain.
   * - 'grandchild' to all children of parents and children.
   *
   * Children of grandchild nodes will not be updated, so they will keep their current CSS
   * class. As they are not visible anyway, this is not a problem.
   */
  private updateCSSClasses() {
    for (let i = 0; i < this.selectionChain.length; ++i) {
      const node = this.selectionChain[i];
      if (i === this.selectionChain.length - 1) {
        node.itemDiv.className = 'node active';

        for (const child of node.children) {
          child.itemDiv.className = 'node child';

          for (const grandchild of child.children) {
            grandchild.itemDiv.className = 'node grandchild';
          }
        }
      } else {
        node.itemDiv.className = 'node parent';

        for (const child of node.children) {
          child.itemDiv.className = 'node grandchild';
        }
      }
    }
  }

  /**
   * Store the absolute mouse position, as well as the mouse position, distance, and angle
   * relative to the currently selected item.
   *
   * @param position The absolute mouse position.
   */
  private updateMouseInfo(position: math.IVec2) {
    this.mouse.absolutePosition = position;

    if (this.root) {
      const activeNodePosition = this.getActiveNodePosition();
      this.mouse.relativePosition = {
        x: position.x - activeNodePosition.x,
        y: position.y - activeNodePosition.y,
      };

      this.mouse.distance = math.getLength(this.mouse.relativePosition);
      this.mouse.angle = math.getAngle(this.mouse.relativePosition);

      // Turn 0° up.
      this.mouse.angle = (this.mouse.angle + 90) % 360;
    }
  }

  /**
   * This method computes the 'angle', 'startAngle' and 'endAngle' properties for the
   * children of the given node. The 'angle' property is the angle of the child relative
   * itself, the 'startAngle' and 'endAngle' properties are the angular bounds of the
   * child's wedge. If the given node has an 'angle' property itself, the child wedges
   * leave a gap at the position towards the parent node.
   *
   * @param node The node for which to setup the children recursively.
   */
  private setupAngles(node: INode) {
    // If the node has no children, we can stop here.
    if (node.children.length === 0) {
      return;
    }

    // For all other cases, we have to compute the angles of the children. First, we
    // compute the angle towards the parent node. This will be undefined for the root
    // node.
    const parentAngle = (node.angle + 180) % 360;
    const angles = math.computeItemAngles(node.children, parentAngle);
    const wedges = math.computeItemWedges(angles, parentAngle);

    // Now we assign the corresponding angles to the children.
    for (let i = 0; i < node.children.length; ++i) {
      const child = node.children[i];
      child.angle = angles[i];
      child.startAngle = wedges[i].start;
      child.endAngle = wedges[i].end;

      // Finally, we recursively setup the angles for the children of the child.
      this.setupAngles(child);
    }
  }

  /**
   * This method returns true if the given node is the parent node of the currently
   * selected node.
   *
   * @param node The potential parent node.
   * @returns True if the given node is the parent node of the currently selected node.
   */
  private isParentOfActiveNode(node: INode) {
    return (
      this.selectionChain.length > 1 &&
      this.selectionChain[this.selectionChain.length - 2] === node
    );
  }

  /**
   * Computes the absolute position of the currently selected menu node.
   *
   * @returns The position of the currently active node.
   */
  private getActiveNodePosition() {
    const position = {
      x: this.root.position.x,
      y: this.root.position.y,
    };

    for (let i = 1; i < this.selectionChain.length; ++i) {
      const node = this.selectionChain[i];
      position.x += node.position.x;
      position.y += node.position.y;
    }

    return position;
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';

import * as math from '../math';
import { IVec2 } from '../../common';
import { IRenderedMenuItem } from './rendered-menu-item';
import { CenterText } from './center-text';
import { GestureDetection } from './gesture-detection';
import { InputState, InputTracker } from './input-tracker';

/**
 * The menu is the main class of Kando. It stores a tree of items which is used to render
 * the menu. The menu is shown by calling the show() method and hidden by calling the
 * hide() method. The menu will be rendered into the given container element.
 *
 * When the user selects a menu item, the menu will emit a "select" event. If the user
 * cancels the selection, the menu will emit a "cancel" event. If items are hovered or
 * unhovered, the menu will emit "hover" and "unhover" events.
 *
 * Child items are always placed on a circle around the parent item. Grandchild items are
 * placed on a circle around the child item.
 *
 * Menu items can be in one of four states:
 *
 * - PARENT: The item is the parent of the currently selected item. All items along the
 *   chain from the root to the selected item are in this state. Items of this type will
 *   have the .parent css class.
 * - ACTIVE: The item is the currently selected item. Items of this type will have the
 *   .active css class.
 * - CHILD: The item is a child of the currently selected item. Items of this type will have
 *   the .child css class.
 * - GRANDCHILD: The item is a grandchild of the currently selected item. This state is also
 *   used for all children of parent items which have not been selected. Items of this
 *   type will have the .grandchild css class.
 *
 * In addition, child items can be be either hovered or dragged. Hovered items will have
 * the .hovered css class. Dragged items will have the .dragged css class.
 */

export class Menu extends EventEmitter {
  /**
   * The container is the HTML element which contains the menu. It is used to attach event
   * listeners.
   */
  private container: HTMLElement = null;

  /**
   * The root item is the parent of all other menu items. It will be created when the menu
   * is shown and destroyed when the menu is hidden.
   */
  private root: IRenderedMenuItem = null;

  /**
   * The window size is the size of the window. Usually, this is the same as
   * window.innerWidth and window.innerHeight. However, when the window was just resized
   * before the menu was shown, this can be different. Therefore, we need to pass it from
   * the main process.
   */
  private windowSize: IVec2 = null;

  /**
   * The hovered item is the menu item which is currently hovered by the mouse. It is used
   * to highlight the item under the mouse cursor. This will only be null if the mouse is
   * over the center of the root item. If the menu center is hovered, the hovered item
   * will be the parent of the current menu.
   */
  private hoveredItem: IRenderedMenuItem = null;

  /** The dragged item is the item which is currently dragged by the mouse. */
  private draggedItem: IRenderedMenuItem = null;

  /**
   * The selection chain is the chain of menu items from the root item to the currently
   * selected item. The first element of the array is the root item, the last element is
   * the currently selected item.
   */
  private selectionChain: Array<IRenderedMenuItem> = [];

  /** This shows the name of the currently hovered child on the center item. */
  private centerText: CenterText = null;

  /** The gesture detection is used to detect item selections in marking mode. */
  private gestures: GestureDetection = new GestureDetection();

  /**
   * This object contains all information on the current mouse state. Is it updated
   * whenever the mouse is moved or a button is pressed.
   */
  private input: InputTracker = new InputTracker();

  /**
   * The following constants define the layout of the menu. They are all in pixels and
   * should be configurable in the future.
   */
  private readonly CENTER_RADIUS = 50;
  private readonly CHILD_DISTANCE = 100;
  private readonly PARENT_DISTANCE = 200;
  private readonly GRANDCHILD_DISTANCE = 25;

  constructor(container: HTMLElement) {
    super();

    this.container = container;

    // When the mouse is moved, we store the absolute mouse position, as well as the mouse
    // position, distance, and angle relative to the currently selected item.
    const onMotionEvent = (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      event.stopPropagation();

      this.input.onMotionEvent(event, this.getCenterItemPosition());
    };

    // When the left mouse button is pressed, the currently hovered item becomes the
    // dragged item.
    const onPointerDownEvent = (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      event.stopPropagation();

      // If there is a hovered item, it now becomes a dragged item.
      if (this.hoveredItem) {
        this.dragItem(this.hoveredItem);
      }

      this.input.onPointerDownEvent(event, this.getCenterItemPosition());
      this.gestures.reset();
    };

    // When the left mouse button is released, the currently dragged item is selected.
    const onPointerUpEvent = (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      event.stopPropagation();

      // Hide the menu on right click events.
      if (this.input.state === InputState.CLICKED && (event as MouseEvent).button === 2) {
        this.emit('cancel');
        return;
      }

      // Hide the menu if we clicked the center of the root menu.
      if (
        this.input.state === InputState.CLICKED &&
        this.selectionChain.length === 1 &&
        this.input.distance < this.CENTER_RADIUS
      ) {
        this.emit('cancel');
        return;
      }

      this.input.onPointerUpEvent();
      this.gestures.reset();

      if (this.draggedItem) {
        this.selectItem(this.draggedItem);
      }
    };

    this.container.addEventListener('mousedown', onPointerDownEvent);
    this.container.addEventListener('mousemove', onMotionEvent);
    this.container.addEventListener('mouseup', onPointerUpEvent);
    this.container.addEventListener('touchstart', onPointerDownEvent);
    this.container.addEventListener('touchmove', onMotionEvent);
    this.container.addEventListener('touchend', onPointerUpEvent);

    // In order to keep track of any pressed key for the turbo mode, we listen to keydown
    // and keyup events.
    document.addEventListener('keydown', (event) => {
      this.input.onKeyDownEvent(event);
    });

    // If the last modifier is released while a menu item is dragged around, we select it.
    // This enables selections in "Turbo-Mode", where items can be selected with mouse
    // movements without pressing the left mouse button but by holding a keyboard key
    // instead.
    document.addEventListener('keyup', (event) => {
      this.input.onKeyUpEvent(event);

      if (this.input.state === InputState.DRAGGING) {
        const stillAnyModifierPressed =
          event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;

        if (!stillAnyModifierPressed) {
          this.input.onPointerUpEvent();
          this.gestures.reset();
          if (this.draggedItem) {
            this.selectItem(this.draggedItem);
          }
        }
      }
    });

    // If the mouse pointer (or a modifier key) is held down, forward the motion event
    // to the gesture selection.
    this.input.on('pointer-motion', (coords: IVec2, dragged: boolean) => {
      if (dragged) {
        this.gestures.onMotionEvent(coords);
      }
      this.redraw();
    });

    // This will be fed with motion events. If the pointer makes a turn or is stationary
    // for some time, a selection event will be emitted.
    this.gestures.on('selection', (coords: IVec2) => {
      // If there is an item currently dragged, select it. We only select items which have
      // children in marking mode in order to prevent unwanted actions. This way the user
      // can always check if the correct action was selected before executing it.
      if (this.draggedItem && this.draggedItem.children?.length > 0) {
        // The selection event reports where the selection most likely occurred (e.g. the
        // position where the mouse pointer actually made a turn). We pretend that the
        // mouse pointer is currently at that position, so that the newly selected item
        // will be moved to this position.
        this.input.update(coords, this.getCenterItemPosition());
        this.selectItem(this.draggedItem);
      }
    });
  }

  /**
   * This method is called when the menu is shown. Currently, it just creates a test menu.
   *
   * @param position The position of the mouse cursor when the menu was opened.
   * @param windowSize The size of the window. Usually, this is the same as
   *   window.innerWidth and window.innerHeight. However, when the window was just
   *   resized, this can be different. Therefore, we need to pass it from the main
   *   process.
   */
  public show(root: IRenderedMenuItem, position: IVec2, windowSize: IVec2) {
    this.clear();

    this.windowSize = windowSize;

    this.input.update(position);
    this.input.ignoreNextMotionEvents();

    this.root = root;
    this.setupPaths(this.root);
    this.setupAngles(this.root);
    this.createNodeTree(this.root, this.container);
    this.selectItem(this.root);

    // Finally, show the menu.
    this.container.classList.remove('hidden');
  }

  /** Hides the menu. */
  public hide() {
    this.container.classList.add('hidden');
  }

  /** Removes all DOM elements from the menu and resets the root menu item. */
  public clear() {
    this.container.className = 'hidden';

    this.gestures.reset();
    this.input.onPointerUpEvent();

    this.container.innerHTML = '';
    this.root = null;
    this.centerText = null;
    this.hoveredItem = null;
    this.draggedItem = null;
    this.selectionChain = [];
  }

  // --------------------------------------------------------------------- private methods

  /**
   * This method creates the DOM tree for the given menu item and all its children. For
   * each item, a div element with the class ".menu-node" is created and appended to the
   * given container. In addition to the child menu items, the div element contains a div
   * with the class ".menu-item" which contains the visual representation of the item. The
   * item's icon is rendered as an <i> element with the class ".menu-icon" as a child of
   * the ".menu-item" element.
   *
   * @param item The menu item to create the DOM tree for.
   * @param container The container to append the DOM tree to.
   */
  private createNodeTree(rootItem: IRenderedMenuItem, rootContainer: HTMLElement) {
    const queue: { item: IRenderedMenuItem; container: HTMLElement }[] = [];

    queue.push({ item: rootItem, container: rootContainer });

    while (queue.length > 0) {
      const { item, container } = queue.shift()!;

      const nodeDiv = document.createElement('div');
      const menuItem = document.createElement('div');
      const icon = document.createElement('i');

      nodeDiv.classList.add('menu-node');
      menuItem.classList.add('menu-item');
      icon.classList.add('menu-icon');

      container.appendChild(nodeDiv);
      nodeDiv.appendChild(menuItem);
      menuItem.appendChild(icon);

      item.nodeDiv = nodeDiv;

      switch (item.iconTheme) {
        case 'material-symbols-rounded':
          icon.classList.add('material-symbols-rounded');
          icon.innerText = item.icon;
          break;
        case 'emoji':
          icon.classList.add('emoji-icon');
          icon.innerText = item.icon;
          break;
        case 'simple-icons':
          icon.classList.add('si');
          icon.classList.add('si-' + item.icon);
          break;
        case 'simple-icons-colored':
          icon.classList.add('si');
          icon.classList.add('si--color');
          icon.classList.add('si-' + item.icon);
          break;
      }

      if (item.children) {
        item.connectorDiv = document.createElement('div');
        item.connectorDiv.classList.add('connector');
        nodeDiv.appendChild(item.connectorDiv);

        for (const child of item.children) {
          queue.push({ item: child, container: nodeDiv });
        }
      }

      if (item === this.root) {
        const maxCenterTextSize = this.CENTER_RADIUS * 2.0;
        const padding = this.CENTER_RADIUS * 0.1;
        this.centerText = new CenterText(nodeDiv, maxCenterTextSize - padding);
      }
    }
  }

  /**
   * Selects the given menu item. This will either push the item to the list of selected
   * items or pop the last item from the list of selected items if the newly selected item
   * is the parent of the previously selected item.
   *
   * Also, the root item is repositioned so that the given item is positioned at the mouse
   * cursor.
   *
   * If the given item is a leaf item, the "select" event is emitted.
   *
   * @param item The newly selected menu item.
   */
  private selectItem(item: IRenderedMenuItem) {
    // Make sure to un-hover the item if it was hovered before.
    if (item === this.hoveredItem) {
      this.hoverItem(null);
    }

    // Make sure to un-drag the item if it was dragged before.
    if (item === this.draggedItem) {
      this.dragItem(null);
    }

    // If the item is already selected, do nothing.
    if (
      this.selectionChain.length > 0 &&
      this.selectionChain[this.selectionChain.length - 1] === item
    ) {
      return;
    }

    // Is the item the parent of the currently active item?
    const selectedParent = this.isParentOfCenterItem(item);

    // Now we have to position the root element of the menu at a position so that the
    // newly selected menu item is at the mouse position. For this, we first compute ideal
    // position of the new item based on its angle and the mouse distance to the currently
    // center. There is the special case where we select the root item. In this case, we
    // simply position the root element at the mouse position.
    if (item === this.root) {
      this.root.position = this.input.absolutePosition;
    } else if (selectedParent) {
      const center = this.selectionChain[this.selectionChain.length - 1];
      const offset = math.add(this.input.relativePosition, center.position);
      this.root.position = math.add(this.root.position, offset);
    } else {
      // Compute the ideal position of the new item. The distance to the parent item is
      // set to be at least PARENT_DISTANCE. This is to avoid that the menu is too close
      // to the parent item.
      item.position = math.getDirection(
        item.angle,
        Math.max(this.PARENT_DISTANCE, this.input.distance)
      );

      const offset = math.subtract(this.input.relativePosition, item.position);
      this.root.position = math.add(this.root.position, offset);
    }

    // If the menu item is the parent of the currently selected item, we have to pop the
    // currently selected item from the list of selected menu items. If the item is a
    // child of the currently selected item, we have to push it to the list of selected
    // menu items.
    if (selectedParent) {
      this.selectionChain.pop();
    } else {
      this.selectionChain.push(item);
    }

    // Clamp the position of the newly selected submenu to the viewport.
    if (item.children?.length > 0) {
      const position = this.getCenterItemPosition();

      // Compute the maximum radius of the menu, including children and grandchildren. The
      // magic number 1.4 accounts for the hover effect (which should be made
      // configurable). The 10 is some additional margin.
      const maxRadius = (this.CHILD_DISTANCE + this.GRANDCHILD_DISTANCE) * 1.4 + 10;
      const clampedPosition = math.clampToMonitor(position, maxRadius, this.windowSize);

      const offset = {
        x: Math.trunc(clampedPosition.x - position.x),
        y: Math.trunc(clampedPosition.y - position.y),
      };

      if (offset.x !== 0 || offset.y !== 0) {
        this.emit('move-pointer', offset);
        this.root.position = math.add(this.root.position, offset);
      }
    }

    // Update the mouse info based on the newly selected item's position.
    this.input.update(this.input.absolutePosition);

    // Finally update the CSS classes of all DOM nodes according to the new selection chain
    // and update the connectors.
    this.updateCSSClasses();
    this.updateConnectors();
    this.redraw();

    if (item.type !== 'submenu') {
      this.container.classList.add('selected');
      this.emit('select', item.path);
    }
  }

  /**
   * This will assign the CSS class 'dragged' to the given menu item's node div element.
   * It will also remove the class from the previously dragged menu item.
   *
   * @param item The item to drag. If null, the previously dragged item will be
   *   un-dragged.
   */
  private dragItem(item?: IRenderedMenuItem) {
    if (this.draggedItem === item) {
      return;
    }

    if (this.draggedItem) {
      this.draggedItem.nodeDiv.classList.remove('dragged');
      this.draggedItem = null;
    }

    if (item) {
      this.draggedItem = item;
      this.draggedItem.nodeDiv.classList.add('dragged');
    }
  }

  /**
   * This will assign the CSS class 'hovered' to the given menu item's node div element.
   * It will also remove the class from the previously hovered menu item.
   *
   * @param item The item to hover. If null, the currently hovered item will be unhovered.
   */
  private hoverItem(item?: IRenderedMenuItem) {
    if (this.hoveredItem === item) {
      return;
    }

    if (this.hoveredItem) {
      this.emit('unhover', this.hoveredItem.path);
      this.hoveredItem.nodeDiv.classList.remove('hovered');
      this.hoveredItem = null;
    }

    if (item) {
      this.hoveredItem = item;
      this.hoveredItem.nodeDiv.classList.add('hovered');
      this.emit('hover', this.hoveredItem.path);
    }
  }

  /** This method updates the transformation of all items in the menu. */
  private redraw() {
    if (!this.root) {
      return;
    }

    const newHoveredItem = this.computeHoveredItem();

    if (newHoveredItem !== this.hoveredItem) {
      this.hoverItem(newHoveredItem);

      // If no item is hovered, if the mouse is over the center of the menu, or if the
      // mouse is over the parent of the current menu, hide the center text. Else, we
      // display the name of the hovered item and make sure it is positioned at the
      // center of the menu.
      if (
        !newHoveredItem ||
        this.isParentOfCenterItem(newHoveredItem) ||
        newHoveredItem === this.root
      ) {
        this.centerText.hide();
      } else {
        this.centerText.setText(newHoveredItem.name);
        this.centerText.show();

        const position = this.getCenterItemPosition();
        position.x -= this.root.position.x;
        position.y -= this.root.position.y;
        this.centerText.setPosition(position);
      }
    }

    if (this.draggedItem && this.draggedItem !== this.hoveredItem) {
      this.dragItem(this.hoveredItem);

      if (!this.draggedItem) {
        this.updateConnectors();
      }
    }

    // If the mouse is dragged over a menu item, make that item the dragged item.
    if (
      this.input.state === InputState.DRAGGING &&
      !this.draggedItem &&
      this.input.distance > this.CENTER_RADIUS &&
      this.hoveredItem
    ) {
      this.dragItem(this.hoveredItem);
    }

    // Abort item-dragging when dragging the item over the center of the currently active
    // menu.
    if (
      this.input.state === InputState.DRAGGING &&
      this.draggedItem &&
      this.input.distance < this.CENTER_RADIUS
    ) {
      this.dragItem(null);
      this.updateConnectors();
    }

    // Abort item dragging if the mouse button was released.
    if (this.input.state === InputState.RELEASED && this.draggedItem) {
      this.dragItem(null);
      this.updateConnectors();
    }

    // Update all transformations.
    this.updateTransform(this.root);

    // If there is a item dragged around, we also have to redraw the connectors.
    if (this.draggedItem) {
      this.updateConnectors();
    }
  }

  /**
   * This method computes the item which is currently hovered by the mouse. This is either
   * one of the children of the center item or the parent of the center item. The parent
   * will be returned if the mouse pointer is either in the parent's wedge or in the
   * center of the menu.
   *
   * @returns The menu item that is currently hovered by the mouse. Can be null if the
   *   center of the root menu is hovered.
   */
  private computeHoveredItem(): IRenderedMenuItem {
    // If the mouse is in the center of the menu, return the parent of the currently
    // selected item.
    if (this.input.distance < this.CENTER_RADIUS) {
      if (this.selectionChain.length > 1) {
        return this.selectionChain[this.selectionChain.length - 2];
      }
      return this.root;
    }

    // If the mouse is not in the center, check if it is in one of the children of the
    // currently selected item.
    const currentItem = this.selectionChain[this.selectionChain.length - 1];
    if (currentItem.children) {
      for (const child of currentItem.children as IRenderedMenuItem[]) {
        if (math.isAngleBetween(this.input.angle, child.startAngle, child.endAngle)) {
          return child;
        }
      }
    }

    // If the mouse is not in the center and not in one of the children, it is most likely
    // in the parent's wedge. Return the parent of the currently selected item.
    if (this.selectionChain.length > 1) {
      return this.selectionChain[this.selectionChain.length - 2];
    }

    // This should actually never happen.
    return null;
  }

  /**
   * This method updates the 2D position of the given menu item and all its children. The
   * position is computed based on the given state.
   *
   * @param item The position will be recomputed for this menu item and all its children.
   * @param state The state of the given item. The transformation will be computed
   *   differently depending on the state.
   */
  private updateTransform(item: IRenderedMenuItem) {
    if (item.nodeDiv.classList.contains('grandchild')) {
      item.position = math.getDirection(item.angle, this.GRANDCHILD_DISTANCE);
      item.nodeDiv.style.transform = `translate(${item.position.x}px, ${item.position.y}px)`;
    } else if (item.nodeDiv.classList.contains('child')) {
      let transform = '';

      // If the item is hovered, increase the scale a bit.
      if (this.input.distance > this.CENTER_RADIUS) {
        const angleDiff = Math.abs(item.angle - this.input.angle);
        let scale = 1.0 + 0.15 * Math.pow(1 - angleDiff / 180, 4.0);

        // If the item is hovered, increase the scale a bit more.
        if (item === this.hoveredItem) {
          scale += 0.05;
        }

        transform = `scale(${scale}) `;
      }

      // If the item is dragged, move it to the mouse position.
      if (item === this.draggedItem && this.input.state === InputState.DRAGGING) {
        item.position = this.input.relativePosition;
        transform = `translate(${item.position.x}px, ${item.position.y}px)`;
      } else {
        // If the item is not dragged, move it to its position on the circle.
        item.position = math.getDirection(item.angle, this.CHILD_DISTANCE);
        transform += `translate(${item.position.x}px, ${item.position.y}px)`;
      }

      // Finally, apply the transformation to the item and update the transformation of
      // all its children.
      item.nodeDiv.style.transform = transform;

      if (item.children) {
        for (const child of item.children) {
          this.updateTransform(child);
        }
      }
    } else if (
      item.nodeDiv.classList.contains('active') ||
      item.nodeDiv.classList.contains('parent')
    ) {
      item.nodeDiv.style.transform = `translate(${item.position.x}px, ${item.position.y}px)`;
      if (item.children) {
        for (const child of item.children) {
          this.updateTransform(child);
        }
      }
    }
  }

  /**
   * Iterate over the selection chain and update the length (width) and rotation of all
   * connector divs so that they connect consecutive menu items.
   */
  private updateConnectors() {
    for (let i = 0; i < this.selectionChain.length; i++) {
      const item = this.selectionChain[i];
      let nextItem = this.selectionChain[i + 1];

      // For the last element in the selection chain (which is the currently active menu
      // item displayed in the center), we only draw a connector if one of its children is
      // currently dragged around. We have to ensure that the dragged menu item is not the
      // parent of the active item.
      if (
        i === this.selectionChain.length - 1 &&
        !this.isParentOfCenterItem(this.draggedItem) &&
        this.draggedItem !== this.root
      ) {
        nextItem = this.draggedItem;
      }

      if (item.connectorDiv) {
        if (nextItem) {
          const length = math.getLength(nextItem.position);
          let angle = math.getAngle(nextItem.position);

          if (
            item.lastConnectorRotation &&
            Math.abs(item.lastConnectorRotation - angle) > 180
          ) {
            const fullTurns = Math.round((item.lastConnectorRotation - angle) / 360);
            angle += fullTurns * 360;
          }

          item.lastConnectorRotation = angle;

          item.connectorDiv.style.width = `${length}px`;
          item.connectorDiv.style.transform = `rotate(${angle - 90}deg)`;
        } else {
          item.connectorDiv.style.width = '0px';
        }
      }
    }
  }

  /**
   * Updates the CSS classes of all items according to the current selection chain. The
   * methods will assign the following CSS classes to the items:
   *
   * - 'active' to the last item in the selection chain.
   * - 'parent' to all items in the selection chain except the last one.
   * - 'child' to all children of the last item in the selection chain.
   * - 'grandchild' to all children of parents and children.
   *
   * Children of grandchild items will not be updated, so they will keep their current CSS
   * class. As they are not visible anyway, this is not a problem.
   */
  private updateCSSClasses() {
    for (let i = 0; i < this.selectionChain.length; ++i) {
      const item = this.selectionChain[i];
      if (i === this.selectionChain.length - 1) {
        item.nodeDiv.className = 'menu-node active';

        if (item.children) {
          for (const child of item.children as IRenderedMenuItem[]) {
            child.nodeDiv.className = 'menu-node child';

            if (child.children) {
              for (const grandchild of child.children as IRenderedMenuItem[]) {
                grandchild.nodeDiv.className = 'menu-node grandchild';
              }
            }
          }
        }
      } else {
        item.nodeDiv.className = 'menu-node parent';

        if (item.children) {
          for (const child of item.children as IRenderedMenuItem[]) {
            child.nodeDiv.className = 'menu-node grandchild';
          }
        }
      }
    }
  }

  /**
   * This method computes the 'path' property for the given menu item and all its
   * children. This is the path from the root item to the given item. It is a string in
   * the form of '/0/1/2'. This example would indicate a item which is the third child of
   * the second child of the first child of the root item. The root item has the path
   * '/'.
   *
   * @param item The menu item for which to setup the path recursively.
   */
  private setupPaths(item: IRenderedMenuItem, path = '') {
    item.path = path === '' ? '/' : path;

    for (let i = 0; i < item.children?.length; ++i) {
      const child = item.children[i] as IRenderedMenuItem;
      this.setupPaths(child, `${path}/${i}`);
    }
  }

  /**
   * This method computes the 'angle', 'startAngle' and 'endAngle' properties for the
   * children of the given menu item. The 'angle' property is the angle of the child
   * relative to its parent, the 'startAngle' and 'endAngle' properties are the angular
   * bounds of the child's wedge. If the given item has an 'angle' property itself, the
   * child wedges will leave a gap at the position towards the parent item.
   *
   * @param item The menu item for which to setup the angles recursively.
   */
  private setupAngles(item: IRenderedMenuItem) {
    // If the item has no children, we can stop here.
    if (!item.children || item.children.length === 0) {
      return;
    }

    // For all other cases, we have to compute the angles of the children. First, we
    // compute the angle towards the parent item. This will be undefined for the root
    // item.
    const parentAngle = item.angle == undefined ? undefined : (item.angle + 180) % 360;
    const angles = math.computeItemAngles(item.children, parentAngle);
    const wedges = math.computeItemWedges(angles, parentAngle);

    // Now we assign the corresponding angles to the children.
    for (let i = 0; i < item.children.length; ++i) {
      const child = item.children[i] as IRenderedMenuItem;
      child.angle = angles[i];
      child.startAngle = wedges[i].start;
      child.endAngle = wedges[i].end;

      // Finally, we recursively setup the angles for the children of the child.
      this.setupAngles(child);
    }
  }

  /**
   * This method returns true if the given menu item is the parent of the currently
   * selected item.
   *
   * @param item The potential parent item.
   * @returns True if the given item is the parent item of the currently selected item.
   */
  private isParentOfCenterItem(item: IRenderedMenuItem) {
    return (
      this.selectionChain.length > 1 &&
      this.selectionChain[this.selectionChain.length - 2] === item
    );
  }

  /**
   * Computes the absolute position of the menu item which is currently in the center of
   * the menu. This is the position of the root item plus the sum of the positions of all
   * items in the selection chain.
   *
   * @returns The position of the currently active item.
   */
  private getCenterItemPosition() {
    if (this.selectionChain.length === 0) {
      return { x: 0, y: 0 };
    }

    const position = {
      x: this.root.position.x,
      y: this.root.position.y,
    };

    for (let i = 1; i < this.selectionChain.length; ++i) {
      const item = this.selectionChain[i];
      position.x += item.position.x;
      position.y += item.position.y;
    }

    return position;
  }
}

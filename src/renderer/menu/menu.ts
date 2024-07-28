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
import { IShowMenuOptions, IVec2 } from '../../common';
import { IRenderedMenuItem } from './rendered-menu-item';
import { CenterText } from './center-text';
import { GestureDetection } from './gesture-detection';
import { InputState, InputTracker } from './input-tracker';
import { LayerContentType, MenuTheme } from './menu-theme';

const CENTER_RADIUS = 50;
const PARENT_DISTANCE = 150;

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
   * This holds some information which is passed to the menu when it is shown from the
   * main process. For instance, it holds the window size and the initial mouse position.
   */
  private options: IShowMenuOptions;

  /**
   * The hovered item is the menu item which is currently hovered by the mouse. It is used
   * to highlight the item under the mouse cursor. This will only be null if the mouse is
   * over the center of the root item. If the menu center is hovered, the hovered item
   * will be the parent of the current menu.
   */
  private hoveredItem: IRenderedMenuItem = null;

  /**
   * The clicked item is the item which is under the mouse cursor when the left mouse
   * button is pressed. Items with this state can be styled differently by the theme.
   */
  private clickedItem: IRenderedMenuItem = null;

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

  private theme: MenuTheme = new MenuTheme({
    name: 'default',
    author: 'Simon Schneegans',
    themeVersion: '1.0',
    engineVersion: 1,
    license: 'MIT',
    drawChildrenBelow: true,
    maxMenuRadius: 160,
    colors: [
      { name: 'background', default: '#000000' },
      { name: 'foreground', default: '#ffffff' },
    ],
    layers: [{ class: 'menu-item', content: LayerContentType.eIcon }],
  });

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

      this.redraw();

      this.input.onPointerDownEvent(event, this.getCenterItemPosition());
      this.gestures.reset();
    };

    // When the left mouse button is released, the currently dragged item is selected.
    const onPointerUpEvent = (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      event.stopPropagation();

      // Hide the menu on right click events.
      if (
        this.input.state === InputState.eClicked &&
        (event as MouseEvent).button === 2
      ) {
        this.emit('cancel');
        return;
      }

      // Hide the menu if we clicked the center of the root menu.
      if (
        this.input.state === InputState.eClicked &&
        this.selectionChain.length === 1 &&
        this.input.distance < CENTER_RADIUS
      ) {
        this.emit('cancel');
        return;
      }

      this.input.onPointerUpEvent();
      this.gestures.reset();

      if (this.draggedItem || this.clickedItem) {
        this.selectItem(this.draggedItem || this.clickedItem);
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
      if (event.key !== 'Escape') {
        this.input.onKeyDownEvent();
      }
    });

    // If the last modifier is released while a menu item is dragged around, we select it.
    // This enables selections in "Turbo-Mode", where items can be selected with mouse
    // movements without pressing the left mouse button but by holding a keyboard key
    // instead.
    document.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
        return;
      }

      const wasTurboMode = this.input.turboMode;

      this.input.onKeyUpEvent(event);

      if (wasTurboMode) {
        const stillAnyModifierPressed =
          event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;

        if (!stillAnyModifierPressed) {
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
      if (
        !this.options.anchoredMode &&
        this.draggedItem &&
        this.draggedItem.children?.length > 0
      ) {
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
   * This method is called when the menu is shown. It will create the DOM tree for the
   * given root item and all its children. It will also set up the angles and positions of
   * all items and show the menu.
   *
   * @param options Some additional information on how to show the menu.
   */
  public show(root: IRenderedMenuItem, options: IShowMenuOptions) {
    this.clear();

    this.options = options;

    this.input.deferredTurboMode = options.centeredMode;
    this.input.update(this.getInitialMenuPosition());
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
   * item's icon is rendered as an <i> element with the class ".icon-container" as a child
   * of the ".menu-item" element.
   *
   * @param item The menu item to create the DOM tree for.
   * @param container The container to append the DOM tree to.
   */
  private createNodeTree(rootItem: IRenderedMenuItem, rootContainer: HTMLElement) {
    const queue = [];

    queue.push({ item: rootItem, container: rootContainer, level: 0 });

    while (queue.length > 0) {
      const { item, container, level } = queue.shift();

      const nodeDiv = this.theme.createItem(item);
      if (this.theme.drawChildrenBelow) {
        container.insertBefore(nodeDiv, container.firstChild);
      } else {
        container.appendChild(nodeDiv);
      }

      item.nodeDiv = nodeDiv;

      // Set the direction of the item. This is used by the theme to position the item
      // correctly.
      const dir = math.getDirection(item.angle, 1.0);
      item.nodeDiv.style.setProperty('--dir-x', dir.x.toString());
      item.nodeDiv.style.setProperty('--dir-y', dir.y.toString());
      item.nodeDiv.style.setProperty('--angle', item.angle?.toString());
      item.nodeDiv.classList.add(`level-${level}`);
      item.nodeDiv.classList.add(`type-${item.type}`);

      if (item.children) {
        item.connectorDiv = document.createElement('div');
        item.connectorDiv.classList.add('connector');
        nodeDiv.appendChild(item.connectorDiv);

        for (const child of item.children) {
          queue.push({
            item: child as IRenderedMenuItem,
            container: nodeDiv,
            level: level + 1,
          });
        }
      }

      if (item === this.root) {
        const maxCenterTextSize = CENTER_RADIUS * 2.0;
        const padding = CENTER_RADIUS * 0.1;
        this.centerText = new CenterText(rootContainer, maxCenterTextSize - padding);
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
    this.clickItem(null);
    this.hoverItem(null);
    this.dragItem(null);

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
      this.root.position = this.options.anchoredMode
        ? this.getInitialMenuPosition()
        : this.input.absolutePosition;
    } else if (selectedParent) {
      const center = this.selectionChain[this.selectionChain.length - 1];

      if (this.options.anchoredMode) {
        this.root.position = math.add(this.root.position, center.position);
      } else {
        const offset = math.add(this.input.relativePosition, center.position);
        this.root.position = math.add(this.root.position, offset);
      }
    } else {
      // Compute the ideal position of the new item. The distance to the parent item is
      // set to be at least PARENT_DISTANCE. This is to avoid that the menu is
      // too close to the parent item. In anchored mode, the distance is set to
      // PARENT_DISTANCE.
      const distance = this.options.anchoredMode
        ? PARENT_DISTANCE
        : Math.max(PARENT_DISTANCE, this.input.distance);

      item.position = math.getDirection(item.angle, distance);

      if (this.options.anchoredMode) {
        this.root.position = math.subtract(this.root.position, item.position);
      } else {
        const offset = math.subtract(this.input.relativePosition, item.position);
        this.root.position = math.add(this.root.position, offset);
      }
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

      const clampedPosition = math.clampToMonitor(
        position,
        this.theme.maxMenuRadius,
        this.options.windowSize
      );

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

  /**
   * This will assign the CSS class 'clicked' to the given menu item's node div element.
   * It will also remove the class from the previously clicked menu item.
   *
   * @param item The item to click. If null, the previously clicked item will be
   *   unclicked.
   */
  private clickItem(item?: IRenderedMenuItem) {
    if (this.clickedItem === item) {
      return;
    }

    if (this.clickedItem) {
      this.clickedItem.nodeDiv.classList.remove('clicked');
      this.clickedItem = null;
    }

    if (item) {
      this.clickedItem = item;
      this.clickedItem.nodeDiv.classList.add('clicked');
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
    this.clickItem(null);

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
        this.centerText.setPosition(position);
      }
    }

    if (this.draggedItem && this.draggedItem !== this.hoveredItem) {
      this.dragItem(this.hoveredItem);
    }

    if (this.input.state === InputState.eClicked && !this.clickedItem) {
      this.clickItem(this.hoveredItem);
      this.updateConnectors();
    }

    // If the mouse is dragged over a menu item, make that item the dragged item.
    if (
      this.input.state === InputState.eDragging &&
      !this.draggedItem &&
      this.input.distance > CENTER_RADIUS &&
      this.hoveredItem
    ) {
      this.dragItem(this.hoveredItem);
    }

    // Abort item-dragging when dragging the item over the center of the currently active
    // menu.
    if (
      this.input.state === InputState.eDragging &&
      this.draggedItem &&
      this.input.distance < CENTER_RADIUS
    ) {
      this.dragItem(null);
      this.updateConnectors();
    }

    // Abort item dragging if the mouse button was released.
    if (this.input.state === InputState.eReleased && this.draggedItem) {
      this.dragItem(null);
      this.updateConnectors();
    }

    // Un-click an item if mouse button was released.
    if (this.input.state === InputState.eReleased && this.clickedItem) {
      this.clickItem(null);
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
    if (this.input.distance < CENTER_RADIUS) {
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
   * This method updates the 2D position of the given menu item and all its children. For
   * child and grandchild items, the position is computed by the theme in CSS. For parent
   * and active items, the position is based on where the menu was opened.
   *
   * @param item The position will be recomputed for this menu item and all its children.
   */
  private updateTransform(item: IRenderedMenuItem) {
    if (item.nodeDiv.classList.contains('grandchild')) {
      item.nodeDiv.style.transform = '';
      delete item.position;
    } else if (item.nodeDiv.classList.contains('child')) {
      // If the item is dragged, move it to the mouse position. Else the item is positioned
      // by the theme.
      if (item === this.draggedItem && this.input.state === InputState.eDragging) {
        item.position = this.input.relativePosition;
        item.nodeDiv.style.transform = `translate(${item.position.x}px, ${item.position.y}px)`;
      } else {
        // To allow for cool animations, we pass the angular distance between the item and
        // the pointer to the theme.
        let angleDiff = Math.abs(item.angle - this.input.angle);
        angleDiff = Math.min(angleDiff, 360 - angleDiff);
        item.nodeDiv.style.setProperty('--angle-diff', angleDiff.toString());
        item.nodeDiv.style.transform = '';
        delete item.position;
      }

      // Finally, update the transformation of all its children.
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
      // The connector div is the div which connects the menu items. In this iteration
      // we update the length and rotation of the connector div at "item" so that it
      // points to "nextItem".
      const item = this.selectionChain[i];
      let nextItem = this.selectionChain[i + 1];

      // Sanity check: If the item has no connector div, we can skip it.
      if (!item.connectorDiv) {
        continue;
      }

      // For the last element in the selection chain (which is the currently active menu
      // item displayed in the center), we only draw a connector if one of its children is
      // currently dragged around or clicked. When clicked, the connector will be drawn
      // with length 0 - hence it's invisible but we use it to rotate the connector to the
      // correct angle. Once the item is selected, the connector will be drawn with the
      // correct length.
      if (i === this.selectionChain.length - 1) {
        if (this.isChildOfCenterItem(this.draggedItem)) {
          nextItem = this.draggedItem;
        }

        if (!nextItem && this.isChildOfCenterItem(this.clickedItem)) {
          nextItem = this.clickedItem;
        }
      }

      if (nextItem) {
        let length = 0;
        let angle = nextItem.angle;

        if (nextItem.position) {
          length = math.getLength(nextItem.position);
          angle = math.getAngle(nextItem.position);
        }

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
    const clearClasses = (item: IRenderedMenuItem) => {
      item.nodeDiv.classList.remove('active', 'parent', 'child', 'grandchild');
    };

    for (let i = 0; i < this.selectionChain.length; ++i) {
      const item = this.selectionChain[i];
      clearClasses(item);
      if (i === this.selectionChain.length - 1) {
        item.nodeDiv.classList.add('active');

        if (item.children) {
          for (const child of item.children as IRenderedMenuItem[]) {
            clearClasses(child);
            child.nodeDiv.classList.add('child');

            if (child.children) {
              for (const grandchild of child.children as IRenderedMenuItem[]) {
                clearClasses(grandchild);
                grandchild.nodeDiv.classList.add('grandchild');
              }
            }
          }
        }
      } else {
        item.nodeDiv.classList.add('parent');

        if (item.children) {
          for (const child of item.children as IRenderedMenuItem[]) {
            clearClasses(child);
            child.nodeDiv.classList.add('grandchild');
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
   * This method returns true if the given menu item is a child of the currently selected
   * item.
   *
   * @param item The potential child item.
   * @returns True if the given item is a child of the currently selected item.
   */

  private isChildOfCenterItem(item: IRenderedMenuItem) {
    const centerItem = this.selectionChain[this.selectionChain.length - 1];
    return centerItem.children?.includes(item);
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

  /**
   * This method computes the initial position of the root item. If the menu is in
   * centered mode, the root item will be positioned at the center of the window.
   * Otherwise, it will be positioned at the mouse position.
   *
   * @returns The initial position of the root item.
   */
  private getInitialMenuPosition() {
    return {
      x: this.options.centeredMode
        ? (this.options.windowSize.x / this.options.zoomFactor) * 0.5
        : this.options.mousePosition.x,
      y: this.options.centeredMode
        ? (this.options.windowSize.y / this.options.zoomFactor) * 0.5
        : this.options.mousePosition.y,
    };
  }
}

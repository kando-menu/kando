//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';

import * as math from '../common/math';
import KeyMapper from '../common/key-mapper';
import {
  GeneralSettings,
  ShowMenuOptions,
  Vec2,
  SelectionSource,
  MenuInteractionType,
  TypedEventEmitter,
  ChildMenuItem,
} from '../common';
import {
  RenderedChildMenuItem,
  RenderedRootMenuItem,
  RenderedMenuItem,
} from './rendered-menu-item';
import { SelectionWedges } from './selection-wedges';
import { WedgeSeparators } from './wedge-separators';
import { CenterText } from './center-text';
import { GamepadInput } from './input-methods/gamepad-input';
import { PointerInput } from './input-methods/pointer-input';
import { ButtonState, InputState, SelectionType } from './input-methods/input-method';
import { MenuTheme } from './menu-theme';

/**
 * The menu is the main class of Kando. It stores a tree of items which is used to render
 * the menu. The menu is shown by calling the show() method and hidden by calling the
 * hide() method. The menu will be rendered into the given container element.
 *
 * Usually, child items are placed on a circle around the center item. Grandchild items
 * are placed on a circle around the child item. How this is done exactly, depends on the
 * menu theme which is used to render the menu.
 *
 * The menu is a tree of menu items, one of which is the current center item, the
 * so-called active item. Items which connect the active item to the root item are called
 * parent items. Items which are connected to the active item are called child items.
 * Items which are connected to child items are called grandchild items.
 *
 * The menu is an event emitter and will emit the following events.
 */

type MenuEvents = {
  // Fired when an interaction is triggered by the user or by the host process itself via
  // the triggerInteraction function. The time and source parameters are used for
  // achievement tracking. They are only relevant for selection interactions.
  interaction: [
    type: MenuInteractionType,
    path: number[],
    selectionTime: number,
    inputSource: SelectionSource,
  ];
  // Fired when the pointer should be moved by the given offset. This is used to warp the
  // pointer to the center of the menu when it is shown.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'move-pointer': [dist: Vec2];
};

export class Menu extends (EventEmitter as new () => TypedEventEmitter<MenuEvents>) {
  /**
   * The root item is the parent of all other menu items. It will be created when the menu
   * is shown and destroyed when the menu is hidden.
   */
  private root: RenderedRootMenuItem = null;

  /**
   * This holds some information which is passed to the menu when it is shown from the
   * main process. For instance, it holds the window size and the initial mouse position.
   */
  private showMenuOptions: ShowMenuOptions;

  /**
   * The hovered item is the menu item which is currently hovered by the mouse. It is used
   * to highlight the item under the mouse cursor. This will only be null if the mouse is
   * over the center of the root item. If the menu center of a submenu is hovered, the
   * hovered item will be the parent of the current menu.
   */
  private hoveredItem: RenderedMenuItem = null;

  /**
   * The clicked item is the item which is under the mouse cursor when the left mouse
   * button is pressed. Items with this state can be styled differently by the theme.
   */
  private clickedItem: RenderedMenuItem = null;

  /** The dragged item is the item which is currently dragged by the mouse. */
  private draggedItem: RenderedMenuItem = null;

  /**
   * The currently selected item. This is the item which is currently at the center of the
   * menu. It will only be null initially when the menu is shown and will be set to the
   * root item immediately after that.
   */
  private centerItem: RenderedMenuItem = null;

  /** This is used to visualize the selection wedges. */
  private selectionWedges: SelectionWedges = null;

  /** This is used to visualize the separator lines between adjacent wedges. */
  private wedgeSeparators: WedgeSeparators = null;

  /** This detects mouse and touch gestures and emits selection events. */
  private pointerInput: PointerInput = new PointerInput();

  /**
   * The gamepad input is used to detect gamepad input. It polls the gamepad state and
   * emits events when buttons are pressed or the thumbsticks are moved.
   */
  private gamepadInput: GamepadInput = new GamepadInput();

  /**
   * This object contains information on the latest pointer state. Is it updated whenever
   * an input pointer is moved.
   */
  private latestInput: InputState = null;

  /** This timeout is used to clear the menu div after the fade-out animation. */
  private hideTimeout: NodeJS.Timeout;

  /** This timeout is used to initialize the menu position on mouse enter. */
  private initialPositionTimeout: NodeJS.Timeout;

  /**
   * The time when the current menu was shown. Used to track selection times for
   * achievements.
   */
  private menuShownTime: number;

  /**
   * The constructor will attach event listeners to the given container element. It will
   * also initialize the input tracker and the gesture detection.
   *
   * @param container The HTML element which contains the menu.
   * @param theme The theme to use for rendering the menu.
   * @param centerText The center text manager to use for showing text in the center of
   *   the menu.
   * @param options Use this to tweak the behavior of the menu.
   */
  constructor(
    private container: HTMLElement,
    private theme: MenuTheme,
    private centerText: CenterText,
    private settings: GeneralSettings
  ) {
    super();

    this.updateSettings(settings);
    this.initializeInput();
  }

  /**
   * This method is called when the menu is shown. It will create the DOM tree for the
   * given root item and all its children. It will also set up the angles and positions of
   * all items and show the menu.
   *
   * @param showMenuOptions Some additional information on how to show the menu.
   */
  public show(root: RenderedRootMenuItem, showMenuOptions: ShowMenuOptions) {
    // Cancel any ongoing hiding.
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.clear();

    this.emitMenuInteractionEvent(MenuInteractionType.eOpenMenu);

    this.showMenuOptions = showMenuOptions;

    // If the pointer is not warped to the center of the menu, we should not enter
    // turbo-mode right away.
    const deferTurboMode = !this.settings.warpMouse && showMenuOptions.centeredMode;
    this.pointerInput.onShowMenu(deferTurboMode);

    // In anchored mode, we have to disable turbo and marking mode.
    this.pointerInput.enableMarkingMode =
      this.settings.enableMarkingMode && !showMenuOptions.anchoredMode;
    this.pointerInput.enableTurboMode =
      this.settings.enableTurboMode &&
      !showMenuOptions.anchoredMode &&
      !this.settings.keepInputFocus;

    // Enable hover mode if configured for the menu.
    this.pointerInput.enableHoverMode = showMenuOptions.hoverMode;
    this.pointerInput.hoverModeNeedsConfirmation =
      this.settings.hoverModeNeedsConfirmation;

    this.root = root;
    this.createRenderData(this.root, this.container);

    // On Windows, the menu position passed from the main process is sometimes not
    // correct. For instance, this happens when using pen input with Windows Ink enabled.
    // To work around this, we wait a few milliseconds until the first mouse enter event
    // arrives and show the menu there. If no mouse enter event arrives within that time,
    // we simply show the menu at the given position.
    const showMenu = () => {
      const menuPosition = this.getInitialMenuPosition();
      const toPointer = math.subtract(this.showMenuOptions.mousePosition, menuPosition);

      this.latestInput = {
        button: ButtonState.eReleased,
        absolutePosition: this.showMenuOptions.mousePosition,
        relativePosition: toPointer,
        distance: math.getLength(toPointer),
        angle: math.getAngle(toPointer),
      };

      this.container.classList.add('no-transitions');
      this.selectItem(this.root, menuPosition);

      // To ensure that all DOM changes are applied, flush the browser's rendering
      // pipeline first.
      this.container.getBoundingClientRect();

      if (this.settings.enableMenuAnimations) {
        this.container.classList.remove('no-transitions');
      }

      // If required, move the pointer to the center of the menu.
      if (this.settings.warpMouse && this.showMenuOptions.centeredMode) {
        const offset = math.subtract(
          this.getInitialMenuPosition(),
          this.showMenuOptions.mousePosition
        );
        this.emit('move-pointer', offset);
      }

      // Finally, show the menu.
      this.container.classList.remove('hidden');
      this.menuShownTime = Date.now();
    };

    if (cIsWindows && this.settings.windowsInkWorkaround) {
      const onMouseEnter = (e: MouseEvent) => {
        this.showMenuOptions = {
          ...this.showMenuOptions,
          mousePosition: { x: e.clientX, y: e.clientY },
        };
        clearTimeout(this.initialPositionTimeout);
        showMenu();
        this.container.removeEventListener('mouseenter', onMouseEnter);
      };

      this.initialPositionTimeout = setTimeout(() => {
        this.container.removeEventListener('mouseenter', onMouseEnter);
        showMenu();
      }, 100);

      this.container.addEventListener('mouseenter', onMouseEnter);
    } else {
      showMenu();
    }
  }

  /** Removes all DOM elements from the menu and resets the root menu item. */
  public clear() {
    this.container.className = 'hidden';
    this.container.innerHTML = '';
    this.root = null;
    this.showMenuOptions = null;
    this.selectionWedges = null;
    this.wedgeSeparators = null;
    this.hoveredItem = null;
    this.draggedItem = null;
    this.centerItem = null;
    clearTimeout(this.hideTimeout);
    clearTimeout(this.initialPositionTimeout);
    this.hideTimeout = null;
    this.initialPositionTimeout = null;
  }

  /**
   * Returns the currently shown menu. If no menu is shown, two times null is returned.
   *
   * @returns The currently shown menu and the menu options. If no menu is shown, two
   *   times null is returned.
   */
  public getCurrentRequest(): [RenderedRootMenuItem, ShowMenuOptions] {
    return [this.root, this.showMenuOptions];
  }

  /**
   * Allow changing the options at run-time.
   *
   * @param options The new options.
   */
  public updateSettings(settings: GeneralSettings) {
    this.settings = settings;

    this.container.style.setProperty(
      '--fade-in-duration',
      `${this.settings.fadeInDuration}ms`
    );

    this.container.style.setProperty(
      '--fade-out-duration',
      `${this.settings.fadeOutDuration}ms`
    );
    this.pointerInput.enableMarkingMode = this.settings.enableMarkingMode;
    this.pointerInput.enableTurboMode = this.settings.enableTurboMode;
    this.pointerInput.dragThreshold = this.settings.dragThreshold;
    this.pointerInput.hoverModeNeedsConfirmation =
      this.settings.hoverModeNeedsConfirmation;

    this.pointerInput.gestureDetector.minStrokeLength =
      this.settings.gestureMinStrokeLength;
    this.pointerInput.gestureDetector.minStrokeAngle =
      this.settings.gestureMinStrokeAngle;
    this.pointerInput.gestureDetector.jitterThreshold =
      this.settings.gestureJitterThreshold;
    this.pointerInput.gestureDetector.pauseTimeout = this.settings.gesturePauseTimeout;
    this.pointerInput.gestureDetector.fixedStrokeLength = this.settings.fixedStrokeLength;
    this.pointerInput.gestureDetector.centerDeadZone = this.settings.centerDeadZone;

    this.gamepadInput.enabled = this.settings.enableGamepad;
    this.gamepadInput.parentDistance = this.settings.minParentDistance;
    this.gamepadInput.backButton = this.settings.gamepadBackButton;
    this.gamepadInput.closeButton = this.settings.gamepadCloseButton;
  }

  /** There are two types of interactions which can be triggered by the host process. */
  public triggerInteraction(
    type: MenuInteractionType.eCloseMenu | MenuInteractionType.eCloseSubmenu
  ) {
    if (
      type === MenuInteractionType.eCloseSubmenu &&
      this.centerItem &&
      this.centerItem.type === 'submenu'
    ) {
      this.selectParent();
    }

    if (type === MenuInteractionType.eCloseMenu) {
      this.hide();
    }
  }

  // --------------------------------------------------------------------- private methods

  /**
   * This method initializes the input devices. It attaches event listeners to the input
   * devices and sets up the gesture detection.
   */
  private initializeInput() {
    const onCloseMenu = () => {
      if (this.settings.rmbSelectsParent) {
        this.selectParent();
      } else {
        this.hide();
      }
    };

    const onUpdateState = (state: InputState) => {
      this.latestInput = state;
      if (this.centerItem) {
        this.redraw();
      }
    };

    const onSelection = (coords: Vec2, type: SelectionType, source: SelectionSource) => {
      // Ignore all input if the menu is in the process of hiding.
      if (this.container.classList.contains('hidden')) {
        return;
      }

      if (type === SelectionType.eParent) {
        this.selectParent(coords);
        return;
      }

      // If we are in Marking Mode or Turbo Mode, the selection type will be eSubmenuOnly.
      // In this case, we only select submenus in order to prevent unwanted actions. This
      // way the user can always check if the correct action was selected before executing
      // it. We also do not trigger selections of the parent item when moving the mouse in
      // the center zone of the menu. This feels more natural and prevents accidental
      // selections.
      const item = this.hoveredItem || this.clickedItem || this.draggedItem;
      if (
        type === SelectionType.eSubmenuOnly &&
        item &&
        (item.type === 'submenu' || item.type === 'root') &&
        this.latestInput.distance > this.settings.centerDeadZone
      ) {
        let interaction = MenuInteractionType.eOpenSubmenu;
        let path = item.renderData.path;

        if (item === this.centerItem.renderData.parent) {
          interaction = MenuInteractionType.eCloseSubmenu;
          path = this.centerItem.renderData.path;
        }

        this.emitItemInteractionEvent(interaction, path);

        this.selectItem(item, coords);

        return;
      }

      // If there is a clicked item, select it.
      if (type === SelectionType.eActiveItem && item) {
        let interaction = MenuInteractionType.eOpenSubmenu;
        let path = item.renderData.path;

        if (item === this.centerItem) {
          interaction = MenuInteractionType.eActivateSubmenu;
        } else if (item.type === 'button') {
          interaction = MenuInteractionType.eSelectButton;
        } else if (item === this.centerItem.renderData.parent) {
          interaction = MenuInteractionType.eCloseSubmenu;
          path = this.centerItem.renderData.path;
        }

        if (interaction === MenuInteractionType.eSelectButton) {
          this.emitSelectionEvent(item, source);
        } else {
          this.emitItemInteractionEvent(interaction, path);
        }

        if (item.type !== 'button') {
          this.selectItem(item, coords);
        }

        return;
      }

      // If there is no hovered, clicked or dragged item, the user most likely clicked
      // somewhere outside of the menu.
      if (type === SelectionType.eActiveItem && item === null) {
        this.hide();
      }
    };

    this.pointerInput.onCloseMenu(onCloseMenu);
    this.gamepadInput.onCloseMenu(onCloseMenu);

    this.pointerInput.onUpdateState(onUpdateState);
    this.gamepadInput.onUpdateState(onUpdateState);

    this.pointerInput.onSelection(onSelection);
    this.gamepadInput.onSelection(onSelection);

    // Handle keyboard events for quick selection and going back to the parent item.
    document.addEventListener('keydown', (event) => {
      if (this.container.classList.contains('hidden')) {
        return;
      }

      const anyModifierPressed =
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;

      if (!anyModifierPressed) {
        const eventKey = KeyMapper.getName(event).toLocaleLowerCase();

        // Then we check whether the center-click-workflow of the center item got triggered.
        if (
          (this.centerItem.type === 'submenu' || this.centerItem.type === 'root') &&
          this.centerItem.activateWorkflow?.quickSelectKey
        ) {
          if (
            this.centerItem.activateWorkflow.quickSelectKey.toLocaleLowerCase() ===
            eventKey
          ) {
            this.emitItemInteractionEvent(
              MenuInteractionType.eActivateSubmenu,
              this.centerItem.renderData.path
            );
            return;
          }
        }

        // Then we check whether any select-workflow of the menu items got triggered by
        // the quick select key.
        if (this.centerItem.type === 'submenu' || this.centerItem.type === 'root') {
          for (let i = 0; i < this.centerItem.children.length; i++) {
            const child = this.centerItem.children[i];

            const selectionKeys = [];
            if (child.type === 'button' && child.selectWorkflow?.quickSelectKey) {
              selectionKeys.push(child.selectWorkflow.quickSelectKey.toLocaleLowerCase());
            } else if (child.type === 'submenu' && child.openWorkflow?.quickSelectKey) {
              selectionKeys.push(child.openWorkflow.quickSelectKey.toLocaleLowerCase());
            } else if (i < 9) {
              selectionKeys.push(`${i + 1}`);
              selectionKeys.push(`num${i + 1}`);
            }

            console.log('selectionKeys', selectionKeys, eventKey);

            if (selectionKeys.includes(eventKey)) {
              this.emitSelectionEvent(child, SelectionSource.eKeyboard);
              this.selectItem(child, this.getCenterItemPosition());
              return;
            }
          }
        }

        // Finally, we check whether any hover-workflow of the menu items got triggered.
        if (this.centerItem.type === 'submenu' || this.centerItem.type === 'root') {
          for (let i = 0; i < this.centerItem.children.length; i++) {
            const child = this.centerItem.children[i] as RenderedChildMenuItem;

            if (child.hoverWorkflow?.quickSelectKey) {
              if (child.hoverWorkflow.quickSelectKey.toLocaleLowerCase() === eventKey) {
                this.hoverAngle(child.renderData.computedAngle);
                return;
              }
            }
          }
        }
      }

      if (
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowUp' ||
        event.key === 'ArrowRight' ||
        event.key === 'ArrowDown'
      ) {
        this.changeHoveredItem(event.key);
        return;
      }

      if (event.key === 'Enter') {
        if (this.hoveredItem) {
          if (this.hoveredItem === this.centerItem) {
            this.emitItemInteractionEvent(
              MenuInteractionType.eActivateSubmenu,
              this.hoveredItem.renderData.path
            );
          } else if (this.hoveredItem.type === 'submenu') {
            this.emitItemInteractionEvent(
              MenuInteractionType.eOpenSubmenu,
              this.hoveredItem.renderData.path
            );
            this.selectItem(this.hoveredItem);
          } else {
            this.emitSelectionEvent(this.hoveredItem, SelectionSource.eKeyboard);
            this.selectItem(this.hoveredItem);
          }

          return;
        }
      }

      if (event.key !== 'Escape') {
        this.pointerInput.onKeyDownEvent();
      }
    });

    // If the last modifier is released while a menu item is dragged around, we select it.
    // This enables selections in "Turbo-Mode", where items can be selected with mouse
    // movements without pressing the left mouse button but by holding a keyboard key
    // instead.
    document.addEventListener('keyup', (event) => {
      if (this.container.classList.contains('hidden')) {
        return;
      }

      if (event.key === 'Escape') {
        return;
      }

      this.pointerInput.onKeyUpEvent(event);
    });

    this.container.addEventListener('pointerdown', (e) => {
      this.pointerInput.onPointerDownEvent(e);
    });
    this.container.addEventListener('pointermove', (e) => {
      this.pointerInput.onMotionEvent(e);
    });
    this.container.addEventListener('touchmove', (e) => {
      this.pointerInput.onMotionEvent(e);
    });
    this.container.addEventListener('pointerup', (e) => {
      this.pointerInput.onPointerUpEvent(e);
    });
  }

  /** Hides the menu. */
  private hide() {
    if (!this.hideTimeout) {
      this.container.classList.add('hidden');

      this.hideTimeout = setTimeout(() => {
        this.clear();
      }, this.settings.fadeOutDuration);

      this.emitMenuInteractionEvent(MenuInteractionType.eCloseMenu);
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
   * @param coords The position where the selection most likely happened. If it is not
   *   given, the latest pointer input position is used.
   */
  private selectItem(item: RenderedMenuItem, coords?: Vec2) {
    if (this.centerItem === item) {
      return;
    }

    this.clickItem(null);
    this.dragItem(null);

    // Is the item the parent of the currently active item?
    const selectedParent = item == this.centerItem?.renderData.parent;

    this.centerItem = item;

    // Now we have to position the root element of the menu at a position so that the
    // newly selected menu item is at the mouse position or at the given coordinates (if
    // any is provided). For this, we first compute ideal position of the new item based
    // on its angle and the mouse distance to the current center. There is the special
    // case where we selected the root item. In this case, we simply position the root
    // element at the mouse position.
    if (item.type === 'root') {
      this.centerItem.renderData.position = this.showMenuOptions.anchoredMode
        ? this.getInitialMenuPosition()
        : coords || this.latestInput.absolutePosition;
    } else {
      // First we compute the distance to the parent item. In anchored mode, the distance
      // is set to this.settings.minParentDistance. If a parent was selected, we keep the
      // original offset, if a child was selected, we use the latest input distance.
      let distance = this.settings.minParentDistance;

      if (!this.showMenuOptions.anchoredMode) {
        if (selectedParent) {
          distance = math.getLength(item.renderData.position);
        } else {
          distance = Math.max(this.settings.minParentDistance, this.latestInput.distance);
        }
      }

      // Compute the item's position based on its angle the computed distance.
      item.renderData.position = math.getDirection(
        item.renderData.computedAngle,
        distance
      );

      // Now we want to move the root item so that the newly selected item is at the given
      // coordinates or at the mouse position. In anchored mode we want to always use the
      // initial menu position.
      let targetAbsolutePosition = { x: 0, y: 0 };

      if (this.showMenuOptions.anchoredMode) {
        targetAbsolutePosition = this.getInitialMenuPosition();
      } else {
        targetAbsolutePosition = coords || this.latestInput.absolutePosition;
      }

      const offset = math.subtract(targetAbsolutePosition, this.getCenterItemPosition());
      this.root.renderData.position = math.add(this.root.renderData.position, offset);
    }

    // Clamp the position of the newly selected submenu to the viewport. We warp the mouse
    // pointer if the menu is shifted.
    if (item.type === 'submenu' || item.type === 'root') {
      const position = this.getCenterItemPosition();

      const clampedPosition = math.clampToMonitor(
        position,
        this.theme.maxMenuRadius,
        this.showMenuOptions.windowSize
      );

      const offset = {
        x: Math.trunc(clampedPosition.x - position.x),
        y: Math.trunc(clampedPosition.y - position.y),
      };

      if (offset.x !== 0 || offset.y !== 0) {
        if (!this.showMenuOptions.anchoredMode && this.settings.warpMouse) {
          this.emit('move-pointer', offset);
        }

        this.root.renderData.position = math.add(this.root.renderData.position, offset);
      }

      // Update the mouse info based on the newly selected item's position.
      this.latestInput.absolutePosition = clampedPosition;
      this.latestInput.relativePosition = { x: 0, y: 0 };
      this.latestInput.distance = 0;
      this.latestInput.angle = 0;

      this.pointerInput.setCurrentCenter(clampedPosition, this.settings.centerDeadZone);
      this.gamepadInput.setCurrentCenter(clampedPosition);

      // Assemble a list of angles for the selection-wedge separators.
      const separators = item.children.map((child) => {
        return (child as RenderedChildMenuItem).renderData.wedge.start;
      });

      if (item.renderData.parentWedge) {
        separators.push(item.renderData.parentWedge.start);
      }

      this.selectionWedges?.setCenter(clampedPosition);
      this.wedgeSeparators?.setSeparators(separators, clampedPosition);
    }

    // Finally update the CSS classes of all DOM nodes according to the new selection chain
    // and update the connectors.
    this.updateCSSClasses();
    this.updateConnectors();
    this.redraw();
  }

  /**
   * This method will select the parent of the currently selected item. If the currently
   * selected item is the root item, the "cancel" event will be emitted.
   *
   * @param coords The position where the selection most likely happened. If it is not
   *   given, the latest pointer input position is used.
   */
  private selectParent(coords?: Vec2) {
    if (this.centerItem === this.root) {
      this.hide();
      return;
    }

    this.emitItemInteractionEvent(
      MenuInteractionType.eCloseSubmenu,
      this.centerItem.renderData.path
    );
    this.selectItem(this.centerItem.renderData.parent, coords);
  }

  /**
   * This will assign the CSS class 'hovered' to the given menu item's node div element.
   * It will also remove the class from the previously hovered menu item.
   *
   * @param item The item to hover. If null, the currently hovered item will be unhovered.
   */
  private hoverItem(item?: RenderedMenuItem) {
    if (this.hoveredItem === item) {
      return;
    }

    // Tell the selection wedges about the hovered wedge.
    if (this.selectionWedges) {
      if (item === this.centerItem.renderData.parent) {
        // Only highlight the parent wedge if this.hoveredItem !== null. This is only the
        // case if we did not just entered a submenu. It looks better this way. Else the
        // parent wedge would be highlighted already when entering a submenu.
        if (this.centerItem.renderData.parentWedge && this.hoveredItem !== null) {
          this.selectionWedges.hover(this.centerItem.renderData.parentWedge);
        } else {
          this.selectionWedges.unhover();
        }
      } else if (item.type !== 'root' && item.renderData.wedge) {
        this.selectionWedges.hover(item.renderData.wedge);
      } else {
        this.selectionWedges.unhover();
      }
    }

    if (this.hoveredItem) {
      this.hoveredItem.renderData.nodeDiv.classList.remove('hovered');
      this.hoveredItem = null;
    }

    if (item) {
      this.hoveredItem = item;
      this.hoveredItem.renderData.nodeDiv.classList.add('hovered');

      let interaction = MenuInteractionType.eHoverSubmenu;

      if (item === this.centerItem) {
        interaction = MenuInteractionType.eHoverCenter;
      } else if (item === this.centerItem.renderData.parent) {
        interaction = MenuInteractionType.eHoverParent;
      } else if (item.type === 'button') {
        interaction = MenuInteractionType.eHoverButton;
      }

      this.emitItemInteractionEvent(interaction, this.hoveredItem.renderData.path);
    }
  }

  /**
   * Helper method to move hover focus to the given angle. We do this by simulating a
   * pointer input at the position of the given angle.
   *
   * @param angle The angle to hover, 0° means top, 90° means right, etc.
   */
  private hoverAngle(angle: number) {
    const centerPosition = this.getCenterItemPosition();
    const distance = this.settings.minParentDistance;
    const relativePosition = math.getDirection(angle, distance);
    const absolutePosition = math.add(centerPosition, relativePosition);
    this.latestInput = {
      button: this.latestInput.button,
      absolutePosition,
      relativePosition,
      distance,
      angle,
    };

    this.redraw();
  }

  /**
   * This will change the currently hovered item based on the given keyboard direction. It
   * will check if there is a menu item in the given direction and hover it. If two items
   * are at the same distance in the given direction (e.g. we are currently hovering the
   * left-most item and press ArrowRight), we will hover the item on the other side of the
   * menu (e.g. the right-most item).
   *
   * @param key The keyboard direction to change the hovered item to.
   */
  private changeHoveredItem(key: 'ArrowLeft' | 'ArrowUp' | 'ArrowRight' | 'ArrowDown') {
    const direction = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ArrowLeft: { x: -1, y: 0 },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ArrowUp: { x: 0, y: -1 },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ArrowRight: { x: 1, y: 0 },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ArrowDown: { x: 0, y: 1 },
    }[key];

    // Let's compile a list of selectable items. These are the child items and the parent
    // item (if any).
    const candidates: {
      item: RenderedMenuItem;
      // The angle towards the item, 0° means top, 90° means right, etc.
      angle: number;
      // The dot product of the direction to the item and the target direction.
      dotToTarget: number;
    }[] = [];

    if (this.centerItem.type === 'submenu' || this.centerItem.type === 'root') {
      for (const child of this.centerItem.children as RenderedChildMenuItem[]) {
        const childDir = math.getDirection(child.renderData.computedAngle, 1);
        const childDot = math.dot(direction, childDir);
        candidates.push({
          item: child as RenderedMenuItem,
          angle: child.renderData.computedAngle,
          dotToTarget: childDot,
        });
      }
    }

    if (this.centerItem.renderData.parent) {
      const parentAngle = (this.centerItem.renderData.computedAngle + 180) % 360;
      const parentDir = math.getDirection(parentAngle, 1);
      const parentDot = math.dot(direction, parentDir);
      candidates.push({
        item: this.centerItem.renderData.parent,
        angle: parentAngle,
        dotToTarget: parentDot,
      });
    }

    if (candidates.length === 0) {
      return;
    }

    // First, we look for the "extreme" item in the given direction. For instance, if the
    // direction is ArrowRight, we look for the right-most item.
    let extremeItem = null;

    for (const candidate of candidates) {
      if (candidate.dotToTarget > Math.cos(math.toRadians(45))) {
        if (!extremeItem) {
          extremeItem = candidate;
        } else {
          const extremeDir = math.getDirection(extremeItem.angle, 1);
          const extremeDot = math.dot(direction, extremeDir);

          if (candidate.dotToTarget > extremeDot) {
            extremeItem = candidate;
          }
        }
      }
    }

    // If the hovered item is already the extreme item, we can stop here.
    if (this.hoveredItem === extremeItem?.item) {
      return;
    }

    // If we have currently no hovered item or hover the center item, we simply hover the
    // extreme item. If there is no extreme item, we do not hover anything.
    if (!this.hoveredItem || this.hoveredItem === this.centerItem) {
      if (extremeItem) {
        this.hoverAngle(extremeItem.angle);
      }
      return;
    }

    // In all other cases, we have a hovered item which is either a child of the center
    // or its parent. Let's compute the direction towards the hovered item.
    let hoveredDir;
    let hoveredAngle;

    if (this.hoveredItem === this.centerItem.renderData.parent) {
      hoveredAngle = (this.centerItem.renderData.computedAngle + 180) % 360;
      hoveredDir = math.getDirection(hoveredAngle, 1);
    } else {
      hoveredAngle = this.hoveredItem.renderData.computedAngle;
      hoveredDir = math.getDirection(hoveredAngle, 1);
    }

    // First, there is the case that we hover an item which is mostly in the opposite
    // direction than our target direction. For instance, we hover one of the left-most
    // items and press ArrowRight. In this case, we want to hover the right-most item.
    if (this.hoveredItem && extremeItem) {
      const oppositeDir = { x: -direction.x, y: -direction.y };
      const hoveredDot = math.dot(oppositeDir, hoveredDir);

      if (hoveredDot > Math.cos(math.toRadians(20))) {
        this.hoverAngle(extremeItem.angle);
        return;
      }
    }

    // In any other case, we look for the item which is a neighbour of the currently
    // hovered item which gets the selection closer to the target direction.
    if (candidates.length > 1) {
      // True, if the target direction is clockwise from the hovered item direction.
      const clockwise = math.isClockwise(hoveredDir, direction);

      // Now look for the candidate which is also clockwise / counter-clockwise from the
      // hovered item and has the smallest angular distance to the hovered item.
      let bestCandidate = null;
      let bestDistance = 360;

      for (const candidate of candidates) {
        if (candidate.item === this.hoveredItem) {
          continue;
        }
        const candidateDir = math.getDirection(candidate.angle, 1);
        const candidateCW = math.isClockwise(hoveredDir, candidateDir);
        const candidateDot = math.dot(hoveredDir, candidateDir);
        const angleDiff = math.getAngularDifference(hoveredAngle, candidate.angle);

        if (
          (candidateCW === clockwise || candidateDot < Math.cos(math.toRadians(160))) &&
          angleDiff < bestDistance
        ) {
          bestCandidate = candidate;
          bestDistance = angleDiff;
        }
      }

      if (bestCandidate) {
        this.hoverAngle(bestCandidate.angle);
      }
    }
  }

  /**
   * This will assign the CSS class 'clicked' to the given menu item's node div element.
   * It will also remove the class from the previously clicked menu item.
   *
   * @param item The item to click. If null, the previously clicked item will be
   *   unclicked.
   */
  private clickItem(item?: RenderedMenuItem) {
    if (this.clickedItem === item) {
      return;
    }

    if (this.clickedItem) {
      this.clickedItem.renderData.nodeDiv.classList.remove('clicked');
      this.clickedItem = null;
    }

    if (item) {
      this.clickedItem = item;
      this.clickedItem.renderData.nodeDiv.classList.add('clicked');
    }
  }

  /**
   * This will assign the CSS class 'dragged' to the given menu item's node div element.
   * It will also remove the class from the previously dragged menu item.
   *
   * @param item The item to drag. If null, the previously dragged item will be
   *   un-dragged.
   */
  private dragItem(item?: RenderedMenuItem) {
    this.clickItem(null);

    if (this.draggedItem === item) {
      return;
    }

    if (this.draggedItem) {
      this.draggedItem.renderData.nodeDiv.classList.remove('dragged');
      this.draggedItem = null;
    }

    if (item) {
      this.draggedItem = item;
      this.draggedItem.renderData.nodeDiv.classList.add('dragged');
    }
  }

  /** This method updates the transformation of all items in the menu. */
  private redraw() {
    const newHoveredItem = this.computeHoveredItem();

    // If no item is hovered, if the mouse is over the center of the menu, or if the
    // mouse is over the parent of the current menu, hide the center text. Else, we
    // display the name of the hovered item and make sure it is positioned at the
    // center of the menu.
    if (
      !newHoveredItem ||
      this.centerItem.renderData.parent === newHoveredItem ||
      this.centerItem === newHoveredItem
    ) {
      this.centerText.hide();
    } else if (newHoveredItem.type !== 'root' && newHoveredItem !== this.hoveredItem) {
      const position = this.getCenterItemPosition();
      this.centerText.show(
        newHoveredItem.name,
        position,
        this.getQuickSelectKey(newHoveredItem)
      );
    }

    if (newHoveredItem !== this.hoveredItem) {
      this.hoverItem(newHoveredItem);
    }

    if (this.draggedItem && this.draggedItem !== this.hoveredItem) {
      this.dragItem(this.hoveredItem);
    }

    if (this.latestInput.button === ButtonState.eClicked && !this.clickedItem) {
      this.clickItem(this.hoveredItem);
      this.updateConnectors();
    }

    // If the mouse is dragged over a menu item, make that item the dragged item.
    if (
      this.latestInput.button === ButtonState.eDragged &&
      !this.draggedItem &&
      this.latestInput.distance > this.settings.centerDeadZone &&
      this.hoveredItem
    ) {
      this.dragItem(this.hoveredItem);
    }

    // Abort item-dragging when dragging the item over the center of the currently active
    // menu.
    if (
      this.latestInput.button === ButtonState.eDragged &&
      this.draggedItem &&
      this.latestInput.distance < this.settings.centerDeadZone
    ) {
      this.dragItem(null);
    }

    // Abort item dragging if the mouse button was released.
    if (this.latestInput.button === ButtonState.eReleased && this.draggedItem) {
      this.dragItem(null);
    }

    // Un-click an item if mouse button was released.
    if (this.latestInput.button === ButtonState.eReleased && this.clickedItem) {
      this.clickItem(null);
    }

    // Update all transformations.
    this.updateTransform();
    this.updateConnectors();
  }

  /**
   * This method computes the item which is currently hovered by the mouse. This is either
   * one of the children of the center item or the parent of the center item.
   *
   * @returns The menu item that is currently hovered by the mouse. Can be null if the
   *   center of the root menu is hovered.
   */
  private computeHoveredItem(): RenderedMenuItem {
    // If the mouse is in the center of the menu, return the center item.
    if (this.latestInput.distance < this.settings.centerDeadZone) {
      return this.centerItem;
    }

    // If we are currently not in marking mode or turbo mode and the user hovers outside
    // of the menu, there is no hovered item. If showing the root menu item, we consider
    // "outside of the menu" to be any position far away from the center. If showing a
    // submenu, we consider "outside of the menu" to be any position far away from the
    // line connecting the submenu to its parent.
    if (
      this.latestInput.button !== ButtonState.eDragged &&
      this.settings.maxSelectionRadius > 0
    ) {
      let minDistance = this.latestInput.distance;

      if (this.centerItem.renderData.parent) {
        const connectorEnd = this.getCenterItemPosition();
        const connectorStart = math.subtract(
          connectorEnd,
          this.centerItem.renderData.parent.renderData.position
        );

        const distance = math.getDistanceToLineSegment(
          this.latestInput.absolutePosition,
          connectorStart,
          connectorEnd
        );

        minDistance = Math.min(minDistance, distance);
      }

      if (minDistance > this.settings.maxSelectionRadius) {
        return null;
      }
    }

    // If the mouse is not in the center, check if it is in one of the children of the
    // currently selected item.
    if (this.centerItem.type === 'submenu' || this.centerItem.type === 'root') {
      for (const child of this.centerItem.children as RenderedChildMenuItem[]) {
        if (
          math.isAngleBetween(
            this.latestInput.angle,
            child.renderData.wedge.start,
            child.renderData.wedge.end
          )
        ) {
          return child;
        }
      }
    }

    // If the mouse is not in the center and not in one of the children, it is most likely
    // in the parent's wedge. Return the parent of the currently selected item.
    if (this.centerItem.renderData.parent) {
      return this.centerItem.renderData.parent;
    }

    // This should actually never happen.
    return null;
  }

  /**
   * This method updates the transform properties of all menu items along the selection
   * chain. All other item's transforms are reset as they are positioned relative to their
   * parent items using CSS.
   */
  private updateTransform() {
    let item = this.centerItem;

    while (item) {
      item.renderData.nodeDiv.style.transform = `translate(${item.renderData.position.x}px, ${item.renderData.position.y}px)`;

      if (item === this.centerItem) {
        let hoveredAngle;

        if (this.hoveredItem && this.hoveredItem.type !== 'root') {
          hoveredAngle = this.hoveredItem?.renderData.computedAngle;
          if (this.hoveredItem === this.centerItem.renderData.parent) {
            hoveredAngle = (item.renderData.computedAngle + 180) % 360;
          }
        }

        this.theme.setCenterProperties(
          item,
          this.latestInput.angle,
          hoveredAngle,
          this.hoveredItem === this.centerItem.renderData.parent
        );

        if (item.type === 'submenu' || item.type === 'root') {
          for (let j = 0; j < item.children.length; ++j) {
            const child = item.children[j] as RenderedChildMenuItem;
            if (child === this.draggedItem) {
              child.renderData.position = this.latestInput.relativePosition;
              child.renderData.nodeDiv.style.transform = `translate(${child.renderData.position.x}px, ${child.renderData.position.y}px)`;
            } else {
              // Set the custom CSS properties of the item, like the angular difference between
              // the item and the mouse pointer direction.
              this.theme.setChildProperties(
                child,
                this.settings.enablePointerReactiveEffects
                  ? this.latestInput.angle
                  : (child.renderData.computedAngle + 180) % 360
              );
              child.renderData.nodeDiv.style.transform = '';
              delete child.renderData.position;
            }
          }
        }
      }

      item = item.renderData.parent;
    }
  }

  /**
   * Iterate over the selection chain and update the length (width) and rotation of all
   * connector divs so that they connect consecutive menu items.
   */
  private updateConnectors() {
    let connectorStartItem = this.centerItem;
    let connectorEndItem = null;
    let drawConnector = true;

    // We start with the connector of the center item (or its parent if a leaf item is
    // currently being selected). We only draw its connector if one of its children is
    // currently dragged around or clicked. Otherwise, the connector will be drawn with
    // length 0 - hence it's invisible but we use it to rotate the connector to the
    // hovered child so that it will point about in the right direction when it becomes
    // visible.
    if (this.centerItem.type !== 'submenu' && this.centerItem.type !== 'root') {
      connectorEndItem = this.centerItem;
      connectorStartItem = this.centerItem.renderData.parent;
    } else {
      if (this.draggedItem && this.draggedItem.renderData.parent === this.centerItem) {
        connectorEndItem = this.draggedItem;
      } else if (
        this.clickedItem &&
        this.clickedItem != this.centerItem &&
        this.clickedItem != this.centerItem.renderData.parent
      ) {
        connectorEndItem = this.clickedItem as RenderedChildMenuItem;
      } else if (this.hoveredItem && this.hoveredItem != this.centerItem) {
        connectorEndItem = this.hoveredItem as RenderedChildMenuItem;
        drawConnector = false;
      }
    }

    while (connectorStartItem) {
      if (connectorEndItem) {
        let length = 0;
        let angle = connectorEndItem.renderData.computedAngle;

        if (connectorEndItem.renderData.position) {
          length = drawConnector
            ? math.getLength(connectorEndItem.renderData.position)
            : 0;
          angle = math.getAngle(connectorEndItem.renderData.position);
        }

        angle = math.getClosestEquivalentAngle(
          angle,
          connectorStartItem.renderData.lastConnectorAngle
        );
        connectorStartItem.renderData.lastConnectorAngle = angle;

        connectorStartItem.renderData.connectorDiv.style.width = `${length}px`;
        connectorStartItem.renderData.connectorDiv.style.transform = `rotate(${angle - 90}deg)`;
      } else {
        connectorStartItem.renderData.connectorDiv.style.width = '0px';
      }

      connectorEndItem = connectorStartItem;
      connectorStartItem = connectorStartItem.renderData.parent;
      drawConnector = true;
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
    const clearClasses = (item: RenderedMenuItem) => {
      item.renderData.nodeDiv.classList.remove('active', 'parent', 'child', 'grandchild');
    };

    // Set the class for the center item.
    clearClasses(this.centerItem);
    this.centerItem.renderData.nodeDiv.classList.add('active');

    // Set the classes for the children and grandchildren of the center item.
    if (this.centerItem.type === 'submenu' || this.centerItem.type === 'root') {
      for (const child of this.centerItem.children as RenderedChildMenuItem[]) {
        clearClasses(child);
        child.renderData.nodeDiv.classList.add('child');

        if (child.type === 'submenu') {
          for (const grandchild of child.children as RenderedChildMenuItem[]) {
            clearClasses(grandchild);
            grandchild.renderData.nodeDiv.classList.add('grandchild');
          }
        }
      }
    }

    // Set the classes for the parents and grandparents of the center item.
    let child = this.centerItem;
    let parent = this.centerItem.renderData.parent;

    while (parent) {
      clearClasses(parent);

      parent.renderData.nodeDiv.classList.add('parent');

      if (parent.type === 'submenu' || parent.type === 'root') {
        for (const item of parent.children as RenderedChildMenuItem[]) {
          if (item !== child) {
            clearClasses(item);
            item.renderData.nodeDiv.classList.add('grandchild');
          }
        }
      }

      child = parent;
      parent = parent.renderData.parent;
    }
  }

  /**
   * This method assigns the render-data object to each menu item. The render-data object
   * contains all information that is needed to render the menu item, like its position,
   * angle, wedge, etc. It also creates the DOM elements for each menu item by calling the
   * theme's createItem method and appending the created node to the given container.
   *
   * @param rootItem The root menu item to create the render data for.
   * @param rootContainer The container to append the root menu item to.
   */
  private createRenderData(rootItem: RenderedMenuItem, rootContainer: HTMLElement) {
    const queue = [];

    queue.push({
      item: rootItem,
      parent: null,
      container: rootContainer,
      level: 0,
      index: 0,
      angle: 0,
      wedge: { start: 0, end: 0 },
    });

    while (queue.length > 0) {
      const { item, parent, container, level, index, angle, wedge } = queue.shift();

      item.renderData = {
        path: parent ? [...parent.renderData.path, index] : [],
        parent,
        position: { x: 0, y: 0 },
        computedAngle: angle,
        nodeDiv: this.theme.createItem(item),
        connectorDiv: null,
        lastConnectorAngle: 0,
        lastPointerAngle: 0,
        lastHoveredChildAngle: 0,
        wedge,
        parentWedge: { start: 0, end: 0 },
      };

      if (this.theme.drawChildrenBelow && level > 0) {
        container.insertBefore(item.renderData.nodeDiv, container.firstChild);
      } else {
        container.appendChild(item.renderData.nodeDiv);
      }

      // Set the direction of the item. This is used by the theme to position the item
      // correctly.
      if (item.type !== 'root') {
        const dir = math.getDirection(item.renderData.computedAngle, 1.0);
        item.renderData.nodeDiv.style.setProperty('--dir-x', dir.x.toString());
        item.renderData.nodeDiv.style.setProperty('--dir-y', dir.y.toString());
        item.renderData.nodeDiv.style.setProperty(
          '--angle',
          item.renderData.computedAngle.toString() + 'deg'
        );
        item.renderData.nodeDiv.style.setProperty(
          '--sibling-count',
          parent.children.length.toString()
        );

        if (level > 1) {
          item.renderData.nodeDiv.style.setProperty(
            '--parent-angle',
            parent.renderData.computedAngle.toString() + 'deg'
          );
        }

        if (dir.x < -0.2) {
          item.renderData.nodeDiv.classList.add('left');
        } else if (dir.x > 0.2) {
          item.renderData.nodeDiv.classList.add('right');
        } else if (dir.y < 0) {
          item.renderData.nodeDiv.classList.add('top');
        } else {
          item.renderData.nodeDiv.classList.add('bottom');
        }
      }

      item.renderData.nodeDiv.classList.add(`level-${level}`);
      item.renderData.nodeDiv.classList.add(`type-${item.type}`);

      if (item.type === 'submenu' || item.type === 'root') {
        item.renderData.connectorDiv = document.createElement('div');
        item.renderData.connectorDiv.classList.add('connector');
        item.renderData.nodeDiv.appendChild(item.renderData.connectorDiv);

        let angles;
        let wedges;
        if (item.type === 'root') {
          angles = math.computeItemAngles(item.children);
          wedges = math.computeItemWedges(angles);
        } else {
          const parentAngle = (item.renderData.computedAngle + 180) % 360;
          angles = math.computeItemAngles(item.children, parentAngle);
          wedges = math.computeItemWedges(angles, parentAngle);
          item.renderData.parentWedge = wedges.parentWedge;
        }

        for (let i = 0; i < item.children.length; ++i) {
          queue.push({
            item: item.children[i] as RenderedChildMenuItem,
            parent: item,
            container: item.renderData.nodeDiv,
            level: level + 1,
            index: i,
            angle: angles[i],
            wedge: wedges.itemWedges[i],
          });
        }
      }
    }
  }

  /**
   * Computes the absolute position of the menu item which is currently in the center of
   * the menu. This is the position of the root item plus the sum of the positions of all
   * items in the selection chain.
   *
   * @returns The position of the currently active item.
   */
  private getCenterItemPosition() {
    const position = { x: 0, y: 0 };
    let item = this.centerItem || this.root;

    while (item) {
      position.x += item.renderData.position.x;
      position.y += item.renderData.position.y;

      item = item.renderData.parent;
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
    if (this.showMenuOptions.centeredMode) {
      return {
        x: this.showMenuOptions.windowSize.x * 0.5,
        y: this.showMenuOptions.windowSize.y * 0.5,
      };
    }

    return this.showMenuOptions.mousePosition;
  }

  /**
   * Returns the primary quick-select key for a given item. It prioritizes the
   * select-workflow over the hover-workflow over the center-click-workflow. This is used
   * to determine which quick-select key to show in the center text when hovering an
   * item.
   *
   * @param item The menu item to get the quick-select key for.
   * @returns The primary quick-select key for the given item, or null if there is no
   *   quick-select key.
   */
  private getQuickSelectKey(item: ChildMenuItem): string | null {
    if (item.type === 'button') {
      return (
        item.selectWorkflow?.quickSelectKey || item.hoverWorkflow?.quickSelectKey || null
      );
    } else if (item.type === 'submenu') {
      return (
        item.openWorkflow?.quickSelectKey ||
        item.hoverWorkflow?.quickSelectKey ||
        item.activateWorkflow?.quickSelectKey ||
        null
      );
    }

    return null;
  }

  /**
   * Small helper method to emit menu interaction events.
   *
   * @param type The type of interaction.
   */
  private emitMenuInteractionEvent(
    type: MenuInteractionType.eOpenMenu | MenuInteractionType.eCloseMenu
  ) {
    this.emit('interaction', type, [], 0, SelectionSource.eUnknown);
  }

  /**
   * Small helper method to emit most item interaction events.
   *
   * @param type The type of interaction.
   * @param path The path to the item which is the target of the interaction.
   */
  private emitItemInteractionEvent(
    type:
      | MenuInteractionType.eOpenSubmenu
      | MenuInteractionType.eCloseSubmenu
      | MenuInteractionType.eHoverParent
      | MenuInteractionType.eHoverCenter
      | MenuInteractionType.eHoverButton
      | MenuInteractionType.eHoverSubmenu
      | MenuInteractionType.eActivateSubmenu,
    path: number[]
  ) {
    this.emit('interaction', type, path, 0, SelectionSource.eUnknown);
  }

  /**
   * Small helper method to emit selection events.
   *
   * @param type The type of interaction.
   */
  private emitSelectionEvent(item: RenderedMenuItem, source: SelectionSource) {
    this.emit(
      'interaction',
      MenuInteractionType.eSelectButton,
      item.renderData.path,
      Date.now() - this.menuShownTime,
      source
    );
  }
}

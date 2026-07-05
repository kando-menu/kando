//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { WindowWithAPIs } from '../../settings-window-api';
declare const window: WindowWithAPIs;

import React from 'react';
import i18next from 'i18next';
import classNames from 'classnames/bind';
import { TbCopy, TbTrash } from 'react-icons/tb';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import * as classes from './MenuPreview.module.scss';
const cx = classNames.bind(classes);

import { useAppState, useMenuSettings } from '../../state';
import {
  AchievementStatsNumberKeys,
  ChildMenuItem,
  RootMenuItem,
  SubmenuMenuItem,
  ActionTypeRegistry,
} from '../../../common';
import * as math from '../../../common/math';
import * as utils from './utils';

import { ThemedIcon } from '../common';
import { ensureUniqueKeys } from '../../utils';

/**
 * For rendering the menu items around the center item, a list of these objects is
 * created.
 */
type RenderedMenuItem = {
  /** A unique key for the menu item. This is required for React to identify the item. */
  key: string;

  /**
   * The original index of the item in the list of children. -1 for new items which are
   * added via drag-and-drop.
   */
  index: number;

  /** The icon of the menu item. */
  icon?: string;

  /** The theme from which the above icon should be used. */
  iconTheme?: string;

  /** The fixed angle of the item. This is only set if the item is locked. */
  angle?: number;
};

/**
 * This component encapsules the center area of the settings dialog. It contains the
 * preview of the currently selected menu where the user can reorder and select menu
 * items.
 */
export default function MenuPreview() {
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectedChildPath = useAppState((state) => state.selectedChildPath);
  const selectChildPath = useAppState((state) => state.selectChildPath);
  const menus = useMenuSettings((state) => state.menus);
  const editMenuItem = useMenuSettings((state) => state.editMenuItem);
  const moveMenuItem = useMenuSettings((state) => state.moveMenuItem);
  const deleteMenuItem = useMenuSettings((state) => state.deleteMenuItem);
  const duplicateMenuItem = useMenuSettings((state) => state.duplicateMenuItem);

  // When the user selects a submenu or navigates back to the parent menu, a short
  // transition animation is shown. The new menu fades in from the direction of the
  // selected child, the old menu fades out in the opposite direction. This is implemented
  // using the CSSTransition component from react-transition-group. To trigger the
  // transition, we need to change the key of the CSSTransition component. This is done
  // by using a boolean state variable which is toggled whenever a transition is
  // triggered. The transition direction is determined by the angle of the selected child.
  // We also need to pass refs to the old and the new menu to the CSSTransition component,
  // so that we can apply the transition classes to the correct elements. We use two refs
  // and toggle between them whenever a new transition is triggered.
  const [transitionPing, setTransitionPing] = React.useState(false);
  const [transitionAngle, setTransitionAngle] = React.useState(0);
  const pingRef = React.useRef(null);
  const pongRef = React.useRef(null);
  const currentContainer = transitionPing ? pingRef : pongRef;

  // Drag-and-drop in the menu preview is very complex. It is handled using the state
  // below. There are several scenarios to consider:
  // 1. The user drags an item inside the menu preview from one place to another. In this
  //    case, dragIndex indicates the dragged item in the list of children. The drop index
  //    will be set to the position where the item should be dropped. The dropInto
  //    property indicates whether the item should be dropped into the submenu at the
  //    given index. Both tempItem and dragAngle are null in this case.
  // 2. The user drags something from outside the menu preview into the menu preview. In
  //    this case, the drag index is null. The drop index and the dropInto property behave
  //    exactly like in the first case. The tempItem is set to the item which is about to
  //    be dropped. The dragAngle is null.
  // 3. The user drags an item with a fixed angle inside the menu preview. In this case,
  //    the drag index specifies the dragged item. The dropIndex and the tempItem are null
  //    in this case. The dragAngle is set to the current angle of the dragged item.
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);
  const [dropInto, setDropInto] = React.useState(false);
  const [tempItem, setTempItem] = React.useState<RenderedMenuItem | null>(null);
  const [dragAngle, setDragAngle] = React.useState<number | null>(null);
  const [editedSubmenuPath, setEditedSubmenuPath] = React.useState<string | null>(null);

  // The preview footer can delete items via drag-and-drop. This creates a problem: When
  // the item is deleted, it's drag-end handler is not called and the menu preview is
  // still in the "drag state". To solve this problem, we use a custom event which is
  // dispatched when an item is deleted via drag-and-drop in the preview footer.
  const resetDragState = React.useCallback(() => {
    setDropIndex(null);
    setDropInto(false);
    setTempItem(null);
    setDragIndex(null);
    setDragAngle(null);
  }, []);

  React.useEffect(() => {
    const onDragEnd = () => {
      resetDragState();
    };

    window.addEventListener('kando/menu-item-drag-end', onDragEnd);

    return () => {
      window.removeEventListener('kando/menu-item-drag-end', onDragEnd);
    };
  }, [resetDragState]);

  const selectedChildPathKey = `${String(selectedMenu)}:${selectedChildPath.join('.')}`;
  const editingSelectedSubmenu = editedSubmenuPath === selectedChildPathKey;

  // Some booleans matching to the three cases explained above to make the code below more
  // readable.
  const internalDragOngoing = dragIndex !== null && dropIndex !== null;
  const externalDragOngoing = dragIndex === null && dropIndex !== null;
  const angleDragOngoing = dragIndex !== null && dropIndex === null && dragAngle !== null;

  // Sanity check.
  const menu = menus[selectedMenu];
  if (!menu) {
    return null;
  }

  // First, we traverse the children of the current menu according to the selection path
  // and store the final (sub)menu aka the centerItem. We also store some other
  // information about the center item. The center item could either be the last item in
  // selectedChildPath (if a submenu is selected) or the last-but-one item (if a menu item
  // is selected). If the selection path is empty, the root menu is the center item. We
  // also store the index of the selected leaf child if it is not a submenu. If the center
  // is selected, the index is -1.
  let centerItem: RootMenuItem | SubmenuMenuItem = menu.root;
  let selectedChild = -1;
  let showingRootMenu = true;
  let childAngles = math.computeItemAngles(centerItem.children);
  let parentAngle = null;
  const centerItemPath: number[] = [];

  for (let i = 0; i < selectedChildPath.length; i++) {
    const childIndex = selectedChildPath[i];
    const child = centerItem.children[childIndex] as ChildMenuItem;
    const selectedSubmenuShouldOpen =
      child.type === 'submenu' &&
      (editingSelectedSubmenu || i < selectedChildPath.length - 1);

    if (selectedSubmenuShouldOpen) {
      showingRootMenu = false;
      parentAngle = utils.getParentAngle(childAngles[childIndex]);
      centerItem = child;
      childAngles = math.computeItemAngles(centerItem.children, parentAngle);
      centerItemPath.push(childIndex);
    } else {
      selectedChild = childIndex;
      break;
    }
  }

  // If there is a drag operation in progress, we need potentially to render more or less
  // items than the center item actually has children. Hence, we assemble a list of
  // menu items which should be rendered. We base this on the list of children of the
  // center item and later add or remove items from this list depending on the drag
  // operation.
  let renderedChildAngles = childAngles;
  const renderedChildren =
    centerItem.children?.map((child, i) => {
      const item: RenderedMenuItem = {
        // We prepend the selected menu to the key so that there is no weird transition
        // animation when the selected menu changes.
        key: selectedMenu + child.name + child.icon + child.iconTheme,
        index: i,
        icon: child.icon,
        iconTheme: child.iconTheme,
        angle: child.angle,
      };
      return item;
    }) || [];

  // If there is currently a drag operation in progress, we need to modify the list of
  // rendered children. If it is an external drag, we draw a "drop-indicator" item at the
  // drop position. We do not really insert it at the drop position because this confuses
  // React (there will not be proper transitions as the items are swapping places when the
  // dragged item is moved around). Instead, we just add it to the end of the list.
  if (externalDragOngoing) {
    // If dropIndex is null, the item is about to be dropped onto the back-navigation
    // link. In this case, we use the parent angle. If the item is dropped into a submenu,
    // we simply copy the angle of the submenu. In both cases there is no need to
    // recompute the angles of the rendered children. Only in the last case where the item
    // is about to be dropped somewhere among its siblings we need to recompute the
    // angles.
    if (dropIndex === -1 && dropInto) {
      renderedChildren.push(tempItem);
      renderedChildAngles.push(parentAngle);
    } else if (dropIndex >= 0 && dropInto) {
      renderedChildren.push(tempItem);
      renderedChildAngles.push(renderedChildAngles[dropIndex]);
    } else if (dropIndex >= 0) {
      // First insert the drop-indicator item at the drop position to compute the angles
      // correctly.
      renderedChildren.splice(dropIndex, 0, tempItem);
      renderedChildAngles = math.computeItemAngles(renderedChildren, parentAngle);

      // Now move the item and the angle to the end of the lists.
      utils.moveToEnd(renderedChildren, dropIndex);
      utils.moveToEnd(renderedChildAngles, dropIndex);
    }
  }

  // If it is an internal drag, we need to show the dragged item at the drop position.
  // Again, in order to not confuse React, we do not really move the item in the list of
  // rendered children. Instead, we only adapt the list of angles.
  if (internalDragOngoing) {
    // First create a copy of the children list. We will modify this to compute the
    // angles of the children as if the dragged item was at the drop position.
    const childrenCopy = [...renderedChildren];

    // Remove the dragged item from the list.
    const tempItem = childrenCopy.splice(dragIndex, 1)[0];

    // If it is not dropped into a submenu, we need to add it at the drop position.
    if (!dropInto) {
      childrenCopy.splice(dropIndex, 0, tempItem);
    }

    // Now compute the angles of the children as if the dragged item was at the drop
    // position.
    renderedChildAngles = math.computeItemAngles(childrenCopy, parentAngle);

    // Now there are a couple of cases to consider:
    // 1. If the item is dropped onto the back-navigation link, we need to insert the
    //    parent angle into the list of angles at the position of the dragged item.
    // 2. If the item is dropped into a submenu, we need to insert the angle of the
    //    submenu at the position of the dragged item.
    // 3. If the item is dropped somewhere among its siblings, we need to move the angle
    //    from the drop position to the position of the dragged item.
    if (dropIndex === -1 && dropInto) {
      renderedChildAngles.splice(dragIndex, 0, parentAngle);
    } else if (dropIndex >= 0 && dropInto) {
      renderedChildAngles.splice(
        dragIndex,
        0,
        renderedChildAngles[dropIndex > dragIndex ? dropIndex - 1 : dropIndex]
      );
    } else if (dropIndex >= 0) {
      const dropAngle = renderedChildAngles.splice(dropIndex, 1)[0];
      renderedChildAngles.splice(dragIndex, 0, dropAngle);
    }
  }

  // If it is a fixed-angle drag, we need to update the angle of the dragged item to the
  // current drag angle. This is surprisingly complex. The main problem is that you can
  // drag items over the 0°/360° boundary on top, so if there are other fixed angles
  // limiting the movement of the dragged item, they can be on both sides of that boundary
  // making the computation a bit tricky.
  if (angleDragOngoing) {
    const item = renderedChildren[dragIndex];

    // Find the next and previous item with a fixed angle. If there is one, we need to
    // ensure that the angle of the dragged item is between these two angles. As angles
    // wrap around, this is a bit tricky.
    const childCount = renderedChildren.length;
    let nextAngle = null;
    let prevAngle = null;
    for (let i = 1; i < renderedChildren.length; i++) {
      const nextItem = renderedChildren[(dragIndex + i) % childCount];
      const prevItem = renderedChildren[(dragIndex - i + childCount) % childCount];

      if (nextItem.angle !== undefined && nextAngle === null) {
        nextAngle = nextItem.angle;
      }

      if (prevItem.angle !== undefined && prevAngle === null) {
        prevAngle = prevItem.angle;
      }
    }

    let angle = dragAngle;

    // If there is at least one other item with a fixed angle, prevAngle and nextAngle
    // will be set to the angles of the previous and next item with a fixed angle. Both
    // angles could be the same if there is only one other item with a fixed angle. In any
    // case, we need to ensure that the angle of the dragged item is between these two
    // angles.
    if (prevAngle !== null && nextAngle !== null) {
      // Make sure that prevAngle < angle < nextAngle. This is especially important if the
      // angles wrap around the 0°/360° boundary or if there is only one other item with a
      // fixed angle. In this case, nextAngle will be equal to prevAngle + 360° after this
      // operation.
      prevAngle = math.getEquivalentAngleSmallerThan(prevAngle, item.angle);
      nextAngle = math.getEquivalentAngleLargerThan(nextAngle, item.angle);
      angle = math.getEquivalentAngleLargerThan(angle, prevAngle);

      const margin = 15;
      const validStart = prevAngle + margin;
      const validEnd = nextAngle - margin;
      const middleOfValid = (validStart + validEnd) / 2;
      const middleOfInvalid = middleOfValid + 180;

      // If the previous and next angle are too close to each other, we force the dragged
      // item to be in the middle of the two angles. Else, we check whether the dragged
      // angle is currently outside the valid angular range. We also check in which half
      // of the invalid circle segment the angle is and clamp the dragged item to the
      // corresponding end of the valid range.
      if (nextAngle - prevAngle < 2 * margin) {
        item.angle = (prevAngle + nextAngle) / 2;
      } else if (math.isAngleBetween(angle, validEnd, middleOfInvalid)) {
        item.angle = validEnd;
      } else if (math.isAngleBetween(angle, middleOfInvalid, validStart + 360)) {
        item.angle = validStart;
      } else {
        item.angle = angle;
      }
    } else {
      item.angle = angle;
    }

    // Ensure that the angles are monotonically increasing.
    math.fixFixedAngles(renderedChildren);
    renderedChildAngles = math.computeItemAngles(renderedChildren, parentAngle);
  }

  // Make sure that all keys are unique.
  ensureUniqueKeys(renderedChildren);

  // Adds the given index to the selected menu path if the center is currently selected.
  // Else a child was selected and the hence the last index of the path is replaced.
  const getChildPath = (which: number) => {
    if (selectedChild === -1) {
      return selectedChildPath.concat(which);
    }

    return selectedChildPath.slice(0, -1).concat(which);
  };

  const selectChild = (which: number) => {
    setEditedSubmenuPath(null);
    selectChildPath(getChildPath(which));
  };

  const editChild = (which: number) => {
    const child = centerItem.children[which];
    const childPath = getChildPath(which);

    selectChildPath(childPath);

    if (child.type === 'submenu') {
      setEditedSubmenuPath(`${String(selectedMenu)}:${childPath.join('.')}`);
      setTransitionPing(!transitionPing);
      setTransitionAngle(childAngles[which]);
    }
  };

  // Selects the center item. This is done by removing the last element from the selection
  // path. If the center is already selected, nothing is done.
  const selectCenter = () => {
    if (selectedChild !== -1) {
      setEditedSubmenuPath(
        centerItemPath.length > 0
          ? `${String(selectedMenu)}:${centerItemPath.join('.')}`
          : null
      );
      selectChildPath(centerItemPath);
    }
  };

  // Navigates one visual level up by selecting the parent of the currently shown center
  // item and opening it if it is still a submenu.
  const selectParent = () => {
    const parentPath = centerItemPath.slice(0, -1);
    setEditedSubmenuPath(
      parentPath.length > 0 ? `${String(selectedMenu)}:${parentPath.join('.')}` : null
    );
    selectChildPath(parentPath);

    // Trigger a transition by changing the key of the CSSTransition component.
    setTransitionPing(!transitionPing);
    setTransitionAngle(parentAngle);
  };

  // Renders a small trash and duplicate button next to the child item if it is currently
  // selected.
  const renderChildButtons = (renderedChild: RenderedMenuItem, angle: number) => {
    if (renderedChild.index < 0 || renderedChild.index >= centerItem.children.length) {
      return null;
    }

    // Only the selected child item has the buttons.
    if (renderedChild.index !== selectedChild || isDraggedChild(renderedChild)) {
      return null;
    }

    const toolOffset =
      centerItem.children[renderedChild.index]?.type === 'submenu' ? 30 : 20;

    const trashDir = math.getDirection(angle + toolOffset, 1);
    const editDir = math.getDirection(angle, 1);
    const copyDir = math.getDirection(angle - toolOffset, 1);

    return (
      <>
        <div
          className={classes.tool}
          style={utils.makeCSSProperties('dir', trashDir)}
          data-tooltip-content={i18next.t('settings.delete-menu-item')}
          data-tooltip-id="main-tooltip"
          onClick={() => {
            deleteMenuItem(selectedMenu, selectedChildPath);
            selectCenter();
          }}>
          <TbTrash />
        </div>
        {/* The edit button is only shown for submenus as only they can be edited. */}
        {centerItem.children[renderedChild.index]?.type === 'submenu' ? (
          <div
            className={cx({ tool: true, primary: true })}
            style={utils.makeCSSProperties('dir', editDir)}
            data-tooltip-content={i18next.t('settings.edit-submenu')}
            data-tooltip-id="main-tooltip"
            onClick={() => {
              editChild(renderedChild.index);
            }}>
            <ThemedIcon theme="kando" name="edit-submenu.svg" size="100%" />
          </div>
        ) : null}
        <div
          className={classes.tool}
          style={utils.makeCSSProperties('dir', copyDir)}
          data-tooltip-content={i18next.t('settings.duplicate-menu-item')}
          data-tooltip-id="main-tooltip"
          onClick={(event) => {
            event.stopPropagation();
            duplicateMenuItem(selectedMenu, selectedChildPath);
          }}>
          <TbCopy />
        </div>
      </>
    );
  };

  // Assembles a list of divs for the grandchild items of the given child item.
  const renderGrandchildren = (renderedChild: RenderedMenuItem, angle: number) => {
    // The drop indicator for dropping into a submenu is rendered as a "ghost" child item
    // with index -1.
    if (renderedChild.index < 0 || renderedChild.index >= centerItem.children.length) {
      return null;
    }

    const child = centerItem.children[renderedChild.index];

    if (child.type !== 'submenu') {
      return null;
    }

    const grandchildAngles = math.computeItemAngles(
      child.children,
      utils.getParentAngle(angle)
    );

    const grandchildDirections = grandchildAngles.map((angle) =>
      math.getDirection(angle, 1)
    );

    return grandchildDirections.map((direction, index) => {
      return (
        <div
          key={`direction-${String(index)}`}
          className={classes.grandChild}
          style={utils.makeCSSProperties(
            'dir',
            direction,
            'angle',
            grandchildAngles[index]
          )}
        />
      );
    });
  };

  // Compute the x-y-coordinates of the child items.
  const childDirections = renderedChildAngles.map((angle) => math.getDirection(angle, 1));

  // Assembles a list of divs for the child items of the center item. Each child is
  // rendered as a div with a contained icon and potentially a list of grandchild items.
  const renderChild = (child: RenderedMenuItem, index: number) => {
    let angleDragMayStart = false;
    let clickedDownContainer: HTMLDivElement | null = null;
    const childIndex = child.index;
    const isSelected = selectedChild >= 0 && selectedChild === childIndex;
    const isSubmenu = centerItem.children[childIndex]?.type === 'submenu';

    return (
      <div
        key={child.key}
        className={cx({
          child: true,
          selected: isSelected,
          dragging: isDraggedChild(child),
          dropping: dropInto && dropIndex === child.index,
        })}
        draggable={child.angle === undefined}
        style={utils.makeCSSProperties('dir', childDirections[index])}
        tabIndex={0}
        onDragEnd={() => {
          resetDragState();
        }}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = 'copyMove';
          event.dataTransfer.setData(
            'kando/child-path',
            JSON.stringify(centerItemPath.concat(childIndex))
          );
          setDragIndex(index);
          setDropIndex(index);
          setDropInto(false);
        }}
        onKeyDown={(event) => {
          // Select the child if the user presses enter or space. This is required for
          // keyboard navigation in the menu preview. If the child is already selected
          // and a submenu, the user can also open the submenu with enter or space.
          if (event.key === 'Enter' || event.key === ' ') {
            if (isSubmenu && isSelected) {
              editChild(childIndex);
            } else {
              selectChild(childIndex);
            }
          }

          // Delete the item if the user presses the delete key.
          if (event.key === 'Delete') {
            deleteMenuItem(selectedMenu, centerItemPath.concat(childIndex));
            selectCenter();
          }
        }}
        onDoubleClick={() => {
          if (isSubmenu) {
            editChild(childIndex);
          }
        }}
        onPointerDown={() => {
          if (child.angle !== undefined) {
            angleDragMayStart = true;
          }
          clickedDownContainer = currentContainer.current;
        }}
        onPointerMove={(event) => {
          if (angleDragOngoing || angleDragMayStart) {
            // Compute the angle of the pointer position relative to the center of the
            // preview area.
            const container = currentContainer.current;
            if (!container) {
              return;
            }

            const angle = utils.getAngleToCenter(container, {
              x: event.clientX,
              y: event.clientY,
            });

            // Only consider an initial angular differences of at least 1 degree.
            if (!angleDragOngoing) {
              const angleDiff = math.getAngularDifference(dragAngle, angle);
              if (Math.abs(angleDiff) < 1) {
                return;
              }

              setDragIndex(index);
              (event.target as HTMLElement).setPointerCapture(event.pointerId);
            }

            // Update the angle of the dragged item in 15 degree steps. If shift is
            // pressed, the angle is snapped to the nearest 3 degree.
            if (event.shiftKey) {
              setDragAngle((3 * Math.round(angle / 3)) % 360);
            } else {
              setDragAngle((15 * Math.round(angle / 15)) % 360);
            }
          }
        }}
        onPointerUp={(event) => {
          if (angleDragOngoing) {
            setDragAngle(null);
            setDragIndex(null);
            angleDragMayStart = false;

            // If the angle was changed, we need to update the item in the menu.
            editMenuItem(selectedMenu, centerItemPath, (center: SubmenuMenuItem) => {
              center.children.forEach((item, i) => {
                item.angle = renderedChildren[i].angle;
              });
              return center;
            });
          }
          // Only select the child if it is not currently selected. Also, during touch
          // interaction, onPointerUp is also called at the end of a drag operation. In
          // this case we do not want to select the child.
          else if (
            !isSelected &&
            dragIndex === null &&
            clickedDownContainer === currentContainer.current
          ) {
            // With right mouse button or long touch, the user can open submenus without
            // double-clicking.
            if (event.button === 2 && isSubmenu) {
              editChild(childIndex);
            } else {
              selectChild(childIndex);
            }
          }
        }}>
        {child.iconTheme && child.icon ? (
          <ThemedIcon name={child.icon} size="100%" theme={child.iconTheme} />
        ) : null}
        {renderGrandchildren(child, renderedChildAngles[index])}
        {renderChildButtons(child, renderedChildAngles[index])}
      </div>
    );
  };

  // Renders the lock icon for the given child item. The lock is locked if the item has a
  // fixed angle.
  const renderLock = (renderedChild: RenderedMenuItem, index: number) => {
    // Only the selected child and children which are currently locked have a lock icon.
    if (
      (renderedChild.index !== selectedChild && renderedChild.angle === undefined) ||
      isDraggedChild(renderedChild)
    ) {
      return null;
    }

    return (
      <div
        key={renderedChild.key}
        data-tooltip-content={i18next.t('settings.fix-menu-item-angle')}
        data-tooltip-id="main-tooltip"
        className={cx({
          lock: true,
          locked: renderedChild.angle !== undefined,
        })}
        style={utils.makeCSSProperties('dir', childDirections[index])}
        onClick={() => {
          // If the item is locked, we unlock it. If it is not locked, we lock it. This is
          // done by removing the angle from the item or setting it to the current angle
          // of the item.
          const itemPath = centerItemPath.concat(renderedChild.index);
          editMenuItem(selectedMenu, itemPath, (item: ChildMenuItem) => {
            if (item.angle !== undefined) {
              delete item.angle;
            } else {
              item.angle = renderedChildAngles[index];
            }
            return item;
          });
        }}>
        <ThemedIcon
          name={renderedChild.angle !== undefined ? 'lock' : 'lock_open'}
          size="100%"
          theme="material-symbols-rounded"
        />
      </div>
    );
  };

  // Called if something is dragged over the menu preview. It computes the position where
  // the item should be dropped and sets the drop index and whether it should be dropped
  // into a submenu accordingly.
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    const container = currentContainer.current;
    if (!container) {
      return;
    }

    // We are only interested in drag events which could potentially lead to drops.
    if (dragIndex === null && tempItem === null) {
      return;
    }

    const dragAngle = utils.getAngleToCenter(container, {
      x: event.clientX,
      y: event.clientY,
    });

    // Compile a list of potential drop targets.
    const children = centerItem.children.map((child) => {
      return {
        angle: child.angle,
        dropTarget: child.type === 'submenu',
      };
    });

    // Compute the drop target index and whether the dragged item should be dropped
    // into a submenu.
    const { dropIndex, dropInto } = utils.computeDropTarget(
      parentAngle,
      children,
      dragAngle,
      dragIndex
    );

    setDropIndex(dropIndex);
    setDropInto(dropInto);

    event.preventDefault();
  };

  // Returns true if the given child is the currently dragged item.
  const isDraggedChild = (child: RenderedMenuItem) => {
    return (
      child.key.startsWith('dragged') || // For external drag-and-drop.
      (internalDragOngoing && dragIndex === child.index) // For internal drag-and-drop.
    );
  };

  return (
    <div className={classes.previewArea}>
      <div
        className={classes.preview}
        style={utils.makeCSSProperties(
          'transition-dir',
          math.getDirection(transitionAngle, 1.0)
        )}>
        <TransitionGroup>
          <CSSTransition
            key={transitionPing ? 'ping' : 'pong'}
            classNames={{
              enter: classes.fadeEnter,
              enterActive: classes.fadeEnterActive,
              exit: classes.fadeExit,
              exitActive: classes.fadeExitActive,
            }}
            nodeRef={currentContainer}
            timeout={350}>
            <div
              ref={currentContainer}
              className={classes.transitionContainer}
              onKeyDown={(event) => {
                // Select the parent item if the user presses the backspace key.
                if (event.key === 'Backspace' && !showingRootMenu) {
                  selectParent();
                }
              }}
              onDragEnter={(event) => {
                // If we enter the container during an external drag, we check whether
                // we could create a new item from the dragged data. If this is the case,
                // we create a temporary dragged item which will be used as a "drop
                // indicator" item.
                if (tempItem === null && dragIndex === null) {
                  const supported = ActionTypeRegistry.getInstance().hasSupportedDataType(
                    event.dataTransfer
                  );

                  if (supported) {
                    setTempItem({
                      key: 'dragged',
                      index: -1,
                    });
                  }
                }

                event.preventDefault();
              }}
              onDragLeave={(event) => {
                // If we leave the container during an external drag, we reset the drop
                // data so that the drop indicator is hidden.
                if (
                  dragIndex === null &&
                  !currentContainer.current?.contains(event.relatedTarget)
                ) {
                  setDropIndex(null);
                  setDropInto(false);
                  setTempItem(null);
                }

                event.preventDefault();
              }}
              onDragOver={onDragOver}
              onDrop={async (event) => {
                // If the drag index is set, we are moving an item around. In this case, we need to
                // move the item to the new position. If it is not set, something new is dragged
                // from somewhere else. In this case, we need to create a new item at the drop
                // position.
                if (dragIndex !== null) {
                  const dragItemPath = centerItemPath.concat(dragIndex);

                  if (dropIndex === -1 && dropInto) {
                    // Moving to the parent.
                    const dropItemPath = centerItemPath.slice(0, -1).concat(-1);
                    moveMenuItem(selectedMenu, dragItemPath, selectedMenu, dropItemPath);
                  } else if (dropIndex >= 0 && dropInto) {
                    // Moving to a submenu.
                    const dropItemPath = centerItemPath.concat([dropIndex, -1]);
                    moveMenuItem(selectedMenu, dragItemPath, selectedMenu, dropItemPath);
                  } else if (dropIndex >= 0) {
                    // Moving to a sibling position.
                    const dropItemPath = centerItemPath.concat(dropIndex);
                    moveMenuItem(selectedMenu, dragItemPath, selectedMenu, dropItemPath);

                    // If the item was selected, we need to select the new position of the
                    // item to ensure that it stays selected. Else there are the cases
                    // where an unselected item was moved across the selected item - so
                    // from before the selected child to after it or vice versa. In this
                    // case we need to shift the selected child index by one in the
                    // corresponding direction.
                    if (selectedChild === dragIndex) {
                      selectChild(dropIndex);
                    } else if (dragIndex < selectedChild && selectedChild <= dropIndex) {
                      selectChild(selectedChild - 1);
                    } else if (dragIndex > selectedChild && selectedChild >= dropIndex) {
                      selectChild(selectedChild + 1);
                    }
                  }
                } else {
                  const item = await ActionTypeRegistry.getInstance().createItem(
                    event.dataTransfer
                  );

                  if (item) {
                    const addAchievementStats = (depth: number, siblings: number) => {
                      const achievementStats: AchievementStatsNumberKeys[] = [
                        'addedItems',
                      ];
                      if (siblings == 12) {
                        achievementStats.push('addedItemsToFullMenu');
                      }
                      if (depth == 4) {
                        achievementStats.push('addedItemsToDeepMenu');
                      }

                      window.commonAPI.incrementAchievementStats(achievementStats);
                    };

                    if (dropIndex === -1 && dropInto) {
                      // Create new item in parent.
                      const parentPath = centerItemPath.slice(0, -1);
                      editMenuItem(
                        selectedMenu,
                        parentPath,
                        (parent: SubmenuMenuItem) => {
                          parent.children.push(item);
                          addAchievementStats(parentPath.length, parent.children.length);
                          return parent;
                        }
                      );
                    } else if (dropIndex >= 0 && dropInto) {
                      // Create new item in submenu.
                      const submenuPath = centerItemPath.concat(dropIndex);
                      editMenuItem(
                        selectedMenu,
                        submenuPath,
                        (submenu: SubmenuMenuItem) => {
                          submenu.children.push(item);
                          addAchievementStats(
                            submenuPath.length,
                            submenu.children.length
                          );
                          return submenu;
                        }
                      );
                    } else if (dropIndex >= 0) {
                      // Create new item among siblings and select it.
                      editMenuItem(
                        selectedMenu,
                        centerItemPath,
                        (center: SubmenuMenuItem) => {
                          center.children.splice(dropIndex, 0, item);
                          addAchievementStats(
                            centerItemPath.length,
                            center.children.length
                          );

                          return center;
                        }
                      );
                      selectChildPath(centerItemPath.concat(dropIndex));
                    }
                  }
                }

                resetDragState();

                event.preventDefault();
              }}>
              {
                // Except for the root menu, in all submenus a back link is shown which
                // allows the user to navigate back to the parent menu.
                !showingRootMenu && (
                  <div
                    className={cx({
                      backLink: true,
                      dropping: dropInto && dropIndex === -1,
                    })}
                    style={utils.makeCSSProperties(
                      'dir',
                      math.getDirection(parentAngle, 1),
                      'angle',
                      parentAngle - 90
                    )}
                    onClick={() => selectParent()}>
                    <ThemedIcon
                      name="chevron_right"
                      size="100%"
                      theme="material-symbols-rounded"
                    />
                  </div>
                )
              }
              <div
                className={cx({
                  center: true,
                  selected: selectedChild === -1,
                })}
                tabIndex={0}
                onClick={() => selectCenter()}
                onKeyDown={(event) => {
                  // Select the center item if the user presses enter or space. This is
                  // required for keyboard navigation in the menu preview.
                  if (event.key === 'Enter' || event.key === ' ') {
                    selectCenter();
                  }
                }}>
                <ThemedIcon
                  name={centerItem.icon}
                  size="100%"
                  theme={centerItem.iconTheme}
                />
              </div>
              {
                // Add all child items. They are positioned via CSS properties. Only items
                // without fixed angles are draggable.
                renderedChildren.map(renderChild)
              }
              {
                // Add the lock icons for each child item. When locked, the item cannot be
                // reordered via drag and drop, but its fixed angle can be adjusted instead.
                renderedChildren.map(renderLock)
              }
            </div>
          </CSSTransition>
        </TransitionGroup>
      </div>
    </div>
  );
}

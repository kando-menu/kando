//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import classNames from 'classnames/bind';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import * as classes from './MenuPreview.module.scss';
const cx = classNames.bind(classes);

import { useAppState, useMenuSettings } from '../../state';
import * as math from '../../../common/math';
import * as utils from './utils';

import { ThemedIcon } from '../common';
import { ItemTypeRegistry } from '../../../common/item-types/item-type-registry';
import { ensureUniqueKeys } from '../../utils';

/**
 * For rendering the menu items around the center item, a list of these objects is
 * created.
 */
interface IRenderedMenuItem {
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
}

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
  const deleteMenu = useMenuSettings((state) => state.deleteMenu);

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
  const [tempItem, setTempItem] = React.useState<IRenderedMenuItem | null>(null);
  const [dragAngle, setDragAngle] = React.useState<number | null>(null);

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
  let centerItem = menu.root;
  let selectedChild = -1;
  let showingRootMenu = true;
  let childAngles = math.computeItemAngles(centerItem.children);
  let parentAngle = null;
  const centerItemPath: number[] = [];

  for (let i = 0; i < selectedChildPath.length; i++) {
    const childIndex = selectedChildPath[i];
    const child = centerItem.children[childIndex];
    const type = ItemTypeRegistry.getInstance().getType(child.type);
    if (type?.hasChildren) {
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
      const item: IRenderedMenuItem = {
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
  const selectChild = (which: number, doAnimation: boolean) => {
    if (selectedChild === -1) {
      selectChildPath(selectedChildPath.concat(which));
    } else {
      selectChildPath(selectedChildPath.slice(0, -1).concat(which));
    }

    // If the selected child is a submenu, we need to trigger a transition by changing
    // the key of the CSSTransition component.
    if (doAnimation) {
      const child = centerItem.children[which];
      const type = ItemTypeRegistry.getInstance().getType(child.type);
      if (type?.hasChildren) {
        setTransitionPing(!transitionPing);
        setTransitionAngle(childAngles[which]);
      }
    }
  };

  // Selects the center item. This is done by removing the last element from the selection
  // path. If the center is already selected, nothing is done.
  const selectCenter = () => {
    if (selectedChild !== -1) {
      selectChildPath(selectedChildPath.slice(0, -1));
    }
  };

  // Removes the last index from the selected menu path if it refers to a submenu. If it
  // refers to an item, the last two indices are removed so that the parent submenu is
  // selected.
  const selectParent = () => {
    if (selectedChild === -1) {
      selectChildPath(selectedChildPath.slice(0, -1));
    } else {
      selectChildPath(selectedChildPath.slice(0, -2));
    }

    // Trigger a transition by changing the key of the CSSTransition component.
    setTransitionPing(!transitionPing);
    setTransitionAngle(parentAngle);
  };

  // Assembles a list of divs for the grandchild items of the given child item.
  const renderGrandchildren = (child: IRenderedMenuItem, angle: number) => {
    if (!centerItem.children || !centerItem.children[child.index]?.children) {
      return null;
    }

    const grandchildAngles = math.computeItemAngles(
      centerItem.children[child.index].children,
      utils.getParentAngle(angle)
    );

    const grandchildDirections = grandchildAngles.map((angle) =>
      math.getDirection(angle, 1)
    );

    return grandchildDirections.map((direction, index) => {
      return (
        <div
          key={index}
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
  const renderChild = (child: IRenderedMenuItem, index: number) => {
    let angleDragMayStart = false;
    const selected = selectedChild >= 0 && selectedChild === child.index;

    return (
      <div
        key={child.key}
        className={cx({
          child: true,
          selected,
          dragging: isDraggedChild(child),
          dropping: dropInto && dropIndex === child.index,
        })}
        tabIndex={0}
        draggable={child.angle === undefined}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = 'copyMove';
          event.dataTransfer.setData(
            'kando/child-path',
            JSON.stringify(centerItemPath.concat(index))
          );
          setDragIndex(index);
          setDropIndex(index);
          setDropInto(false);
        }}
        onDragEnd={() => {
          setDropIndex(null);
          setDragIndex(null);
          setDropInto(false);
        }}
        onPointerDown={() => {
          if (child.angle !== undefined) {
            angleDragMayStart = true;
          }
        }}
        onPointerUp={() => {
          if (angleDragOngoing) {
            setDragAngle(null);
            setDragIndex(null);
            angleDragMayStart = false;

            // If the angle was changed, we need to update the item in the menu.
            editMenuItem(selectedMenu, centerItemPath, (center) => {
              center.children.forEach((item, i) => {
                item.angle = renderedChildren[i].angle;
              });
              return center;
            });
          }
          // Only select the child if it is not currently selected. Also, during touch
          // interaction, onPointerUp is also called at the end of a drag operation. In
          // this case we do not want to select the child.
          else if (!selected && dragIndex === null) {
            selectChild(index, true);
          }
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
        onKeyDown={(event) => {
          // Select the child if the user presses enter or space. This is required for
          // keyboard navigation in the menu preview.
          if (event.key === 'Enter' || event.key === ' ') {
            selectChild(index, true);
          }

          // Delete the item if the user presses the delete key.
          if (event.key === 'Delete' || event.key === 'Backspace') {
            deleteMenuItem(selectedMenu, centerItemPath.concat(index));
            selectCenter();
          }
        }}
        style={utils.makeCSSProperties('dir', childDirections[index])}>
        {child.iconTheme && child.icon && (
          <ThemedIcon size={'100%'} theme={child.iconTheme} name={child.icon} />
        )}
        {renderGrandchildren(child, renderedChildAngles[index])}
      </div>
    );
  };

  // Renders the lock icon for the given child item. The lock is locked if the item has a
  // fixed angle.
  const renderLock = (child: IRenderedMenuItem, index: number) => {
    return (
      <div
        key={child.key}
        className={cx({
          lock: true,
          locked: child.angle !== undefined,
        })}
        style={utils.makeCSSProperties('dir', childDirections[index])}
        onClick={() => {
          // If the item is locked, we unlock it. If it is not locked, we lock it. This is
          // done by removing the angle from the item or setting it to the current angle
          // of the item.
          const itemPath = centerItemPath.concat(index);
          editMenuItem(selectedMenu, itemPath, (item) => {
            if (item.angle !== undefined) {
              delete item.angle;
            } else {
              item.angle = renderedChildAngles[index];
            }
            return item;
          });
        }}>
        <ThemedIcon
          size={'100%'}
          theme={'material-symbols-rounded'}
          name={child.angle !== undefined ? 'lock' : 'lock_open'}
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
      const type = ItemTypeRegistry.getInstance().getType(child.type);
      return {
        angle: child.angle,
        dropTarget: type?.hasChildren,
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
  const isDraggedChild = (child: IRenderedMenuItem) => {
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
            nodeRef={currentContainer}
            timeout={350}
            classNames={{
              enter: classes.fadeEnter,
              enterActive: classes.fadeEnterActive,
              exit: classes.fadeExit,
              exitActive: classes.fadeExitActive,
            }}>
            <div
              ref={currentContainer}
              className={classes.transitionContainer}
              onDragEnter={(event) => {
                // If we enter the container during an external drag, we check whether
                // we could create a new item from the dragged data. If this is the case,
                // we create a temporary dragged item which will be used as a "drop
                // indicator" item.
                if (tempItem === null && dragIndex === null) {
                  const dataType = ItemTypeRegistry.getInstance().getPreferredDataType(
                    event.dataTransfer.types
                  );

                  if (dataType) {
                    setTempItem({
                      key: 'dragged',
                      index: -1,
                    });
                  }
                }

                event.preventDefault();
              }}
              onDragOver={onDragOver}
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
              onDrop={(event) => {
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
                      selectChild(dropIndex, false);
                    } else if (dragIndex < selectedChild && selectedChild <= dropIndex) {
                      selectChild(selectedChild - 1, false);
                    } else if (dragIndex > selectedChild && selectedChild >= dropIndex) {
                      selectChild(selectedChild + 1, false);
                    }
                  }
                } else {
                  const preferredType =
                    ItemTypeRegistry.getInstance().getPreferredDataType(
                      event.dataTransfer.types
                    );

                  if (preferredType) {
                    const item = ItemTypeRegistry.getInstance().createItem(
                      preferredType,
                      event.dataTransfer.getData(preferredType)
                    );

                    if (item) {
                      if (dropIndex === -1 && dropInto) {
                        // Create new item in parent.
                        const parentPath = centerItemPath.slice(0, -1);
                        editMenuItem(selectedMenu, parentPath, (parent) => {
                          parent.children.push(item);
                          return parent;
                        });
                      } else if (dropIndex >= 0 && dropInto) {
                        // Create new item in submenu.
                        const submenuPath = centerItemPath.concat(dropIndex);
                        editMenuItem(selectedMenu, submenuPath, (submenu) => {
                          submenu.children.push(item);
                          return submenu;
                        });
                      } else if (dropIndex >= 0) {
                        // Create new item among siblings and select it.
                        editMenuItem(selectedMenu, centerItemPath, (center) => {
                          center.children.splice(dropIndex, 0, item);
                          return center;
                        });
                        selectChildPath(centerItemPath.concat(dropIndex));
                      }
                    }
                  }
                }

                setDropIndex(null);
                setDropInto(false);
                setTempItem(null);
                setDragIndex(null);

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
                    onClick={() => selectParent()}
                    style={utils.makeCSSProperties(
                      'dir',
                      math.getDirection(parentAngle, 1),
                      'angle',
                      parentAngle - 90
                    )}>
                    <ThemedIcon
                      size="100%"
                      theme="material-symbols-rounded"
                      name="chevron_right"
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
                onKeyDown={(event) => {
                  // Select the center item if the user presses enter or space. This is
                  // required for keyboard navigation in the menu preview.
                  if (event.key === 'Enter' || event.key === ' ') {
                    selectCenter();
                  }

                  // Delete the menu if the user presses the delete key and the center
                  // item is the root menu. If it is a submenu, we delete the submenu
                  // instead.
                  if (event.key === 'Delete' || event.key === 'Backspace') {
                    if (showingRootMenu) {
                      deleteMenu(selectedMenu);
                    } else {
                      deleteMenuItem(selectedMenu, centerItemPath);
                      selectParent();
                    }
                  }
                }}
                onClick={() => selectCenter()}>
                <ThemedIcon
                  size={'100%'}
                  theme={centerItem.iconTheme}
                  name={centerItem.icon}
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
                renderedChildren.map((child, index) => {
                  // The dragged item does not have a lock icon.
                  if (isDraggedChild(child)) {
                    return null;
                  }

                  return renderLock(child, index);
                })
              }
            </div>
          </CSSTransition>
        </TransitionGroup>
      </div>
    </div>
  );
}

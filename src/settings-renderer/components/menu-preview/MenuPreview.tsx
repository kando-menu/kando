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

import ThemedIcon from '../common/ThemedIcon';
import { ItemTypeRegistry } from '../../../common/item-type-registry';
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
  icon: string;

  /** The theme from which the above icon should be used. */
  iconTheme: string;

  /** The fixed angle of the item. This is only set if the item is locked. */
  angle?: number;
}

/**
 * Small helper function which moves the item at the given index to the end of the array.
 *
 * @param array The array to modify.
 * @param index The index of the item to move.
 */
function moveToEnd<T>(array: T[], index: number) {
  const item = array[index];
  array.splice(index, 1);
  array.push(item);
}

/**
 * This component encapsules the center area of the settings dialog. It contains the
 * preview of the currently selected menu where the user can reorder and select menu
 * items.
 */
export default () => {
  const dnd = useAppState((state) => state.dnd);
  const startDrag = useAppState((state) => state.startDrag);
  const endDrag = useAppState((state) => state.endDrag);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectedChildPath = useAppState((state) => state.selectedChildPath);
  const selectChildPath = useAppState((state) => state.selectChildPath);
  const menus = useMenuSettings((state) => state.menus);

  // During a drag-and-drop operation, the drop index will be set to the position where
  // the dragged item should be dropped. If dropInto is true, the dragged item should be
  // dropped into the submenu at the given index.
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);
  const [dropInto, setDropInto] = React.useState(false);

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

  // Sanity check.
  const menu = menus[selectedMenu];
  if (!menu) {
    return null;
  }

  // First, we traverses the children of the current menu according to the selection path
  // and store the final (sub)menu. This is the menu which should be shown in the center.
  // This could either be the last item of the path (if a submenu is selected) or the
  // last-but-one item (if a menu item is selected). If the selection path is empty, the
  // root menu is the center item. We also store the index of the selected leaf child if
  // it is not a submenu. If the center is selected, the index is -1.
  let centerItem = menu.root;
  let selectedChild = -1;
  let isRoot = true;
  let parentAngle = null;
  let childAngles = math.computeItemAngles(centerItem.children);

  for (let i = 0; i < selectedChildPath.length; i++) {
    const childIndex = selectedChildPath[i];
    const child = centerItem.children[childIndex];
    const type = ItemTypeRegistry.getInstance().getType(child.type);
    if (type?.hasChildren) {
      isRoot = false;
      parentAngle = utils.getParentAngle(childAngles[childIndex]);
      centerItem = child;
      childAngles = math.computeItemAngles(centerItem.children, parentAngle);
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
  const renderedChildren = centerItem.children.map((child, i) => {
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
  });

  // If there is currently a drag operation in progress, we need to modify the list of
  // rendered children. If it is an external drag, we draw a "drop-indicator" item at the
  // drop position. We do not really insert it at the drop position because this confuses
  // React (there will not be proper transitions as the items are swapping places when the
  // dragged item is moved around). Instead, we just add it to the end of the list.
  if (dnd.draggedType === 'new-item') {
    const allItemTypes = Array.from(ItemTypeRegistry.getInstance().getAllTypes());
    const draggedType = allItemTypes[dnd.draggedIndex];
    const newItem: IRenderedMenuItem = {
      key: 'dragged',
      index: -1,
      icon: draggedType[1].defaultIcon,
      iconTheme: draggedType[1].defaultIconTheme,
    };

    // If dropIndex is null, the item is about to be dropped onto the back-navigation
    // link. In this case, we use the parent angle. If the item is dropped into a submenu,
    // we simply copy the angle of the submenu. In both cases there is no need to
    // recompute the angles of the rendered children. Only in the last case where the item
    // is about to be dropped somewhere among its siblings we need to recompute the
    // angles.
    if (dropIndex === null && dropInto) {
      renderedChildren.push(newItem);
      renderedChildAngles.push(parentAngle);
    } else if (dropIndex !== null && dropInto) {
      renderedChildren.push(newItem);
      renderedChildAngles.push(renderedChildAngles[dropIndex]);
    } else if (dropIndex !== null) {
      // First insert the drop-indicator item at the drop position to compute the angles
      // correctly.
      renderedChildren.splice(dropIndex, 0, newItem);
      renderedChildAngles = math.computeItemAngles(renderedChildren, parentAngle);

      // Now move the item and the angle to the end of the lists.
      moveToEnd(renderedChildren, dropIndex);
      moveToEnd(renderedChildAngles, dropIndex);
    }
  }

  // If it is an internal drag, we need to show the dragged item at the drop position.
  // Again, in order to not confuse React, we do not really move the item in the list of
  // rendered children. Instead, we only adapt the list of angles.
  if (dnd.draggedType === 'item') {
    // First create a copy of the children list. We will modify this to compute the
    // angles of the children as if the dragged item was at the drop position.
    const childrenCopy = [...renderedChildren];

    // Remove the dragged item from the list.
    const draggedItem = childrenCopy.splice(dnd.draggedIndex, 1)[0];

    // If it is not dropped into a submenu, we need to add it at the drop position.
    if (!dropInto) {
      childrenCopy.splice(dropIndex, 0, draggedItem);
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
    if (dropIndex === null && dropInto) {
      renderedChildAngles.splice(dnd.draggedIndex, 0, parentAngle);
    } else if (dropIndex !== null && dropInto) {
      renderedChildAngles.splice(
        dnd.draggedIndex,
        0,
        renderedChildAngles[dropIndex > dnd.draggedIndex ? dropIndex - 1 : dropIndex]
      );
    } else if (dropIndex !== null) {
      const dropAngle = renderedChildAngles.splice(dropIndex, 1)[0];
      renderedChildAngles.splice(dnd.draggedIndex, 0, dropAngle);
    }
  }

  // Make sure that all keys are unique.
  ensureUniqueKeys(renderedChildren);

  const childDirections = renderedChildAngles.map((angle) => math.getDirection(angle, 1));

  // Adds the given index to the selected menu path if the center is currently selected.
  // Else a child was selected and the hence the last index of the path is replaced.
  const selectChild = (which: number) => {
    if (selectedChild === -1) {
      selectChildPath(selectedChildPath.concat(which));
    } else {
      selectChildPath(selectedChildPath.slice(0, -1).concat(which));
    }

    // If the selected child is a submenu, we need to trigger a transition by changing
    // the key of the CSSTransition component.
    const child = centerItem.children[which];
    const type = ItemTypeRegistry.getInstance().getType(child.type);
    if (type?.hasChildren) {
      setTransitionPing(!transitionPing);
      setTransitionAngle(childAngles[which]);
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

  const renderChild = (child: IRenderedMenuItem, index: number) => {
    return (
      <div
        key={child.key}
        className={cx({
          child: true,
          selected: selectedChild >= 0 && selectedChild === child.index,
          dragging: isDraggedChild(child),
          dropping: dropInto && dropIndex === child.index,
        })}
        draggable={child.angle === undefined}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = 'copyMove';
          startDrag('item', index);
        }}
        onDragEnd={() => {
          setDropIndex(null);
          setDropInto(false);
          endDrag();
        }}
        onClick={() => selectChild(index)}
        style={utils.makeCSSProperties('dir', childDirections[index])}>
        <ThemedIcon size={'100%'} theme={child.iconTheme} name={child.icon} />
        {renderGrandchildren(child, renderedChildAngles[index])}
      </div>
    );
  };

  const renderLock = (child: IRenderedMenuItem, index: number) => {
    return (
      <div
        key={child.key}
        className={cx({
          lock: true,
          locked: child.angle !== undefined,
        })}
        style={utils.makeCSSProperties('dir', childDirections[index])}>
        <ThemedIcon
          size={'100%'}
          theme={'material-symbols-rounded'}
          name={child.angle !== undefined ? 'lock' : 'lock_open'}
        />
      </div>
    );
  };

  const currentContainer = transitionPing ? pingRef : pongRef;
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    const container = currentContainer.current;
    if (!container) {
      return;
    }

    // We are only interested in drag events for items and new items dragged from the
    // item list at the bottom.
    if (dnd.draggedType !== 'item' && dnd.draggedType !== 'new-item') {
      return;
    }

    // Compute container center.
    const rect = container.getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    // Compute the angle of the drop position.
    const x = e.clientX - center.x;
    const y = e.clientY - center.y;
    const dragAngle = math.getAngle({ x, y });

    const internalDrag = dnd.draggedType === 'item';
    const dragIndex = internalDrag ? dnd.draggedIndex : null;

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

    e.preventDefault();
  };

  // Returns true if the given child is the currently dragged item.
  const isDraggedChild = (child: IRenderedMenuItem) => {
    return (
      child.key.startsWith('dragged') ||
      (dnd.draggedType === 'item' && dnd.draggedIndex === child.index)
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
              className={cx({
                transitionContainer: true,
                dndOngoing: dnd.draggedType !== 'none',
              })}
              onDragOver={onDragOver}
              onDragLeave={(e) => {
                if (
                  dnd.draggedType === 'new-item' &&
                  !currentContainer.current?.contains(e.relatedTarget)
                ) {
                  setDropIndex(null);
                  setDropInto(false);
                }
              }}
              onDrop={(event) => {
                if (dnd.draggedType === 'item') {
                  if (dropIndex === null && dropInto) {
                    console.log('move item to parent');
                  } else if (dropIndex !== null && dropInto) {
                    console.log('move item to submenu');
                  } else if (dropIndex !== null) {
                    console.log('move item among siblings');
                  }
                } else if (dnd.draggedType === 'new-item') {
                  if (dropIndex === null && dropInto) {
                    console.log('create new item in parent');
                  } else if (dropIndex !== null && dropInto) {
                    console.log('create new item in submenu');
                  } else if (dropIndex !== null) {
                    console.log('create new item among siblings');
                  }
                }

                setDropIndex(null);
                setDropInto(false);

                event.preventDefault();
              }}>
              {
                // Except for the root menu, in all submenus a back link is shown which
                // allows the user to navigate back to the parent menu.
                !isRoot && (
                  <div
                    className={cx({
                      backLink: true,
                      dropping: dropInto && dropIndex === null,
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
};

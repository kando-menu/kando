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
  // last-but-one item (if a menu item is selected).
  // If the selection path is empty, the root menu is the center item.
  // We also store the index of the selected leaf child if it is not a submenu. If a
  // submenu or the root menu is selected, the index is -1.
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
      key: selectedMenu + 'child' + i,
      index: i,
      icon: child.icon,
      iconTheme: child.iconTheme,
      angle: child.angle,
    };
    return item;
  });

  // If there is currently a drag operation in progress, we need to modify the list of
  // rendered children. If it is an external drag, we need to add a new item at the drop
  // position. If it is an internal drag, we need to move the dragged item to the drop
  // position.
  if (dnd.draggedType === 'new-item' && !dropInto && dropIndex !== null) {
    const allItemTypes = Array.from(ItemTypeRegistry.getInstance().getAllTypes());
    const draggedType = allItemTypes[dnd.draggedIndex];
    const newItem: IRenderedMenuItem = {
      key: 'dragged' + dropIndex,
      index: -1,
      icon: draggedType[1].defaultIcon,
      iconTheme: draggedType[1].defaultIconTheme,
    };
    renderedChildren.splice(dropIndex, 0, newItem);
    renderedChildAngles = math.computeItemAngles(renderedChildren, parentAngle);
  }

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
  const getGrandchildDivs = (child: IRenderedMenuItem, angle: number) => {
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

    // Compute container center in an async way. This would be possible in a
    // synchronous way, but it would block the UI thread.
    utils.getBoundingClientRectAsync(container).then((rect) => {
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
    });

    e.preventDefault();
    e.stopPropagation();
  };

  // Returns true if the given child is the currently dragged item.
  const isDraggedChild = (child: IRenderedMenuItem) => {
    return (
      child.key.startsWith('dragged') ||
      (dnd.draggedType === 'item' && dnd.draggedIndex === child.index)
    );
  };

  const childDirections = renderedChildAngles.map((angle) => math.getDirection(angle, 1));

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
              onDragOver={onDragOver}
              onDragEnd={() => {
                setDropIndex(null);
                setDropInto(false);
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
                // Add all child items. They are positioned via CSS properties.
                renderedChildren.map((child, index) => {
                  return (
                    <div
                      key={child.key}
                      data-tooltip-content={child.key}
                      className={cx({
                        child: true,
                        selected: selectedChild >= 0 && selectedChild === child.index,
                        dragging: isDraggedChild(child),
                        dropping: dropInto && dropIndex === child.index,
                      })}
                      draggable
                      onDragStart={() => startDrag('item', index)}
                      onDragEnd={() => endDrag()}
                      onClick={() => selectChild(index)}
                      style={utils.makeCSSProperties('dir', childDirections[index])}>
                      <ThemedIcon
                        size={'100%'}
                        theme={child.iconTheme}
                        name={child.icon}
                      />
                      {getGrandchildDivs(child, renderedChildAngles[index])}
                    </div>
                  );
                })
              }
              {
                // Add the lock icons for each child item. When locked, the item cannot be
                // reordered via drag and drop, but its fixed angle can be adjusted instead.
                renderedChildren.map((child, index) => {
                  // The dragged item does not have a lock icon.
                  if (isDraggedChild(child)) {
                    return null;
                  }

                  return (
                    <div
                      key={'lock' + child.key}
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
                })
              }
            </div>
          </CSSTransition>
        </TransitionGroup>
      </div>
    </div>
  );
};

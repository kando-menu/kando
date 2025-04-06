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

  const menu = menus[selectedMenu];
  if (!menu) {
    return null;
  }

  // First, we traverses the children of the current menu according to the selection path
  // and store the final (sub)menu. This is the menu which should be shown in the center.
  // This could either be the last item of the path (if a submenu is selected) or the
  // last-but-one item (if a menu item is selected).
  // If the selection path is empty, the root menu is returned.
  // We also store the index of the selected child if it is not a submenu. If a submenu
  // or the root menu is selected, the index is -1.
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
  // items than the center item has children. Therefore we need a copy of the
  // centerItem.children array. If there is no drag operation in progress, we can use the
  // original array.
  const renderedChildren = centerItem.children.map((child, i) => {
    return {
      icon: child.icon,
      iconTheme: child.iconTheme,
      index: i,
      angle: child.angle,
      childAngles: child.children?.map((grandChild) => {
        return { angle: grandChild.angle };
      }),
    };
  });
  let renderedChildAngles = childAngles;

  // If there is currently a drag operation in progress, we need to modify the children
  // list of the center item. If it is an external drag, we need to add a new item to the
  // center item at the drop position. If it is an internal drag, we need to move the
  // dragged item to the drop position.
  if (dnd.draggedType === 'new-item' && !dropInto && dropIndex !== null) {
    const allItemTypes = Array.from(ItemTypeRegistry.getInstance().getAllTypes());
    const draggedType = allItemTypes[dnd.draggedIndex];
    const newItem = {
      icon: draggedType[1].defaultIcon,
      iconTheme: draggedType[1].defaultIconTheme,
      index: -1,
    };
    console.log('Adding at index', dropIndex, newItem);
    renderedChildren.splice(dropIndex, 0, newItem);
    renderedChildAngles = math.computeItemAngles(renderedChildren, parentAngle);
  }

  console.log(renderedChildren, renderedChildAngles);

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
  const getGrandchildDivs = (items: { angle?: number }[], childAngle: number) => {
    if (!items || items.length === 0) {
      return null;
    }

    const grandchildAngles = math.computeItemAngles(
      items,
      utils.getParentAngle(childAngle)
    );
    const grandchildDirections = grandchildAngles.map((angle) =>
      math.getDirection(angle, 1)
    );

    return items.map((grandChild, index) => {
      return (
        <div
          key={index}
          className={classes.grandChild}
          style={utils.makeCSSProperties(
            'dir',
            grandchildDirections[index],
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

      const children = childAngles.map((angle, i) => {
        const child = centerItem.children[i];
        const type = ItemTypeRegistry.getInstance().getType(child.type);
        return {
          angle,
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
              onDragOver={onDragOver}>
              {
                // Except for the root menu, in all submenus a back link is shown which
                // allows the user to navigate back to the parent menu.
                !isRoot && (
                  <div
                    className={classes.backLink}
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
                      key={'child' + child.index}
                      className={cx({
                        child: true,
                        selected: selectedChild === child.index,
                        dragging:
                          dnd.draggedType === 'item' && dnd.draggedIndex === child.index,
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
                      {getGrandchildDivs(child.childAngles, renderedChildAngles[index])}
                    </div>
                  );
                })
              }
              {
                // Add the lock icons for each child item. When locked, the item cannot be
                // reordered via drag and drop, but its fixed angle can be adjusted instead.
                renderedChildren.map((child, index) => {
                  return (
                    <div
                      key={'lock' + child.index}
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

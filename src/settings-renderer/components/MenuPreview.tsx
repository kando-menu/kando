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

import { useAppState, useMenuSettings } from '../state';
import * as math from '../../common/math';

import ThemedIcon from './widgets/ThemedIcon';
import { ItemTypeRegistry } from '../../common/item-type-registry';
import { IVec2, IMenuItem } from '../../common';

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
  let parentAngle = 0;

  let childAngles = math.computeItemAngles(centerItem.children);

  for (let i = 0; i < selectedChildPath.length; i++) {
    const childIndex = selectedChildPath[i];
    const child = centerItem.children[childIndex];
    const type = ItemTypeRegistry.getInstance().getType(child.type);
    if (type?.hasChildren) {
      isRoot = false;
      parentAngle = (childAngles[childIndex] + 180) % 360;
      centerItem = child;
      childAngles = math.computeItemAngles(centerItem.children, parentAngle);
    } else {
      selectedChild = childIndex;
      break;
    }
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

  // A small helper function to create CSS properties for the given direction and angle.
  // This is used a couple of times below.
  const makeCSSProperties = (
    directionName: string,
    direction: IVec2,
    angleName?: string,
    angle?: number
  ) => {
    const properties: Record<string, string | number> = {
      [`--${directionName}-x`]: direction.x,
      [`--${directionName}-y`]: direction.y,
    };

    if (angleName !== undefined && angle !== undefined) {
      properties[`--${angleName}`] = `${angle}deg`;
    }

    return properties;
  };

  // Assembles a list of divs for the grandchild items of the given child item.
  const getGrandchildDivs = (child: IMenuItem, childAngle: number) => {
    if (!child.children || child.children.length === 0) {
      return null;
    }

    const grandchildAngles = math.computeItemAngles(
      child.children,
      (childAngle + 180) % 360
    );
    const grandchildDirections = grandchildAngles.map((angle) =>
      math.getDirection(angle, 1)
    );

    return child.children.map((grandChild, index) => {
      return (
        <div
          key={index}
          className={classes.grandChild}
          style={makeCSSProperties(
            'dir',
            grandchildDirections[index],
            'angle',
            grandchildAngles[index]
          )}
        />
      );
    });
  };

  const childDirections = childAngles.map((angle) => math.getDirection(angle, 1));

  return (
    <div className={classes.previewArea}>
      <div
        className={classes.preview}
        style={makeCSSProperties(
          'transition-dir',
          math.getDirection(transitionAngle, 1.0)
        )}>
        <TransitionGroup>
          <CSSTransition
            key={transitionPing ? 'ping' : 'pong'}
            nodeRef={transitionPing ? pingRef : pongRef}
            timeout={350}
            classNames={{
              enter: classes.fadeEnter,
              enterActive: classes.fadeEnterActive,
              exit: classes.fadeExit,
              exitActive: classes.fadeExitActive,
            }}>
            <div
              ref={transitionPing ? pingRef : pongRef}
              className={classes.transitionContainer}>
              {
                // Except for the root menu, in all submenus a back link is shown which
                // allows the user to navigate back to the parent menu.
                !isRoot && (
                  <div
                    className={classes.backLink}
                    onClick={() => selectParent()}
                    style={makeCSSProperties(
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
                centerItem.children.map((child, index) => {
                  return (
                    <div
                      key={index}
                      className={cx({
                        child: true,
                        selected: selectedChild === index,
                        dragging:
                          dnd.draggedType === 'item' && dnd.draggedIndex === index,
                      })}
                      draggable
                      onDragStart={() => startDrag('item', index)}
                      onDragEnd={() => endDrag()}
                      onClick={() => selectChild(index)}
                      style={makeCSSProperties('dir', childDirections[index])}>
                      <ThemedIcon
                        size={'100%'}
                        theme={child.iconTheme}
                        name={child.icon}
                      />
                      {getGrandchildDivs(child, childAngles[index])}
                    </div>
                  );
                })
              }
              {
                // Add the lock icons for each child item. When locked, the item cannot be
                // reordered via drag and drop, but its fixed angle can be adjusted instead.
                centerItem.children.map((child, index) => {
                  return (
                    <div
                      key={'lock' + index}
                      className={cx({
                        lock: true,
                        locked: child.angle !== undefined,
                      })}
                      style={makeCSSProperties('dir', childDirections[index])}>
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

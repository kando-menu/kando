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
 * This function returns the direction towards the parent of an item with the given angle.
 * This is the angle + 180 degrees. The result is normalized to the range [0, 360).
 *
 * @param item The angle of the item.
 * @returns The angle towards the parent of the given item.
 */
function getParentAngle(angle: number): number {
  return (angle + 180) % 360;
}

/**
 * This is used to compute the drop target during drag-and-drop operations in the menu
 * preview. It computes the drop index by testing all possible indices and choosing the
 * one which results in the smallest angle between the currently dragged item and the drop
 * position.
 *
 * It is also possible to drop the dragged item into a submenu. In this case, the drop
 * index will be the index of the submenu and the dropInto property will be set to true.
 *
 * Finally, if the dragged item is about to be dropped into the back-navigation link, the
 * drop index will be null and the dropInto property will be set to true as well.
 *
 * @param parentAngle The angle towards the parent of the current center item. For the
 *   root menu, this should be null.
 * @param children The angles of the children of the current center item. These also
 *   contain the dropTarget property which indicates whether the item is a valid drop
 *   target.
 * @param dragAngle The angle of the dragged item.
 * @param dragIndex If the dragged item is a child of centerItem, this is the index of the
 *   dragged item in centerItem.children. It will be excluded from the list of possible
 *   drop targets and ignored when computing item angles.
 * @returns The item index where to drop the dragged item. If dropInto is true, the
 *   dragged item should be dropped into the submenu at the given index.
 */
function computeDropTarget(
  parentAngle: number,
  children: { angle: number; dropTarget: boolean }[],
  dragAngle: number,
  dragIndex?: number
): {
  dropIndex: number;
  dropInto: boolean;
} {
  // First we assemble a list of all possible drop targets. We exclude the dragged item
  // from the list of candidates, but we need to keep the index in the original list so
  // that we can return it later.

  const candidates = children
    .map((child, i) => {
      return { angle: child.angle, dropTarget: child.dropTarget, index: i };
    })
    .filter((_, i) => i !== dragIndex);

  // Now we iterate over all possible drop indices and compute the angle between the
  // dragged item and the drop position candidate. We choose the index which results in
  // the smallest angle.
  let bestIndex = 0;
  let bestDiff = 180;

  for (let i = 0; i <= children.length; i++) {
    const { dropAngle } = computeItemAnglesWithDropIndex(candidates, i, parentAngle);

    const diff = math.getAngularDifference(dragAngle, dropAngle);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  }

  // We check whether the back-navigation link is closer.
  if (
    parentAngle != null &&
    math.getAngularDifference(dragAngle, parentAngle) < bestDiff
  ) {
    return { dropIndex: null, dropInto: true };
  }

  // Finally, we check whether a submenu is closer. There are some weird edge cases where
  // it's not possible to drop something into a submenu (e.g. when the submenu is at the
  // top of the menu). As a workaround, we add a small 5 degree region around each
  // submenu. If the dragged item is within this region, we consider the submenu as the
  // drop target.
  let dropInto = false;
  let dropIndex = bestIndex;

  const itemAngles = math.computeItemAngles(candidates, parentAngle);
  for (let i = 0; i < candidates.length; i++) {
    const child = candidates[i];
    if (child.dropTarget) {
      const diff = math.getAngularDifference(dragAngle, itemAngles[i]);
      if (diff < bestDiff || diff < 5) {
        dropIndex = child.index;
        bestDiff = diff;
        dropInto = true;
      }
    }
  }

  return { dropIndex, dropInto };
}

/**
 * This is basically a variant of the math.computeItemAngles() function which is used
 * during drag-and-drop operations. It behaves similar to the computeItemAngles function,
 * but it allows to pass an additional drop index. The computed item angles will leave a
 * gap for the to-be-dropped item.
 *
 * @param items The Items for which the angles should be computed. They may already have
 *   an angle property. If so, this is considered a fixed angle.
 * @param dropIndex The index of the location where something is about to be dropped.
 * @param parentAngle The angle of the parent item. If given, there will be some reserved
 *   space.
 * @returns An array of angles in degrees and the angle for the to-be-dropped item.
 */
function computeItemAnglesWithDropIndex(
  items: { angle?: number }[],
  dropIndex: number,
  parentAngle?: number
): { itemAngles: number[]; dropAngle: number } {
  // Create a copy of the items array.
  const itemsCopy = items.slice();

  // Add an artificial item at the position where something is about to be dropped.
  itemsCopy.splice(dropIndex, 0, {});

  // Now compute the angles as usual.
  const itemAngles = math.computeItemAngles(itemsCopy, parentAngle);

  // We added an artificial item to leave an angular gap for the to-be-dropped item. We
  // have to remove this again from the list of item angles as there is no real item at
  // this position. We only wanted to affect the angles for the adjacent items.
  // We will also return the angle for the to-be-dropped item (if given).
  const dropAngle = itemAngles.splice(dropIndex, 1)[0];

  return { itemAngles, dropAngle };
}

/**
 * A small helper function to create CSS properties for the given direction and angle.
 * This is used a couple of times below.
 *
 * @param directionName The name of the CSS property.
 * @param direction The direction vector.
 * @param angleName The name of the CSS property for the angle.
 * @param angle The angle in degrees.
 * @returns A map of CSS properties.
 */
function makeCSSProperties(
  directionName: string,
  direction: IVec2,
  angleName?: string,
  angle?: number
): React.CSSProperties {
  const properties: Record<string, string | number> = {
    [`--${directionName}-x`]: direction.x,
    [`--${directionName}-y`]: direction.y,
  };

  if (angleName !== undefined && angle !== undefined) {
    properties[`--${angleName}`] = `${angle}deg`;
  }

  return properties;
}

/**
 * This method returns the bounding box of the given element. Very similar to
 * `element.getBoundingClientRect()`, but in an async way.
 *
 * @param element The element to get the bounding box of.
 * @returns A promise that resolves to the bounding box of the element.
 */
function getBoundingClientRectAsync(element: HTMLElement): Promise<DOMRectReadOnly> {
  return new Promise((resolve) => {
    const observer = new IntersectionObserver((entries) => {
      observer.disconnect();
      resolve(entries[0].boundingClientRect);
    });
    observer.observe(element);
  });
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
      parentAngle = getParentAngle(childAngles[childIndex]);
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

    const grandchildAngles = math.computeItemAngles(items, getParentAngle(childAngle));
    const grandchildDirections = grandchildAngles.map((angle) =>
      math.getDirection(angle, 1)
    );

    return items.map((grandChild, index) => {
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
    getBoundingClientRectAsync(container).then((rect) => {
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
      const { dropIndex, dropInto } = computeDropTarget(
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
        style={makeCSSProperties(
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
                      style={makeCSSProperties('dir', childDirections[index])}>
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

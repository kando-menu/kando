//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import * as math from '../../../common/math';
import { Vec2 } from '../../../common';

/**
 * This function returns the direction towards the parent of an item with the given angle.
 * This is the angle + 180 degrees. The result is normalized to the range [0, 360).
 *
 * @param item The angle of the item.
 * @returns The angle towards the parent of the given item.
 */
export function getParentAngle(angle: number): number {
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
 * drop index will be -1 and the dropInto property will be set to true as well.
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
 *   dragged item should be dropped into the submenu at the given index. If dropIndex is
 *   -1 the dragged item should be dropped into the back-navigation link.
 */
export function computeDropTarget(
  parentAngle: number,
  children: { angle?: number; dropTarget: boolean }[],
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

  for (let i = 0; i <= candidates.length; i++) {
    const dropAngle = computeDropAngle(candidates, i, parentAngle);
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
    return { dropIndex: -1, dropInto: true };
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
 * This computes the angle where an item would be rendered if it was inserted in the given
 * position into a list of items.
 *
 * @param items The list of items into which the item is about to be inserted. If an item
 *   has an angle, it will be used as a fixed angle.
 * @param dropIndex The index of the location where something is about to be dropped.
 * @param parentAngle The angle of the parent item. If given, there will be some reserved
 *   space.
 * @returns The angle of the to-be-dropped item.
 */
function computeDropAngle(
  items: { angle?: number }[],
  dropIndex: number,
  parentAngle?: number
): number {
  // Create a copy of the items array.
  const itemsCopy = items.slice();

  // Add an artificial item at the position where something is about to be dropped.
  itemsCopy.splice(dropIndex, 0, {});

  // Now compute the angles as usual.
  const itemAngles = math.computeItemAngles(itemsCopy, parentAngle);

  // The drop angle is the angle of the item at the drop index.
  return itemAngles[dropIndex];
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
export function makeCSSProperties(
  directionName: string,
  direction: Vec2,
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
export function getBoundingClientRectAsync(
  element: HTMLElement
): Promise<DOMRectReadOnly> {
  return new Promise((resolve) => {
    const observer = new IntersectionObserver((entries) => {
      observer.disconnect();
      resolve(entries[0].boundingClientRect);
    });
    observer.observe(element);
  });
}

/**
 * This method returns the angle between the given pointer and the center of the given
 * element.
 *
 * @param element The element to get the center of.
 * @param pointer The pointer to get the angle to.
 * @returns The angle between the pointer and the center of the element.
 */
export function getAngleToCenter(element: HTMLElement, pointer: Vec2) {
  const rect = element.getBoundingClientRect();
  const center = {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
  const x = pointer.x - center.x;
  const y = pointer.y - center.y;

  return math.getAngle({ x, y });
}

/**
 * Small helper function which moves the item at the given index to the end of the array.
 *
 * @param array The array to modify.
 * @param index The index of the item to move.
 */
export function moveToEnd<T>(array: T[], index: number) {
  const item = array[index];
  array.splice(index, 1);
  array.push(item);
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IVec2 } from '../../common';

/** This method returns the the given value clamped to the given range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** This method converts radians to degrees. */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/** This method converts degrees to radians. */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** This method returns the length of the given vector. */
export function getLength(vec: IVec2): number {
  return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
}

/** This method returns the distance between the two given vectors. */
export function getDistance(vec1: IVec2, vec2: IVec2): number {
  return getLength({ x: vec1.x - vec2.x, y: vec1.y - vec2.y });
}

/** This adds two IVec2 together. */
export function add(vec1: IVec2, vec2: IVec2): IVec2 {
  return { x: vec1.x + vec2.x, y: vec1.y + vec2.y };
}

/** This subtracts vec2 from vec1. */
export function subtract(vec1: IVec2, vec2: IVec2): IVec2 {
  return { x: vec1.x - vec2.x, y: vec1.y - vec2.y };
}

/**
 * This returns the angular difference between the two given angles using the shortest
 * path. The result will always be between 0° and 180°.
 */
export function getAngularDifference(angle1: number, angle2: number): number {
  const diff = Math.abs((angle1 % 360) - (angle2 % 360));
  return Math.min(diff, 360 - diff);
}

/**
 * This method returns the angle of the given vector in degrees. 0° is on the top, 90° is
 * on the right, 180° is on the bottom and 270° is on the right. The vector does not need
 * to be normalized.
 */
export function getAngle(vec: IVec2): number {
  const angle = (toDegrees(Math.atan2(vec.y, vec.x)) + 90) % 360;
  if (angle < 0) {
    return 360 + angle;
  }

  return angle;
}

/**
 * This method returns the direction vector for the given angle and length. 0° is on the
 * top, 90° is on the right, 180° is on the bottom and 270° is on the right.
 */
export function getDirection(angle: number, length: number): IVec2 {
  const radians = toRadians(angle - 90);
  return {
    x: Math.cos(radians) * length,
    y: Math.sin(radians) * length,
  };
}

/**
 * This method receives an array of objects, each representing an item in a menu level.
 * For each item it computes an angle defining the direction in which the item should be
 * rendered. The angles are returned in an array (of the same length as the input array).
 * If an item in the input array already has an 'angle' property, this is considered a
 * fixed angle and all others are distributed more ore less evenly around. This method
 * also reserves the required angular space for the back navigation link to the parent
 * item (if given). Angles in items are always in degrees, 0° is on the top, 90° on the
 * right, 180° on the bottom and so on. Fixed input angles must be monotonically
 * increasing. If this is not the case, the smaller angle is ignored.
 *
 * @param items The Items for which the angles should be computed. They may already have
 *   an angle property. If so, this is considered a fixed angle.
 * @param parentAngle The angle of the parent item. If given, there will be some reserved
 *   space.
 * @returns An array of angles in degrees.
 */
export function computeItemAngles(
  items: { angle?: number }[],
  parentAngle?: number
): number[] {
  const itemAngles: number[] = [];

  // Shouldn't happen, but who knows...
  if (items.length == 0) {
    return itemAngles;
  }

  // We begin by storing all fixed angles.
  const fixedAngles: { angle: number; index: number }[] = [];
  items.forEach((item, index) => {
    if ('angle' in item && item.angle >= 0) {
      fixedAngles.push({ angle: item.angle, index: index });
    }
  });

  // Make sure that the parent link does not collide with a fixed item. For now, we
  // just move the fixed angle a tiny bit. This is somewhat error-prone as it may
  // collide with another fixed angle now. Maybe this could be solved in a better way?
  // Maybe some global minimum angular spacing of items?
  if (parentAngle != undefined) {
    for (let i = 0; i < fixedAngles.length; i++) {
      if (Math.abs(fixedAngles[i].angle - parentAngle) < 0.0001) {
        fixedAngles[i].angle += 0.1;
      }
    }
  }

  // Make sure that the fixed angles are between 0° and 360°.
  for (let i = 0; i < fixedAngles.length; i++) {
    fixedAngles[i].angle = fixedAngles[i].angle % 360;
  }

  // Make sure that the fixed angles increase monotonically. If a fixed angle is larger
  // than the next one, the next one will be ignored.
  for (let i = 0; i < fixedAngles.length - 1; ) {
    if (fixedAngles[i].angle > fixedAngles[i + 1].angle) {
      fixedAngles.splice(i + 1, 1);
    } else {
      ++i;
    }
  }

  // If no item has a fixed angle, we assign one to the first item. If there is no
  // parent item, this is on the top (0°). Else, the angular space will be evenly
  // distributed to all child items and the first item will be at the first possible
  // location with an angle > 0.
  if (fixedAngles.length == 0) {
    let firstAngle = 0;
    if (parentAngle != undefined) {
      const wedgeSize = 360 / (items.length + 1);
      let minAngle = 360;
      for (let i = 0; i < items.length; i++) {
        minAngle = Math.min(minAngle, (parentAngle + (i + 1) * wedgeSize) % 360);
      }
      firstAngle = minAngle;
    }
    fixedAngles.push({ angle: firstAngle, index: 0 });
    itemAngles[0] = firstAngle;
  }

  // Now we iterate through the fixed angles, always considering wedges between
  // consecutive pairs of fixed angles. If there is only one fixed angle, there is also
  // only one 360°-wedge.
  for (let i = 0; i < fixedAngles.length; i++) {
    const wedgeBeginIndex = fixedAngles[i].index;
    const wedgeBeginAngle = fixedAngles[i].angle;
    const wedgeEndIndex = fixedAngles[(i + 1) % fixedAngles.length].index;
    let wedgeEndAngle = fixedAngles[(i + 1) % fixedAngles.length].angle;

    // The fixed angle can be stored in our output.
    itemAngles[wedgeBeginIndex] = wedgeBeginAngle;

    // Make sure we loop around.
    if (wedgeEndAngle <= wedgeBeginAngle) {
      wedgeEndAngle += 360;
    }

    // Calculate the number of items between the begin and end indices.
    let wedgeItemCount =
      (wedgeEndIndex - wedgeBeginIndex - 1 + items.length) % items.length;

    // We have one item more if the parent link is inside our wedge.
    let parentInWedge = false;

    if (parentAngle != undefined) {
      // It can be that the parent link is inside the current wedge, but it's angle is
      // one full turn off.
      if (parentAngle < wedgeBeginAngle) {
        parentAngle += 360;
      }

      parentInWedge = parentAngle > wedgeBeginAngle && parentAngle < wedgeEndAngle;
      if (parentInWedge) {
        wedgeItemCount += 1;
      }
    }

    // Calculate the angular difference between consecutive items in the current wedge.
    const wedgeItemGap = (wedgeEndAngle - wedgeBeginAngle) / (wedgeItemCount + 1);

    // Now we assign an angle to each item between the begin and end indices.
    let index = (wedgeBeginIndex + 1) % items.length;
    let count = 1;
    let parentGapRequired = parentInWedge;

    while (index != wedgeEndIndex) {
      let itemAngle = wedgeBeginAngle + wedgeItemGap * count;

      // Insert gap for parent link if required.
      if (parentGapRequired && itemAngle + wedgeItemGap / 2 - parentAngle > 0) {
        count += 1;
        itemAngle = wedgeBeginAngle + wedgeItemGap * count;
        parentGapRequired = false;
      }

      itemAngles[index] = itemAngle % 360;

      index = (index + 1) % items.length;
      count += 1;
    }
  }

  return itemAngles;
}

/**
 * Computes the start and end angles of the wedges for the given items. The parent angle
 * is optional. If it is given, there will be a gap towards the parent item.
 *
 * @param itemAngles A list of angles for each item. The angles are in degrees and between
 *   0° and 360°.
 * @param parentAngle The angle of the parent item. If given, there will be a gap towards
 *   the parent item. This should be in degrees and between 0° and 360°.
 * @returns A list of start and end angles for each item. Each item in the list
 *   corresponds to the item at the same index in the `itemAngles` list. The start angle
 *   will always be smaller than the end angle. Consequently, the start angle can be
 *   negative and the end angle can be larger than 360°.
 */
export function computeItemWedges(
  itemAngles: number[],
  parentAngle?: number
): { start: number; end: number }[] {
  // This should never happen, but who knows...
  if (itemAngles.length === 0 && parentAngle === undefined) {
    return [];
  }

  // If the item has a single child but no parent (e.g. it's the root item), we can
  // simply return a full circle.
  if (itemAngles.length === 1 && parentAngle === undefined) {
    return [{ start: 0, end: 360 }];
  }

  // If the item has a single child and a parent, we can set the start and end
  // angles to the center angles.
  if (itemAngles.length === 1 && parentAngle !== undefined) {
    let start = parentAngle;
    let center = itemAngles[0];
    let end = parentAngle + 360;

    [start, center, end] = normalizeConsequtiveAngles(start, center, end);
    [start, end] = scaleWedge(start, center, end, 0.5);

    return [{ start: start, end: end }];
  }

  // In all other cases, we loop through the items and compute the wedges. If the parent
  // angle happens to be inside a wedge, we crop the wedge accordingly.
  const wedges: { start: number; end: number }[] = [];

  for (let i = 0; i < itemAngles.length; i++) {
    let start = itemAngles[(i + itemAngles.length - 1) % itemAngles.length];
    let center = itemAngles[i];
    let end = itemAngles[(i + 1) % itemAngles.length];

    [start, center, end] = normalizeConsequtiveAngles(start, center, end);

    if (parentAngle !== undefined) {
      [start, end] = cropWedge(start, center, end, parentAngle);
      [start, center, end] = normalizeConsequtiveAngles(start, center, end);
    }

    [start, end] = scaleWedge(start, center, end, 0.5);

    wedges.push({ start: start, end: end });
  }

  return wedges;
}

/**
 * This method returns true if the given angle is between the given start and end angles.
 * The angles are in degrees and start should be smaller than end. The method also works
 * if the angle and the start and end angles are negative or larger than 360°.
 *
 * @param angle The angle to check.
 * @param start The start angle.
 * @param end The end angle.
 */
export function isAngleBetween(angle: number, start: number, end: number): boolean {
  return (
    (angle > start && angle <= end) ||
    (angle - 360 > start && angle - 360 <= end) ||
    (angle + 360 > start && angle + 360 <= end)
  );
}

/**
 * This method ensures that the given angles have increasing values. To ensure this, they
 * will be increased or decreased by 360° if necessary. The center angle will be between
 * 0° and 360°. The start angle may be negative and the end angle may be larger than 360°.
 * But their mutual difference will be less than 360°.
 *
 * @param start The first angle.
 * @param center The second angle.
 * @param end The third angle.
 * @returns An array of three angles.
 */
function normalizeConsequtiveAngles(start: number, center: number, end: number) {
  while (center < start) {
    center += 360;
  }

  while (end < center) {
    end += 360;
  }

  while (center >= 360) {
    start -= 360;
    center -= 360;
    end -= 360;
  }

  return [start, center, end];
}

/**
 * This method crops the given wedge if the given angle is inside it. The wedge is defined
 * by the start and end angles and the center angle. If the given crop angle is between
 * the start and center angle, the start angle will be set to the crop angle. If the crop
 * angle is between the center and end angle, the end angle will be set to the crop
 * angle.
 *
 * @param start The start angle of the wedge.
 * @param center The center angle of the wedge.
 * @param end The end angle of the wedge.
 * @param cropAngle The angle to crop the wedge with.
 * @returns The new start and end angles of the wedge.
 */
function cropWedge(start: number, center: number, end: number, cropAngle: number) {
  if (isAngleBetween(cropAngle, start, center)) {
    start = cropAngle;
  }

  if (isAngleBetween(cropAngle, center, end)) {
    end = cropAngle;
  }

  return [start, end];
}

/**
 * This method scales the given wedge by the given amount. The wedge is defined by the
 * start and end angles and the center angle. The scale should be between 0.0 and 1.0. The
 * start and end angles will be moved towards the center angle by the given amount.
 *
 * @param start The start angle of the wedge.
 * @param center The center angle of the wedge.
 * @param end The end angle of the wedge.
 * @param scale The amount to scales the wedge by (0.0 to 1.0).
 * @returns The new start and end angles of the wedge.
 */
function scaleWedge(start: number, center: number, end: number, scale: number) {
  start = center - (center - start) * scale;
  end = center + (end - center) * scale;

  return [start, end];
}

/**
 * Given the center coordinates and maximum radius of a menu, this method returns a new
 * position which ensures that the menu and all of its children and grandchildren are
 * inside the current monitor's bounds.
 *
 * @param position The center position of the menu.
 * @param radius The maximum radius of the menu.
 * @returns The clamped position.
 */
export function clampToMonitor(position: IVec2, radius: number): IVec2 {
  const maxX = window.innerWidth - radius;
  const maxY = window.innerHeight - radius;

  const posX = clamp(position.x, radius, maxX);
  const posY = clamp(position.y, radius, maxY);

  // Ensure integer position.
  return { x: Math.floor(posX), y: Math.floor(posY) };
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: 2026 cocojojo5213 <https://github.com/cocojojo5213>
// SPDX-License-Identifier: MIT

import { Vec2 } from '../common';

/**
 * Computes the relative movement required to move the pointer from its current position
 * back to the position where the menu was opened.
 *
 * @param openingPosition The pointer position when the menu was opened.
 * @param currentPosition The pointer position after an item was selected.
 * @returns The relative movement required to return to the opening position.
 */
export function getPointerReturnOffset(
  openingPosition: Vec2,
  currentPosition: Vec2
): Vec2 {
  return {
    x: openingPosition.x - currentPosition.x,
    y: openingPosition.y - currentPosition.y,
  };
}

/**
 * Applies the platform-specific pointer movement scale.
 *
 * @param offset The relative movement in logical pixels.
 * @param scale The scale factor required by the backend.
 * @returns The relative movement in backend pixels.
 */
export function scalePointerOffset(offset: Vec2, scale: number): Vec2 {
  return {
    x: Math.floor(offset.x * scale),
    y: Math.floor(offset.y * scale),
  };
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * A simple 2D vector.
 *
 * Maybe we should turn this into a class and add some operations.
 */
export interface IVec2 {
  x: number;
  y: number;
}

export interface IKeyStroke {
  name: string;
  down: boolean;
  delay: number;
}

export type IKeySequence = Array<IKeyStroke>;

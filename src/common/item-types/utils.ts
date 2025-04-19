//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * This function returns a random number between 0 and 1. The seed is used to generate the
 * random number. A very simplisitc implementation of a random number generator taken from
 * https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript.
 * For our purpose of choosing a random tip, this is sufficient.
 *
 * @param seed The seed used to generate the random number.
 * @returns A random number between 0 and 1.
 */
function random(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * This function chooses a random tip from the given list of tips. The seed is used to
 * generate the random number. This way, the same seed will always return the same tip.
 *
 * @param tips The list of tips to choose from.
 * @param seed The seed used to generate the random number.
 * @returns A random tip from the list of tips.
 */
export function chooseRandomTip(tips: string[], seed: number): string {
  return tips[Math.floor(random(seed) * tips.length)];
}

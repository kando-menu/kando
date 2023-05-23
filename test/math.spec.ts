//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do,                 //
//     . <   _|   .  | ____| |  | (   |    the open-source cross-platform pie menu.     //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { computeItemAngles } from '../src/menu/math';
import { assert } from 'chai';

describe('computeItemAngles', () => {
  it('should return the correct angles for a list of items', () => {
    const items = [{}, {}, {}, {}];
    const angles = computeItemAngles(items);
    assert.deepEqual(angles, [0, 90, 180, 270]);
  });

  it('should return an empty array for an empty list of items', () => {
    const items = [];
    const angles = computeItemAngles(items);
    assert.deepEqual(angles, []);
  });

  it('should return an empty array if an empty list and a parent angle is given', () => {
    const items = [];
    const angles = computeItemAngles(items, 90);
    assert.deepEqual(angles, []);
  });

  it('should leave some space for a parent item', () => {
    const items = [{}, {}, {}, {}, {}];
    const angles = computeItemAngles(items, 25);
    assert.deepEqual(angles, [325, 85, 145, 205, 265]);
  });
});

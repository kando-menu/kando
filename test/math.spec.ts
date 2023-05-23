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
  it('should return an empty array for an empty list of items', () => {
    const items = [];
    let angles = computeItemAngles(items);
    assert.deepEqual(angles, []);

    angles = computeItemAngles(items, 90);
    assert.deepEqual(angles, []);
  });

  it('should return the correct angles for a list of items', () => {
    const items = [{}, {}, {}, {}];
    const angles = computeItemAngles(items);
    assert.deepEqual(angles, [0, 90, 180, 270]);
  });

  it('should leave some space for a parent item', () => {
    const items = [{}, {}, {}, {}, {}, {}, {}];
    let angles = computeItemAngles(items, 45);
    assert.deepEqual(angles, [0, 90, 135, 180, 225, 270, 315]);

    angles = computeItemAngles(items, 180);
    assert.deepEqual(angles, [0, 45, 90, 135, 225, 270, 315]);
  });

  it('should obey a fixed angles', () => {
    let items = [{ angle: 120 }, {}, {}, {}];
    let angles = computeItemAngles(items);
    assert.deepEqual(angles, [120, 210, 300, 30]);

    items = [{}, {}, { angle: 120 }, {}];
    angles = computeItemAngles(items);
    assert.deepEqual(angles, [300, 30, 120, 210]);

    items = [{ angle: 1 }, { angle: 2 }, { angle: 120 }, { angle: 121 }];
    angles = computeItemAngles(items);
    assert.deepEqual(angles, [1, 2, 120, 121]);
  });

  it('should ignore invalid fixed angles', () => {
    const items = [{ angle: 120 }, { angle: 119 }, {}, {}];
    const angles = computeItemAngles(items);
    assert.deepEqual(angles, [120, 210, 300, 30]);
  });

  it('should properly handle fixed angles and parent items', () => {
    const items = [{ angle: 120 }, {}, {}, {}];
    const angles = computeItemAngles(items, 150);
    assert.deepEqual(angles, [120, 264, 336, 48]);
  });
});

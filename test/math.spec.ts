//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { computeItemAngles, computeItemWedges } from '../src/renderer/math';
import { expect } from 'chai';

describe('computeItemAngles', () => {
  it('should return an empty array for an empty list of items', () => {
    const items = [];
    let angles = computeItemAngles(items);
    expect(angles).to.deep.equal([]);

    const parentAngle = 90;
    angles = computeItemAngles(items, parentAngle);
    expect(angles).to.deep.equal([]);
  });

  it('should return the correct angles for a list of items', () => {
    const items = [{}, {}, {}, {}];
    const angles = computeItemAngles(items);
    expect(angles).to.deep.equal([0, 90, 180, 270]);
  });

  it('should leave some space for a parent item', () => {
    const items = [{}, {}, {}, {}, {}, {}, {}];
    let parentAngle = 45;
    let angles = computeItemAngles(items, parentAngle);
    expect(angles).to.deep.equal([0, 90, 135, 180, 225, 270, 315]);

    parentAngle = 180;
    angles = computeItemAngles(items, parentAngle);
    expect(angles).to.deep.equal([0, 45, 90, 135, 225, 270, 315]);
  });

  it('should obey a fixed angles', () => {
    let items = [{ angle: 120 }, {}, {}, {}];
    let angles = computeItemAngles(items);
    expect(angles).to.deep.equal([120, 210, 300, 30]);

    items = [{}, {}, { angle: 120 }, {}];
    angles = computeItemAngles(items);
    expect(angles).to.deep.equal([300, 30, 120, 210]);

    items = [{ angle: 1 }, { angle: 2 }, { angle: 120 }, { angle: 121 }];
    angles = computeItemAngles(items);
    expect(angles).to.deep.equal([1, 2, 120, 121]);
  });

  it('should ignore invalid fixed angles', () => {
    const items = [{ angle: 120 }, { angle: 119 }, {}, {}];
    const angles = computeItemAngles(items);
    expect(angles).to.deep.equal([120, 210, 300, 30]);
  });

  it('should properly handle fixed angles and parent items', () => {
    const items = [{ angle: 120 }, {}, {}, {}];
    const parentAngle = 150;
    const angles = computeItemAngles(items, parentAngle);
    expect(angles).to.deep.equal([120, 264, 336, 48]);
  });
});

describe('computeItemWedges', () => {
  it('should return the correct wedges for a list of item angles', () => {
    const itemAngles = [0, 90, 180, 270];
    const wedges = computeItemWedges(itemAngles);
    expect(wedges).to.deep.equal([
      { start: -45, end: 45 },
      { start: 45, end: 135 },
      { start: 135, end: 225 },
      { start: 225, end: 315 },
    ]);
  });

  it('should return a full circle for a single item with no parent', () => {
    const itemAngles = [123];
    const wedges = computeItemWedges(itemAngles);
    expect(wedges).to.deep.equal([{ start: 0, end: 360 }]);
  });

  it('should return an empty array for an empty list of item angles', () => {
    const itemAngles: number[] = [];
    const wedges = computeItemWedges(itemAngles);
    expect(wedges).to.deep.equal([]);
  });

  it('should handle a single item with a parent correctly', () => {
    let itemAngles = [0];
    let parentAngle = 180;
    let wedges = computeItemWedges(itemAngles, parentAngle);
    expect(wedges).to.deep.equal([{ start: -90, end: 90 }]);

    itemAngles = [125];
    parentAngle = 305;
    wedges = computeItemWedges(itemAngles, parentAngle);
    expect(wedges).to.deep.equal([{ start: 35, end: 215 }]);

    itemAngles = [180];
    parentAngle = 200;
    wedges = computeItemWedges(itemAngles, parentAngle);
    expect(wedges).to.deep.equal([{ start: 10, end: 190 }]);
  });

  it('should handle multiple items with a parent correctly', () => {
    const itemAngles = [0, 90, 270];
    const parentAngle = 180;
    const wedges = computeItemWedges(itemAngles, parentAngle);
    expect(wedges).to.deep.equal([
      { start: -45, end: 45 },
      { start: 45, end: 135 },
      { start: 225, end: 315 },
    ]);
  });
});

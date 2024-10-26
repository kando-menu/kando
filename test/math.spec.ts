//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import {
  normalize,
  computeItemAngles,
  computeItemWedges,
  getAngularDifference,
  isAngleBetween,
} from '../src/renderer/math';
import { expect } from 'chai';

describe('normalize', () => {
  it('should return normalized 2D vectors', () => {
    expect(normalize({ x: 1, y: 0 })).to.deep.equal({ x: 1, y: 0 });
    expect(normalize({ x: 0, y: 1 })).to.deep.equal({ x: 0, y: 1 });
    expect(normalize({ x: 1, y: 1 })).to.deep.equal({
      x: 0.7071067811865475,
      y: 0.7071067811865475,
    });
    expect(normalize({ x: -1, y: 0 })).to.deep.equal({ x: -1, y: 0 });
    expect(normalize({ x: 0, y: -1 })).to.deep.equal({ x: 0, y: -1 });
    expect(normalize({ x: -1, y: -1 })).to.deep.equal({
      x: -0.7071067811865475,
      y: -0.7071067811865475,
    });
    expect(normalize({ x: 0.5, y: 0 })).to.deep.equal({ x: 1, y: 0 });
    expect(normalize({ x: 0, y: 0.5 })).to.deep.equal({ x: 0, y: 1 });
    expect(normalize({ x: 0.5, y: 0.5 })).to.deep.equal({
      x: 0.7071067811865475,
      y: 0.7071067811865475,
    });
    expect(normalize({ x: -0.5, y: 0 })).to.deep.equal({ x: -1, y: 0 });
    expect(normalize({ x: 0, y: -0.5 })).to.deep.equal({ x: 0, y: -1 });
    expect(normalize({ x: -0.5, y: -0.5 })).to.deep.equal({
      x: -0.7071067811865475,
      y: -0.7071067811865475,
    });
  });
});

describe('getAngularDifference', () => {
  it('should work for angles between 0 and 360', () => {
    expect(getAngularDifference(0, 0)).to.equal(0);
    expect(getAngularDifference(0, 1)).to.equal(1);
    expect(getAngularDifference(10, 350)).to.equal(20);
    expect(getAngularDifference(350, 10)).to.equal(20);
    expect(getAngularDifference(350, 350)).to.equal(0);
    expect(getAngularDifference(350, 360)).to.equal(10);
  });

  it('should work for angles outside of 0 and 360', () => {
    expect(getAngularDifference(-10, 10)).to.equal(20);
    expect(getAngularDifference(10, -10)).to.equal(20);
    expect(getAngularDifference(-10, -10)).to.equal(0);
    expect(getAngularDifference(-10, 370)).to.equal(20);
    expect(getAngularDifference(370, -10)).to.equal(20);
    expect(getAngularDifference(370, 10)).to.equal(0);
    expect(getAngularDifference(10, 370)).to.equal(0);
  });

  it('should work for angles which are multiples of 360', () => {
    expect(getAngularDifference(0, 360)).to.equal(0);
    expect(getAngularDifference(360, 0)).to.equal(0);
    expect(getAngularDifference(360, 360)).to.equal(0);
    expect(getAngularDifference(360, 720)).to.equal(0);
    expect(getAngularDifference(720, 360)).to.equal(0);
    expect(getAngularDifference(710, 0)).to.equal(10);
    expect(getAngularDifference(10, 720)).to.equal(10);
  });
});

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

  it('should handle multiple items with a parent at the top correctly', () => {
    const itemAngles = [90, 180, 270];
    const parentAngle = 0;
    const wedges = computeItemWedges(itemAngles, parentAngle);
    expect(wedges).to.deep.equal([
      { start: 45, end: 135 },
      { start: 135, end: 225 },
      { start: 225, end: 315 },
    ]);
  });
});

describe('isAngleBetween', () => {
  it('should return true for angles between start and end', () => {
    expect(isAngleBetween(0.1, 0, 90)).to.be.true;
    expect(isAngleBetween(45, 0, 90)).to.be.true;
    expect(isAngleBetween(90, 0, 90)).to.be.true;
    expect(isAngleBetween(45, 40 + 360, 50 + 360)).to.be.true;
    expect(isAngleBetween(45, 40 - 360, 50 - 360)).to.be.true;
    expect(isAngleBetween(80 + 360, 0, 90)).to.be.true;
    expect(isAngleBetween(80 - 360, 0, 90)).to.be.true;
    expect(isAngleBetween(89.5, 89, 90)).to.be.true;
    expect(isAngleBetween(-30, 0, 360)).to.be.true;
    expect(isAngleBetween(445, 0, 360)).to.be.true;
  });

  it('should return false for angles outside of start and end', () => {
    expect(isAngleBetween(0, 0, 90)).to.be.false;
    expect(isAngleBetween(45, 90, 180)).to.be.false;
    expect(isAngleBetween(45, 90 + 360, 180 + 360)).to.be.false;
    expect(isAngleBetween(45, 90 - 360, 180 - 360)).to.be.false;
    expect(isAngleBetween(45 + 360, 90, 180)).to.be.false;
    expect(isAngleBetween(45 - 360, 90, 180)).to.be.false;
  });
});

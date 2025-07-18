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
  getClosestEquivalentAngle,
  getEquivalentAngleSmallerThan,
  getEquivalentAngleLargerThan,
  fixFixedAngles,
} from '../src/common/math';
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

describe('getClosestEquivalentAngle', () => {
  it('should return the same value if the angle is the same', () => {
    expect(getClosestEquivalentAngle(0, 0)).to.equal(0);
    expect(getClosestEquivalentAngle(500, 500)).to.equal(500);
    expect(getClosestEquivalentAngle(-500, -500)).to.equal(-500);
  });

  it('should return the same value if the difference is less than 180', () => {
    expect(getClosestEquivalentAngle(0, 0)).to.equal(0);
    expect(getClosestEquivalentAngle(1, 0)).to.equal(1);
    expect(getClosestEquivalentAngle(189, 10)).to.equal(189);
    expect(getClosestEquivalentAngle(-189, -10)).to.equal(-189);
  });

  it('should return the equivalent angle if the difference is greater than 180', () => {
    expect(getClosestEquivalentAngle(190, 0)).to.equal(-170);
    expect(getClosestEquivalentAngle(-190, 0)).to.equal(170);
    expect(getClosestEquivalentAngle(500, 0)).to.equal(140);
    expect(getClosestEquivalentAngle(-500, 0)).to.equal(-140);
  });
});

describe('getEquivalentAngleSmallerThan', () => {
  it('should return the same value if the angle is the same', () => {
    expect(getEquivalentAngleSmallerThan(0, 0)).to.equal(0);
    expect(getEquivalentAngleSmallerThan(500, 500)).to.equal(500);
    expect(getEquivalentAngleSmallerThan(-500, -500)).to.equal(-500);
  });

  it('should return the reference if larger by a multiple of 360', () => {
    expect(getEquivalentAngleSmallerThan(410, 50)).to.equal(50);
    expect(getEquivalentAngleSmallerThan(770, 50)).to.equal(50);
    expect(getEquivalentAngleSmallerThan(310, -50)).to.equal(-50);
    expect(getEquivalentAngleSmallerThan(670, -50)).to.equal(-50);
  });

  it('should return the smaller value if greater than reference', () => {
    expect(getEquivalentAngleSmallerThan(300, 50)).to.equal(-60);
    expect(getEquivalentAngleSmallerThan(500, 50)).to.equal(-220);
  });

  it('should return the same value if the difference is less than 360°', () => {
    expect(getEquivalentAngleSmallerThan(30, 50)).to.equal(30);
    expect(getEquivalentAngleSmallerThan(10, 350)).to.equal(10);
    expect(getEquivalentAngleSmallerThan(-310, 40)).to.equal(-310);
  });

  it('should return larger value if the difference is more than 360°', () => {
    expect(getEquivalentAngleSmallerThan(-310, 60)).to.equal(50);
    expect(getEquivalentAngleSmallerThan(-670, 60)).to.equal(50);
  });
});

describe('getEquivalentAngleLargerThan', () => {
  it('should return the same value if the angle is the same', () => {
    expect(getEquivalentAngleLargerThan(0, 0)).to.equal(0);
    expect(getEquivalentAngleLargerThan(500, 500)).to.equal(500);
    expect(getEquivalentAngleLargerThan(-500, -500)).to.equal(-500);
  });

  it('should return the reference if smaller by a multiple of 360', () => {
    expect(getEquivalentAngleLargerThan(-410, -50)).to.equal(-50);
    expect(getEquivalentAngleLargerThan(-770, -50)).to.equal(-50);
    expect(getEquivalentAngleLargerThan(-310, 50)).to.equal(50);
    expect(getEquivalentAngleLargerThan(-670, 50)).to.equal(50);
  });

  it('should return the larger value if less than reference', () => {
    expect(getEquivalentAngleLargerThan(-300, -50)).to.equal(60);
    expect(getEquivalentAngleLargerThan(-500, -50)).to.equal(220);
  });

  it('should return the same value if the difference is less than 360°', () => {
    expect(getEquivalentAngleLargerThan(-30, -50)).to.equal(-30);
    expect(getEquivalentAngleLargerThan(-10, -350)).to.equal(-10);
    expect(getEquivalentAngleLargerThan(310, -40)).to.equal(310);
  });

  it('should return smaller value if the difference is more than 360°', () => {
    expect(getEquivalentAngleLargerThan(310, -60)).to.equal(-50);
    expect(getEquivalentAngleLargerThan(670, -60)).to.equal(-50);
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
    expect(wedges).to.deep.equal({
      itemWedges: [
        { start: -45, end: 45 },
        { start: 45, end: 135 },
        { start: 135, end: 225 },
        { start: 225, end: 315 },
      ],
    });
  });

  it('should return a full circle for a single item with no parent', () => {
    const itemAngles = [123];
    const wedges = computeItemWedges(itemAngles);
    expect(wedges).to.deep.equal({ itemWedges: [{ start: 0, end: 360 }] });
  });

  it('should return an empty array for an empty list of item angles', () => {
    const itemAngles: number[] = [];
    const wedges = computeItemWedges(itemAngles);
    expect(wedges).to.deep.equal({ itemWedges: [] });
  });

  it('should handle a single item with a parent correctly', () => {
    let itemAngles = [0];
    let parentAngle = 180;
    let wedges = computeItemWedges(itemAngles, parentAngle);
    expect(wedges).to.deep.equal({
      itemWedges: [{ start: -90, end: 90 }],
      parentWedge: { start: 90, end: 270 },
    });

    itemAngles = [125];
    parentAngle = 305;
    wedges = computeItemWedges(itemAngles, parentAngle);
    expect(wedges).to.deep.equal({
      itemWedges: [{ start: 35, end: 215 }],
      parentWedge: { start: 215, end: 35 + 360 },
    });

    itemAngles = [180];
    parentAngle = 200;
    wedges = computeItemWedges(itemAngles, parentAngle);
    expect(wedges).to.deep.equal({
      itemWedges: [{ start: 10, end: 190 }],
      parentWedge: { start: 190, end: 10 + 360 },
    });
  });

  it('should handle multiple items with a parent correctly', () => {
    const itemAngles = [0, 90, 270];
    const parentAngle = 180;
    const wedges = computeItemWedges(itemAngles, parentAngle);
    expect(wedges).to.deep.equal({
      itemWedges: [
        { start: -45, end: 45 },
        { start: 45, end: 135 },
        { start: 225, end: 315 },
      ],
      parentWedge: { start: 135, end: 225 },
    });
  });

  it('should handle multiple items with a parent at the top correctly', () => {
    const itemAngles = [90, 180, 270];
    const parentAngle = 0;
    const wedges = computeItemWedges(itemAngles, parentAngle);
    expect(wedges).to.deep.equal({
      itemWedges: [
        { start: 45, end: 135 },
        { start: 135, end: 225 },
        { start: 225, end: 315 },
      ],
      parentWedge: { start: -45, end: 45 },
    });
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

describe('fixFixedAngles', () => {
  const test = (items: { angle?: number }[], fixedItems: { angle?: number }[]) => {
    fixFixedAngles(items);
    expect(items).to.deep.equal(fixedItems);
  };

  it('should not change items without fixed angles', () => {
    test([{}, {}, {}], [{}, {}, {}]);
  });

  it('should return the same angles if they are all valid', () => {
    test(
      [{}, {}, { angle: 90 }, {}, { angle: 270 }],
      [{}, {}, { angle: 90 }, {}, { angle: 270 }]
    );
  });

  it('should remove items with the same angle', () => {
    test(
      [{ angle: 90 }, { angle: 90 }, { angle: 270 }],
      [{ angle: 90 }, {}, { angle: 270 }]
    );
    test([{ angle: 90 }, { angle: 90 }, { angle: 90 }], [{ angle: 90 }, {}, {}]);
  });

  it('should ensure that the first angle is between 0° and 360°', () => {
    test([{ angle: -90 }, {}, { angle: 90 }], [{ angle: 270 }, {}, { angle: 450 }]);
    test([{ angle: 450 }, {}, { angle: 270 }], [{ angle: 90 }, {}, { angle: 270 }]);
    test([{ angle: -450 }, {}, { angle: 90 }], [{ angle: 270 }, {}, { angle: 450 }]);
  });

  it('should ensure that all angles are monotonically increasing', () => {
    test(
      [{ angle: 270 }, { angle: 90 }, { angle: 95 }],
      [{ angle: 270 }, { angle: 450 }, { angle: 455 }]
    );
  });

  it('should remove angles larger than the first angle plus 360°', () => {
    test(
      [{ angle: 90 }, { angle: 380 }, { angle: 500 }],
      [{ angle: 90 }, { angle: 380 }, {}]
    );
    test(
      [{ angle: 0 }, { angle: 350 }, { angle: 30 }, { angle: 40 }],
      [{ angle: 0 }, { angle: 350 }, {}, {}]
    );
  });
});

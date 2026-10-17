//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Arslan-TR <https://github.com/Arslan-TR>
// SPDX-License-Identifier: MIT

import { expect } from 'chai';

import { ScrollAccumulator } from '../src/menu-renderer/input-methods/scroll-accumulator';

describe('ScrollAccumulator', () => {
  it('should report one step per mouse wheel notch', () => {
    const scroll = new ScrollAccumulator();
    expect(scroll.onWheel(-100)).to.equal(-1);
    expect(scroll.onWheel(-100)).to.equal(-1);
    expect(scroll.onWheel(100)).to.equal(1);
    expect(scroll.onWheel(120)).to.equal(1);
  });

  it('should accumulate small touchpad deltas', () => {
    const scroll = new ScrollAccumulator(40);
    expect(scroll.onWheel(15)).to.equal(0);
    expect(scroll.onWheel(15)).to.equal(0);
    expect(scroll.onWheel(15)).to.equal(1);
    expect(scroll.onWheel(15)).to.equal(0);
  });

  it('should drop the accumulated distance when the direction changes', () => {
    const scroll = new ScrollAccumulator(40);
    expect(scroll.onWheel(30)).to.equal(0);
    expect(scroll.onWheel(-30)).to.equal(0);
    expect(scroll.onWheel(-30)).to.equal(-1);
  });

  it('should report at most one step per event', () => {
    const scroll = new ScrollAccumulator(40);
    expect(scroll.onWheel(1000)).to.equal(1);
    expect(scroll.onWheel(10)).to.equal(0);
  });

  it('should convert line and page deltas to pixels', () => {
    const scroll = new ScrollAccumulator(40);
    expect(scroll.onWheel(-1, 1)).to.equal(-1);
    expect(scroll.onWheel(1, 2)).to.equal(1);
  });

  it('should ignore empty and invalid deltas', () => {
    const scroll = new ScrollAccumulator(40);
    expect(scroll.onWheel(0)).to.equal(0);
    expect(scroll.onWheel(NaN)).to.equal(0);
    expect(scroll.onWheel(Infinity)).to.equal(0);
  });

  it('should discard the accumulated distance on reset', () => {
    const scroll = new ScrollAccumulator(40);
    expect(scroll.onWheel(30)).to.equal(0);
    scroll.reset();
    expect(scroll.onWheel(30)).to.equal(0);
  });
});

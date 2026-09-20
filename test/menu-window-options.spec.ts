//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: rome-xi <2685138823@qq.com>
// SPDX-License-Identifier: MIT

import { expect } from 'chai';

import { buildMenuWindowOptions } from '../src/main/menu-window-options';

describe('buildMenuWindowOptions', () => {
  const workArea = { x: 0, y: 25, width: 1920, height: 1055 };
  const options = buildMenuWindowOptions(workArea, 'normal', '/preload.js');

  it('covers the work area with a frameless transparent window', () => {
    expect(options.transparent).to.equal(true);
    expect(options.frame).to.equal(false);
    expect(options.hasShadow).to.equal(false);
    expect(options.skipTaskbar).to.equal(true);
    expect(options.show).to.equal(false);
    expect(options.x).to.equal(workArea.x);
    expect(options.y).to.equal(workArea.y);
    expect(options.width).to.equal(workArea.width + 1);
    expect(options.height).to.equal(workArea.height + 1);
    expect(options.type).to.equal('normal');
  });

  it('disables resizing and moving so macOS does not show a resize cursor at screen edges', () => {
    expect(options.resizable).to.equal(false);
    expect(options.movable).to.equal(false);
  });
});

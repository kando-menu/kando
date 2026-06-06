//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: 2026 cocojojo5213 <https://github.com/cocojojo5213>
// SPDX-License-Identifier: MIT

import { expect } from 'chai';

import { getPointerReturnOffset, scalePointerOffset } from '../src/main/pointer-motion';

describe('pointer motion', () => {
  it('should compute the offset back to the menu opening position', () => {
    const offset = getPointerReturnOffset({ x: 800, y: 450 }, { x: 960, y: 540 });

    expect(offset).to.deep.equal({ x: -160, y: -90 });
  });

  it('should scale pointer movement for backend coordinates', () => {
    const offset = scalePointerOffset({ x: -10.5, y: 20.25 }, 2);

    expect(offset).to.deep.equal({ x: -21, y: 40 });
  });
});

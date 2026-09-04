//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |__| | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect } from 'chai';

import { unmapKey } from '../src/common/key-codes';
import {
  createNativeShortcutBinding,
  getWindowsMetaShortcutKeyCodes,
  NATIVE_MODIFIER_CONTROL,
  NATIVE_MODIFIER_META,
} from '../src/main/backends/native-shortcut';

describe('createNativeShortcutBinding', () => {
  it('should convert a macOS system shortcut', () => {
    expect(createNativeShortcutBinding('CommandRight+Tab', 'macos')).to.deep.equal({
      shortcut: 'CommandRight+Tab',
      keyCode: 0x30,
      modifierMask: NATIVE_MODIFIER_META,
      sideModifiers: [0x36],
    });
  });

  it('should map CommandOrControl for each platform', () => {
    expect(
      createNativeShortcutBinding('CommandOrControl+Space', 'macos')?.modifierMask
    ).to.equal(NATIVE_MODIFIER_META);
    expect(
      createNativeShortcutBinding('CommandOrControl+Space', 'windows')?.modifierMask
    ).to.equal(NATIVE_MODIFIER_CONTROL);
  });

  it('should convert a side-aware Windows system shortcut', () => {
    expect(createNativeShortcutBinding('MetaRight+Space', 'windows')).to.deep.equal({
      shortcut: 'MetaRight+Space',
      keyCode: 0x39,
      modifierMask: NATIVE_MODIFIER_META,
      sideModifiers: [0xe05c],
    });
  });

  it('should reject modifier-only and unknown shortcuts', () => {
    expect(createNativeShortcutBinding('Command', 'macos')).to.equal(undefined);
    expect(createNativeShortcutBinding('Command+Hyper', 'macos')).to.equal(undefined);
    expect(createNativeShortcutBinding('Command+Hyper+Tab', 'macos')).to.equal(undefined);
  });

  it('should return Windows-key scan codes claimed by standalone shortcuts', () => {
    expect(getWindowsMetaShortcutKeyCodes(['Meta', 'CommandRight+CommandRight'])).to.eql([
      0xe05b, 0xe05c,
    ]);
    expect(getWindowsMetaShortcutKeyCodes(['ControlLeft'])).to.eql([]);
  });
});

describe('unmapKey', () => {
  it('should convert native scan codes back to DOM codes', () => {
    expect(unmapKey(0x30, 'macos')).to.equal('Tab');
    expect(unmapKey(0xe05b, 'windows')).to.equal('MetaLeft');
    expect(unmapKey(-1, 'macos')).to.equal(undefined);
  });
});

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect } from 'chai';

import {
  cycleModifierSide,
  formatShortcutForDisplay,
  getSideSpecificModifiers,
  isModifierOnlyShortcut,
  splitModifierSide,
  stripShortcutModifierSides,
} from '../src/common';

describe('formatShortcutForDisplay', () => {
  it('should use native symbols for macOS modifiers', () => {
    expect(formatShortcutForDisplay('Control+Option+Command+Shift+A', true)).to.equal(
      '⌃⌥⌘⇧A'
    );
  });

  it('should normalize accelerator modifier aliases for display', () => {
    expect(formatShortcutForDisplay('Ctrl+Alt+Meta+Space', true)).to.equal('⌃⌥⌘Space');
    expect(formatShortcutForDisplay('CmdOrCtrl+P', true)).to.equal('⌘P');
  });

  it('should show left and right modifier qualifiers', () => {
    expect(formatShortcutForDisplay('ShiftLeft+Option+CommandRight+A', true)).to.equal(
      'L⇧⌥R⌘A'
    );
  });

  it('should leave shortcuts unchanged on other platforms', () => {
    expect(formatShortcutForDisplay('Control+Alt+A', false)).to.equal('Control+Alt+A');
  });
});

describe('modifier sides', () => {
  it('should split modifier side suffixes', () => {
    expect(splitModifierSide('Shift')).to.deep.equal({ base: 'Shift', side: 'any' });
    expect(splitModifierSide('ShiftLeft')).to.deep.equal({
      base: 'Shift',
      side: 'left',
    });
    expect(splitModifierSide('ShiftRight')).to.deep.equal({
      base: 'Shift',
      side: 'right',
    });
  });

  it('should cycle from any to left to right', () => {
    expect(cycleModifierSide('Shift')).to.equal('ShiftLeft');
    expect(cycleModifierSide('ShiftLeft')).to.equal('ShiftRight');
    expect(cycleModifierSide('ShiftRight')).to.equal('Shift');
  });

  it('should create a side-agnostic accelerator', () => {
    const shortcut = 'ShiftLeft+Option+CommandRight+A';
    expect(stripShortcutModifierSides(shortcut)).to.equal('Shift+Option+Command+A');
    expect(getSideSpecificModifiers(shortcut)).to.deep.equal([
      'ShiftLeft',
      'CommandRight',
    ]);
  });

  it('should detect standalone modifier shortcuts', () => {
    expect(isModifierOnlyShortcut('Shift')).to.equal(true);
    expect(isModifierOnlyShortcut('CommandRight')).to.equal(true);
    expect(isModifierOnlyShortcut('Shift+A')).to.equal(false);
    expect(isModifierOnlyShortcut('A')).to.equal(false);
    expect(isModifierOnlyShortcut('')).to.equal(false);
  });
});

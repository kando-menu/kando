//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect } from 'chai';

import { formatShortcutForDisplay } from '../src/common';

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

  it('should leave shortcuts unchanged on other platforms', () => {
    expect(formatShortcutForDisplay('Control+Alt+A', false)).to.equal('Control+Alt+A');
  });
});

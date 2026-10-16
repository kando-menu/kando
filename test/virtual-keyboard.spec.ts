// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect } from 'chai';
import {
  COMMON_KEY_ROWS,
  FUNCTION_KEYS,
  NAVIGATION_KEYS,
  NUMPAD_KEYS,
  toggleVirtualKey,
} from '../src/common/virtual-keyboard';
import { isKnownKeyCode } from '../src/common/key-codes';

describe('virtual keyboard', () => {
  it('keeps physical codes distinct from names and numpad keys distinct from digits', () => {
    const keys = [...COMMON_KEY_ROWS.flat(), ...NUMPAD_KEYS];
    expect(keys.find((key) => key.code === 'KeyV')?.name).to.equal('V');
    expect(keys.find((key) => key.code === 'Digit1')?.name).to.equal('1');
    expect(keys.find((key) => key.code === 'Numpad1')?.name).to.equal('num1');
    for (const key of [...keys, ...FUNCTION_KEYS, ...NAVIGATION_KEYS]) {
      expect(isKnownKeyCode(key.code), key.code).to.equal(true);
    }
  });

  it('toggles ordinary keys and replaces them without losing modifier sides', () => {
    expect(toggleVirtualKey('CommandRight+V', 'A', true)).to.equal('CommandRight+A');
    expect(toggleVirtualKey('CommandRight+V', 'V', true)).to.equal('CommandRight');
    expect(toggleVirtualKey('', 'KeyV', true)).to.equal('KeyV');
    expect(toggleVirtualKey('MetaRight+KeyV', 'KeyA', true)).to.equal('MetaRight+KeyA');
  });

  it('toggles modifier families and keeps modifiers before the ordinary key', () => {
    expect(toggleVirtualKey('V', 'Command', true)).to.equal('Command+V');
    expect(toggleVirtualKey('CommandRight+V', 'Command', true)).to.equal('V');
    expect(toggleVirtualKey('CommandRight+CommandRight', 'Command', true)).to.equal('');
    expect(toggleVirtualKey('Fn', 'Fn', true)).to.equal('');
  });

  it('converts a double modifier to a combination when an ordinary key is selected', () => {
    expect(toggleVirtualKey('CommandRight+CommandRight', 'V', true)).to.equal(
      'CommandRight+V'
    );
  });

  it('does not create combinations when modifiers are disabled', () => {
    expect(toggleVirtualKey('CommandRight+CommandRight', 'V', false)).to.equal('V');
    expect(toggleVirtualKey('V', 'Command', false)).to.equal('Command');
    expect(toggleVirtualKey('Command', 'Shift', false)).to.equal('Shift');
    expect(toggleVirtualKey('V', 'V', false)).to.equal('');
  });
});

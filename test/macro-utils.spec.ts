//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: emirmrkaljevic <93012621+emirmrkaljevic@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { expect } from 'chai';

import {
  convertMacroToString,
  getMacroEventIndexAt,
  insertMacroEvent,
} from '../src/settings-renderer/utils/macro-utils';

const KEY_A_DOWN = { type: 'keyDown' as const, key: 'KeyA', delay: 10 };
const KEY_A_UP = { type: 'keyUp' as const, key: 'KeyA', delay: 10 };
const KEY_B_DOWN = { type: 'keyDown' as const, key: 'KeyB', delay: 10 };

describe('macro-utils', () => {
  const text = convertMacroToString([KEY_A_DOWN, KEY_A_UP]);

  describe('getMacroEventIndexAt', () => {
    it('returns 0 for an empty macro', () => {
      expect(getMacroEventIndexAt('', 0)).to.equal(0);
    });

    it('returns 0 at the start of the macro', () => {
      expect(getMacroEventIndexAt(text, 0)).to.equal(0);
    });

    it('returns the number of events at the end of the macro', () => {
      expect(getMacroEventIndexAt(text, text.length)).to.equal(2);
    });

    it('returns the index of the next event between two events', () => {
      const position = text.indexOf('\n') + 1;
      expect(getMacroEventIndexAt(text, position)).to.equal(1);
    });

    it('returns the index of the event the position is inside of', () => {
      const position = text.lastIndexOf('keyUp');
      expect(getMacroEventIndexAt(text, position)).to.equal(1);
    });
  });

  describe('insertMacroEvent', () => {
    it('inserts into an empty macro', () => {
      expect(insertMacroEvent('', 0, KEY_B_DOWN)).to.equal(
        convertMacroToString([KEY_B_DOWN])
      );
    });

    it('appends an event at the end', () => {
      expect(insertMacroEvent(text, 2, KEY_B_DOWN)).to.equal(
        convertMacroToString([KEY_A_DOWN, KEY_A_UP, KEY_B_DOWN])
      );
    });

    it('inserts an event between existing events', () => {
      expect(insertMacroEvent(text, 1, KEY_B_DOWN)).to.equal(
        convertMacroToString([KEY_A_DOWN, KEY_B_DOWN, KEY_A_UP])
      );
    });

    it('inserts an event at the start', () => {
      expect(insertMacroEvent(text, 0, KEY_B_DOWN)).to.equal(
        convertMacroToString([KEY_B_DOWN, KEY_A_DOWN, KEY_A_UP])
      );
    });
  });
});

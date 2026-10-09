//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: hippi345 <13539685+hippi345@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import json5 from 'json5';
import { expect } from 'chai';
import { safeParseThemeFile } from '../src/main/utils/safe-theme-parse';

// Valid JSON5 that represents a minimal theme descriptor.
const VALID_THEME_CONTENT = `{
  name: 'My Theme',
  colors: {
    // missing comma is fine in JSON5 comments, but this is valid
    primary: '#ff0000',
    secondary: '#00ff00',
  },
}`;

// Invalid JSON5 – a missing comma between two keys (the exact bug from issue #1141).
const INVALID_THEME_CONTENT = `{
  name: 'Broken Theme',
  colors: {
    primary: '#ff0000'
    secondary: '#00ff00',
  },
}`;

describe('safeParseThemeFile', () => {
  it('parses valid JSON5 and returns the object', () => {
    const result = safeParseThemeFile('/fake/path/theme.json5', VALID_THEME_CONTENT);
    expect(result).to.not.equal(null);
    expect((result as { name: string }).name).to.equal('My Theme');
  });

  it('returns null for invalid JSON5 instead of throwing', () => {
    // Verify the fix: without safeParseThemeFile, json5.parse would throw.
    expect(() => json5.parse(INVALID_THEME_CONTENT)).to.throw();

    // With safeParseThemeFile the same content must NOT throw and must return null.
    const result = safeParseThemeFile('/fake/path/theme.json5', INVALID_THEME_CONTENT);
    expect(result).to.equal(null);
  });

  it('includes the file path in the console error for broken files', () => {
    const logged: string[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => {
      logged.push(args.map(String).join(' '));
    };

    try {
      safeParseThemeFile('/specific/path/theme.json5', INVALID_THEME_CONTENT);
    } finally {
      console.error = original;
    }

    expect(logged.some((msg) => msg.includes('/specific/path/theme.json5'))).to.be.true;
  });

  it('does not reject a Promise.all when one theme file is invalid', async () => {
    // Simulate the Promise.all pattern used in app.ts.
    // Before the fix, the raw json5.parse call would throw and reject the whole array.
    // After the fix, safeParseThemeFile returns null and Promise.all resolves normally.
    const themeContents = [
      VALID_THEME_CONTENT,
      INVALID_THEME_CONTENT,
      VALID_THEME_CONTENT,
    ];

    const results = await Promise.all(
      themeContents.map((content, i) =>
        Promise.resolve(safeParseThemeFile(`/fake/theme-${i}/theme.json5`, content))
      )
    );

    // Two valid, one null – array resolves without rejection.
    expect(results).to.have.length(3);
    expect(results[0]).to.not.equal(null);
    expect(results[1]).to.equal(null);
    expect(results[2]).to.not.equal(null);

    // After filtering out nulls (as app.ts does), only valid themes remain.
    const valid = results.filter((r) => r !== null);
    expect(valid).to.have.length(2);
  });
});

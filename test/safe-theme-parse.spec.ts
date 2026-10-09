//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: hippi345 <13539685+hippi345@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { expect } from 'chai';

import {
  parseMenuThemeFile,
  parseSoundThemeFile,
} from '../src/main/utils/safe-theme-parse';

// Minimal valid menu theme (matches the structure expected by app.ts).
const VALID_MENU_THEME = `{
  name: 'Test Theme',
  author: 'Test Author',
  license: 'MIT',
  themeVersion: '1.0',
  engineVersion: 1,
  colors: { primary: '#ff0000' },
  layers: [{ class: 'icon-layer', content: 'icon' }],
}`;

// Invalid JSON5 – a missing comma between two color values (exact scenario from #1141).
const BROKEN_MENU_THEME = `{
  name: 'Broken Theme',
  colors: {
    primary: '#ff0000'
    secondary: '#00ff00',
  },
}`;

// Minimal valid sound theme.
const VALID_SOUND_THEME = `{
  name: 'Test Sounds',
  author: 'Test Author',
  themeVersion: '1.0.0',
  license: 'MIT',
  engineVersion: 2,
  sounds: {},
}`;

// Invalid JSON5 sound theme.
const BROKEN_SOUND_THEME = `{
  name: 'Broken Sounds'
  engineVersion: 2,
}`;

/** Write content to <base>/<themeId>/theme.json5 and return the full path. */
function writeThemeFile(base: string, themeId: string, content: string): string {
  const dir = path.join(base, themeId);
  fs.mkdirpSync(dir);
  const file = path.join(dir, 'theme.json5');
  fs.writeFileSync(file, content, 'utf8');
  return file;
}

describe('parseMenuThemeFile', () => {
  let tmpDir: string;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kando-theme-test-'));
  });

  after(() => {
    fs.removeSync(tmpDir);
  });

  it('parses a valid theme.json5 and returns a populated description', async () => {
    const file = writeThemeFile(tmpDir, 'valid-theme', VALID_MENU_THEME);
    const desc = await parseMenuThemeFile(file);

    expect(desc.loadFailed).to.not.be.true;
    expect(desc.id).to.equal('valid-theme');
    expect(desc.name).to.equal('Test Theme');
    expect(desc.author).to.equal('Test Author');
  });

  it('returns a loadFailed stub for a broken theme.json5, not a rejection', async () => {
    const file = writeThemeFile(tmpDir, 'broken-theme', BROKEN_MENU_THEME);
    // Must resolve (not reject) even though the file is invalid JSON5.
    const desc = await parseMenuThemeFile(file);

    expect(desc.loadFailed).to.be.true;
    expect(desc.id).to.equal('broken-theme');
  });

  it('does not reject Promise.all when one of several themes is broken', async () => {
    const validFile = writeThemeFile(tmpDir, 'valid-a', VALID_MENU_THEME);
    const brokenFile = writeThemeFile(tmpDir, 'broken-a', BROKEN_MENU_THEME);
    const valid2File = writeThemeFile(tmpDir, 'valid-b', VALID_MENU_THEME);

    // This is the exact pattern used in app.ts's get-all-menu-themes handler.
    const results = await Promise.all([
      parseMenuThemeFile(validFile),
      parseMenuThemeFile(brokenFile),
      parseMenuThemeFile(valid2File),
    ]);

    expect(results).to.have.length(3);
    expect(results[0].loadFailed).to.not.be.true;
    expect(results[1].loadFailed).to.be.true;
    expect(results[2].loadFailed).to.not.be.true;

    // After filtering (as app.ts does), only valid themes remain.
    const valid = results.filter((d) => !d.loadFailed);
    expect(valid).to.have.length(2);
  });

  it('returns a loadFailed stub when the theme file cannot be read', async () => {
    const desc = await parseMenuThemeFile(
      path.join(tmpDir, 'no-such-dir', 'theme.json5')
    );
    expect(desc.loadFailed).to.be.true;
  });
});

describe('parseSoundThemeFile', () => {
  let tmpDir: string;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kando-sound-test-'));
  });

  after(() => {
    fs.removeSync(tmpDir);
  });

  it('parses a valid sound theme.json5 and returns a populated description', async () => {
    const file = writeThemeFile(tmpDir, 'valid-sound', VALID_SOUND_THEME);
    const desc = await parseSoundThemeFile(file);

    expect(desc.loadFailed).to.not.be.true;
    expect(desc.id).to.equal('valid-sound');
    expect(desc.name).to.equal('Test Sounds');
  });

  it('returns a loadFailed stub for a broken sound theme.json5, not a rejection', async () => {
    const file = writeThemeFile(tmpDir, 'broken-sound', BROKEN_SOUND_THEME);
    const desc = await parseSoundThemeFile(file);

    expect(desc.loadFailed).to.be.true;
    expect(desc.id).to.equal('broken-sound');
  });

  it('does not reject Promise.all when one sound theme is broken', async () => {
    const validFile = writeThemeFile(tmpDir, 'valid-s-a', VALID_SOUND_THEME);
    const brokenFile = writeThemeFile(tmpDir, 'broken-s-a', BROKEN_SOUND_THEME);

    const results = await Promise.all([
      parseSoundThemeFile(validFile),
      parseSoundThemeFile(brokenFile),
    ]);

    expect(results[0].loadFailed).to.not.be.true;
    expect(results[1].loadFailed).to.be.true;
  });
});

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Morax <james20081204@gmail.com>
// SPDX-License-Identifier: MIT

import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { expect } from 'chai';

import {
  SettingsWindowStateStore,
  fitWindowBoundsToWorkArea,
} from '../src/main/settings/settings-window-state';

describe('SettingsWindowStateStore', () => {
  let directory: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kando-window-state-'));
  });

  afterEach(() => {
    fs.removeSync(directory);
  });

  it('returns defaults when the state file does not exist', () => {
    const store = new SettingsWindowStateStore(directory);

    expect(store.load()).to.deep.equal({ maximized: false });
  });

  it('persists and reloads window state', () => {
    const store = new SettingsWindowStateStore(directory);
    const state = {
      bounds: { x: -1200, y: 80, width: 1100, height: 760 },
      maximized: true,
    };

    store.save(state);

    expect(fs.readJSONSync(store.filePath)).to.deep.equal(state);
    expect(new SettingsWindowStateStore(directory).load()).to.deep.equal(state);
  });

  it('returns defaults when the state file is invalid', () => {
    const store = new SettingsWindowStateStore(directory);
    fs.writeJSONSync(store.filePath, {
      bounds: { x: 0, y: 0, width: -1, height: 700 },
      maximized: 'yes',
    });

    const originalConsoleError = console.error;
    console.error = () => {};

    try {
      expect(store.load()).to.deep.equal({ maximized: false });
    } finally {
      console.error = originalConsoleError;
    }
  });
});

describe('fitWindowBoundsToWorkArea', () => {
  it('keeps bounds that already fit within the work area', () => {
    const bounds = { x: -1800, y: 100, width: 1100, height: 760 };
    const workArea = { x: -1920, y: 0, width: 1920, height: 1080 };

    expect(fitWindowBoundsToWorkArea(bounds, workArea)).to.deep.equal(bounds);
  });

  it('moves off-screen bounds into the work area', () => {
    const bounds = { x: 2500, y: -500, width: 1200, height: 800 };
    const workArea = { x: 0, y: 0, width: 1920, height: 1080 };

    expect(fitWindowBoundsToWorkArea(bounds, workArea)).to.deep.equal({
      x: 720,
      y: 0,
      width: 1200,
      height: 800,
    });
  });

  it('shrinks oversized bounds to the work area', () => {
    const bounds = { x: -2500, y: -200, width: 2400, height: 1200 };
    const workArea = { x: -1920, y: 0, width: 1920, height: 1040 };

    expect(fitWindowBoundsToWorkArea(bounds, workArea)).to.deep.equal(workArea);
  });
});

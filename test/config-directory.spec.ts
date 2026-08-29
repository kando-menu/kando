//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Jonathan Hurst <jpch2k4@gmail.com>
// SPDX-License-Identifier: MIT

import mock from 'mock-fs';
import path from 'node:path';
import { expect } from 'chai';
import {
  assignCustomConfigDirectory,
  resetConfigDirectoryForTesting,
} from '../src/main/settings';
import { getConfigDirectory } from '../src/main/settings';
import fs from 'node:fs';
import { after, beforeEach } from 'mocha';

describe('config directory creation', () => {
  before(() => {
    mock({
      configDirectoryTests: {},
    });

    const portableModeFilePath = path.dirname(process.execPath);

    if (!fs.existsSync(portableModeFilePath)) {
      fs.mkdirSync(portableModeFilePath, { recursive: true });
    }
  });

  beforeEach(() => {
    resetConfigDirectoryForTesting();
  });

  after(() => {
    mock.restore();
  });

  // This tests relative paths starting from executable directory.
  // Such as "--config-dir=configDirectoryTests/relative"
  it('relative path from executable directory should create custom config directory', () => {
    assignCustomConfigDirectory('configDirectoryTests/relative');

    expect(getConfigDirectory()).to.equal(
      path.join(path.dirname(process.execPath), 'configDirectoryTests/relative')
    );
  });

  // This tests absolute paths starting from root.
  // Such as "--config-dir=/home/user/.config/configDirectoryTests/absolute"
  it('absolute path from root should create custom config directory', () => {
    assignCustomConfigDirectory(
      path.join(path.dirname(process.execPath), 'configDirectoryTests/absolute')
    );

    expect(getConfigDirectory()).to.equal(
      path.join(path.dirname(process.execPath), 'configDirectoryTests/absolute')
    );
  });
});

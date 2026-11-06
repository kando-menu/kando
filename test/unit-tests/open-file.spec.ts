//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: ChandraChaan <53801679+ChandraChaan@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { expect } from 'chai';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { OpenFileAction } from '../../src/common';
import { execute } from '../../src/main/actions/open-file';

describe('Open File action', function () {
  let tempDir: string;
  let originalPath: string | undefined;
  let argFile: string;

  beforeEach(function () {
    if (process.platform !== 'linux') {
      this.skip();
    }

    // On Linux, the action runs `xdg-open` through a shell. We put a fake `xdg-open` at
    // the front of the PATH which records the first argument it receives.
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kando-open-file-'));
    argFile = path.join(tempDir, 'received-arg');

    const script = path.join(tempDir, 'xdg-open');
    fs.writeFileSync(script, '#!/bin/sh\nprintf "%s" "$1" > "$KANDO_TEST_ARG_FILE"\n');
    fs.chmodSync(script, 0o755);

    originalPath = process.env.PATH;
    process.env.PATH = `${tempDir}${path.delimiter}${originalPath}`;
    process.env.KANDO_TEST_ARG_FILE = argFile;
  });

  afterEach(function () {
    if (tempDir) {
      process.env.PATH = originalPath;
      delete process.env.KANDO_TEST_ARG_FILE;
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  const paths = [
    '/home/user/Documents/plain.txt',
    '/home/user/My Documents/with spaces.txt',
    '/home/user/$HOME-notes.txt',
    '/home/user/Budget "2026".pdf',
    "/home/user/it's here.txt",
    '/home/user/back`tick`.txt',
    '/home/user/back\\slash.txt',
  ];

  for (const filePath of paths) {
    it(`should pass the path unchanged to xdg-open: ${filePath}`, async function () {
      const action: OpenFileAction = { type: 'open-file', path: filePath };

      await execute(action);

      expect(fs.readFileSync(argFile, 'utf8')).to.equal(filePath);
    });
  }

  it('should not run commands embedded in the path', async function () {
    const marker = path.join(tempDir, 'marker');
    const action: OpenFileAction = {
      type: 'open-file',
      path: `/home/user/$(touch ${marker}).txt`,
    };

    await execute(action);

    expect(fs.existsSync(marker)).to.equal(false);
    expect(fs.readFileSync(argFile, 'utf8')).to.equal(action.path);
  });
});

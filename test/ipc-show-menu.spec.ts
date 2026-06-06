//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect } from 'chai';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import * as IPCTypes from '../src/common/ipc/types';
import { MenuInteractionType, RootMenuItem } from '../src/common';
import { IPCServer } from '../src/common/ipc/ipc-server';
import { IPCShowMenuClient } from '../src/common/ipc/ipc-show-menu-client';

describe('IPC Show-Menu Protocol', function () {
  const tmpDir = path.join(os.tmpdir(), 'kando_ipc_test');
  const infoPath = path.join(tmpDir, 'ipc-info.json');
  let server: IPCServer;

  beforeEach(async function () {
    fs.removeSync(tmpDir);
    fs.ensureDirSync(tmpDir);
    server = new IPCServer(tmpDir);
    await server.init();
  });

  afterEach(function () {
    server.close();
    fs.removeSync(tmpDir);
  });

  it('should create ipc-info.json on server init', function () {
    expect(fs.existsSync(infoPath)).to.be.true;

    const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
    expect(info).to.have.property('port');
    expect(info).to.have.property('apiVersion', 2);
  });

  it('should fail gracefully if the port is wrong', async function () {
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
    const client = new IPCShowMenuClient(info.port + 1, info.apiVersion); // Use a wrong port

    let errorReceived = false;

    try {
      await client.init();
    } catch (err) {
      errorReceived = true;
      expect(err).to.equal(IPCTypes.IPCErrorReason.eConnectionFailed);
    }

    expect(errorReceived).to.be.true;

    client.close();
  });

  it('should not connect to a wrong api version', async function () {
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
    const client = new IPCShowMenuClient(info.port, 999); // Use an unsupported API version

    let errorReceived = false;

    try {
      await client.init();
    } catch (err) {
      errorReceived = true;
      expect(err).to.equal(IPCTypes.IPCErrorReason.eVersionNotSupported);
    }

    expect(errorReceived).to.be.true;

    client.close();
  });

  it('should allow show-menu', async function () {
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
    const client = new IPCShowMenuClient(info.port, info.apiVersion);
    await client.init();

    // Listen for show-menu event on server.
    let menuReceived = false;
    server.on('show-menu', (menu) => {
      menuReceived = true;
      expect(menu.name).to.equal('TestMenu');
    });

    // "interact" with the menu.
    server.on('start-observing', (observerID, callback) => {
      expect(observerID).to.equal(0); // One-time observer should have ID 0.

      callback(MenuInteractionType.eHoverButton, [0, 1, 2]);
      callback(MenuInteractionType.eSelectButton, [0, 1]);
      callback(MenuInteractionType.eCloseMenu, []);
    });

    // Listen for events on client
    let selectReceived = false;
    let hoverReceived = false;
    let cancelReceived = false;

    client.on('interaction', (type, path) => {
      if (type === MenuInteractionType.eSelectButton) {
        expect(path).to.deep.equal([0, 1]);
        selectReceived = true;
      } else if (type === MenuInteractionType.eHoverButton) {
        expect(path).to.deep.equal([0, 1, 2]);
        hoverReceived = true;
      } else if (type === MenuInteractionType.eCloseMenu) {
        cancelReceived = true;
      }
    });

    // Finally "show" the menu.
    client.showMenu({
      name: 'TestMenu',
      type: 'root',
      icon: 'icon',
      iconTheme: 'iconTheme',
      children: [],
    });

    // Wait for events to propagate
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that all events were received.
    expect(menuReceived).to.be.true;
    expect(selectReceived).to.be.true;
    expect(hoverReceived).to.be.true;
    expect(cancelReceived).to.be.true;

    client.close();
  });

  it('should reject a malformed message', async function () {
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
    const client = new IPCShowMenuClient(info.port, info.apiVersion);
    await client.init();

    // Listen for error events on client.
    let errorReceived = false;
    client.on('error', (err) => {
      expect(err).to.equal(IPCTypes.IPCErrorReason.eMalformedRequest);
      errorReceived = true;
    });

    // Send a malformed message.
    client.showMenu({ invalid: 'data' } as unknown as RootMenuItem);

    // Wait for events to propagate
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that an error was received.
    expect(errorReceived).to.be.true;

    client.close();
  });
});

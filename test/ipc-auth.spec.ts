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
import { IPCServer } from '../src/common/ipc/ipc-server';
import { IPCClient } from '../src/common/ipc/ipc-client';

describe('IPC Protocol', function () {
  const tmpDir = path.join(os.tmpdir(), 'kando_ipc_test');
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
    const infoPath = path.join(tmpDir, 'ipc-info.json');
    expect(fs.existsSync(infoPath)).to.be.true;

    const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
    expect(info).to.have.property('port');
    expect(info).to.have.property('apiVersion', 1);
  });

  it('should authenticate a client and allow show-menu', async function () {
    // Make the server accept the client.
    server.on('auth-request', (clientName, permissions, respond) => {
      respond('accept');
    });

    const client = new IPCClient('TestClient', tmpDir);
    const { token, permissions } = await client.init();

    expect(token).to.be.a('string');
    expect(permissions).to.include(IPCTypes.IPCPermission.eShowMenu);

    // Listen for show-menu event on server.
    let menuReceived = false;
    server.on('show-menu', (menu, callbacks) => {
      menuReceived = true;
      expect(menu.name).to.equal('TestMenu');

      // "interact" with the menu.
      callbacks.onSelection([0, 1]);
      callbacks.onHover([0, 1, 2]);
      callbacks.onClose();
    });

    // Listen for events on client
    let selectReceived = false;
    let hoverReceived = false;
    let closeReceived = false;

    client.on('select', (path) => {
      expect(path).to.deep.equal([0, 1]);
      selectReceived = true;
    });

    client.on('hover', (path) => {
      expect(path).to.deep.equal([0, 1, 2]);
      hoverReceived = true;
    });

    client.on('cancel', () => {
      closeReceived = true;
    });

    // Finally "show" the menu.
    client.showMenu({
      name: 'TestMenu',
      type: 'submenu',
      icon: 'icon',
      iconTheme: 'iconTheme',
    });

    // Wait for events to propagate
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that all events were received.
    expect(menuReceived).to.be.true;
    expect(selectReceived).to.be.true;
    expect(hoverReceived).to.be.true;
    expect(closeReceived).to.be.true;

    client.close();
  });

  it('should be able to decline a client authentication', async function () {
    // Make the server decline the client.
    server.on('auth-request', (clientName, permissions, respond) => {
      respond('decline');
    });

    const client = new IPCClient('DeclinedClient', tmpDir);

    try {
      await client.init();
      expect.fail('Client should not authenticate successfully');
    } catch (reason) {
      expect(reason).to.equal(IPCTypes.IPCAuthDeclineReason.eClientBlocked);
    }

    client.close();
  });

  it('should handle canceled authentication requests', async function () {
    // Make the server cancel the client authentication.
    server.on('auth-request', (clientName, permissions, respond) => {
      respond('cancel');
    });

    const client = new IPCClient('CanceledClient', tmpDir);

    try {
      await client.init();
      expect.fail('Client should not authenticate successfully');
    } catch (reason) {
      expect(reason).to.equal(IPCTypes.IPCAuthDeclineReason.eCanceled);
    }

    client.close();
  });

  it('should decline a second authentication attempt without token', async function () {
    // Make the server accept the client.
    server.on('auth-request', (clientName, permissions, respond) => {
      respond('accept');
    });

    // Create and authenticate the first client.
    const client = new IPCClient('TestClient', tmpDir);
    await client.init();
    client.close();

    // Create the same client a second time. We do not provide the token of the first
    // client, so this should be declined.
    const client2 = new IPCClient('TestClient', tmpDir);

    try {
      await client2.init();
      expect.fail('Second client should not authenticate successfully');
    } catch (reason) {
      expect(reason).to.equal(IPCTypes.IPCAuthDeclineReason.eAlreadyAuthenticated);
    }

    client2.close();
  });

  it('should authenticate a second client with a valid token', async function () {
    // Make the server accept the client.
    server.on('auth-request', (clientName, permissions, respond) => {
      respond('accept');
    });

    // Create and authenticate the first client.
    const client = new IPCClient('TestClient', tmpDir);
    const { token } = await client.init();
    client.close();

    // Create the same client a second time, now providing the token. This should work.
    const client2 = new IPCClient('TestClient', tmpDir, token);
    const authResult = await client2.init();

    expect(authResult.token).to.equal(token);
    client2.close();
  });

  it('should decline a client with an invalid token', async function () {
    // Make the server accept the client.
    server.on('auth-request', (clientName, permissions, respond) => {
      respond('accept');
    });

    // Create and authenticate the first client.
    const client = new IPCClient('TestClient', tmpDir);
    const { token } = await client.init();
    client.close();

    // Create the same client a second time, now providing an invalid token. This should
    // be declined.
    const client2 = new IPCClient('TestClient', tmpDir, token + 'invalid');

    try {
      await client2.init();
      expect.fail('Second client should not authenticate successfully');
    } catch (reason) {
      expect(reason).to.equal(IPCTypes.IPCAuthDeclineReason.eInvalidToken);
    }

    client2.close();
  });
});

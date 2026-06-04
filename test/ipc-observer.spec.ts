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
import { MenuInteractionType } from '../src/common';
import { IPCObserverClient } from '../src/common/ipc/ipc-observer-client';

describe('IPC Observer Protocol', function () {
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

  it('should fail gracefully if the port is wrong', async function () {
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
    const client = new IPCObserverClient(info.port + 1, info.apiVersion); // Use a wrong port

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
    const client = new IPCObserverClient(info.port, 999); // Use an unsupported API version

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

  it('should receive menu interaction events', async function () {
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
    const client = new IPCObserverClient(info.port, info.apiVersion);
    await client.init();

    // Listen for start-observing event on server.
    let requestReceived = false;
    server.on('start-observing', (observerID, callback) => {
      requestReceived = true;
      expect(observerID).to.equal(1);

      // "interact" with the menu.
      callback(MenuInteractionType.eOpenMenu, []);
      callback(MenuInteractionType.eHoverButton, [0, 1, 2]);
      callback(MenuInteractionType.eSelectButton, [0, 1]);
      callback(MenuInteractionType.eCloseMenu, []);
    });

    // Listen for events on client
    let openReceived = false;
    let selectReceived = false;
    let hoverReceived = false;
    let cancelReceived = false;

    client.on('interaction', (type, path) => {
      if (type === MenuInteractionType.eOpenMenu) {
        openReceived = true;
      } else if (type === MenuInteractionType.eSelectButton) {
        expect(path).to.deep.equal([0, 1]);
        selectReceived = true;
      } else if (type === MenuInteractionType.eHoverButton) {
        expect(path).to.deep.equal([0, 1, 2]);
        hoverReceived = true;
      } else if (type === MenuInteractionType.eCloseMenu) {
        cancelReceived = true;
      }
    });

    // Finally start observing, which should trigger the server to send events.
    client.startObserving();

    // Wait for events to propagate
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that all events were received.
    expect(requestReceived).to.be.true;
    expect(openReceived).to.be.true;
    expect(selectReceived).to.be.true;
    expect(hoverReceived).to.be.true;
    expect(cancelReceived).to.be.true;

    client.close();
  });

  it('should handle stop-observing', async function () {
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
    const client = new IPCObserverClient(info.port, info.apiVersion);
    await client.init();

    // Listen for start-observing event on server.
    server.on('start-observing', (observerID, callback) => {
      // "interact" with the menu.
      callback(MenuInteractionType.eOpenMenu, []);
    });

    // Listen for events on client
    let openReceived = false;

    client.on('interaction', (type) => {
      if (type === MenuInteractionType.eOpenMenu) {
        openReceived = true;
      }
    });

    // Start observing, which should trigger the server to send events.
    client.startObserving();

    // Wait for events to propagate
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that the open event was received.
    expect(openReceived).to.be.true;

    // Now stop observing and check that no more events are received.
    client.stopObserving();

    openReceived = false;

    // Wait for events to propagate
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(openReceived).to.be.false;

    client.close();
  });

  it('should support multiple observers', async function () {
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
    const client1 = new IPCObserverClient(info.port, info.apiVersion);
    const client2 = new IPCObserverClient(info.port, info.apiVersion);
    await client1.init();
    await client2.init();

    let observer1Received = false;
    let observer2Received = false;

    let open1Received = false;
    let open2Received = false;

    server.on('start-observing', (observerID, callback) => {
      if (observerID === 1) {
        observer1Received = true;
      } else if (observerID === 2) {
        observer2Received = true;
      }
      callback(MenuInteractionType.eOpenMenu, []);
    });

    client1.on('interaction', (type) => {
      if (type === MenuInteractionType.eOpenMenu) {
        open1Received = true;
      }
    });

    client2.on('interaction', (type) => {
      if (type === MenuInteractionType.eOpenMenu) {
        open2Received = true;
      }
    });

    client1.startObserving();
    client2.startObserving();

    // Wait for events to propagate
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(observer1Received).to.be.true;
    expect(observer2Received).to.be.true;
    expect(open1Received).to.be.true;
    expect(open2Received).to.be.true;

    client1.close();
    client2.close();
  });
});

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: dvd233 <111864431+dvd233@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { expect } from 'chai';
import net from 'net';
import { WebSocketServer } from 'ws';

import { SendWebSocketMessageAction } from '../src/common';
import { WORKFLOW_ACTION_SCHEMA_V2 } from '../src/common/settings-schemata/menu-settings-v2';
import { execute } from '../src/main/actions/send-websocket-message';

function getUnusedPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not determine the test server port.'));
        return;
      }

      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve(address.port);
        }
      });
    });
  });
}

describe('Send WebSocket Message action', function () {
  let server: WebSocketServer;
  let port: number;

  beforeEach(async function () {
    server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));

    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Could not determine the test server port.');
    }
    port = address.port;
  });

  afterEach(async function () {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('should be accepted by the workflow action schema', function () {
    const action: SendWebSocketMessageAction = {
      type: 'send-websocket-message',
      url: 'ws://localhost:4000',
      message: 'preset?p=paintbucketwhite',
    };

    expect(WORKFLOW_ACTION_SCHEMA_V2.parse(action)).to.deep.equal(action);
  });

  it('should send the configured message to the configured server', async function () {
    const message = 'preset?p=paintbucketwhite';
    const received = new Promise<string>((resolve) => {
      server.once('connection', (socket) => {
        socket.once('message', (data) => {
          resolve(data.toString());
          socket.close();
        });
      });
    });

    const action: SendWebSocketMessageAction = {
      type: 'send-websocket-message',
      url: `ws://127.0.0.1:${port}`,
      message,
    };

    await execute(action);

    expect(await received).to.equal(message);
  });

  it('should reject when the server cannot be reached', async function () {
    const unusedPort = await getUnusedPort();
    const action: SendWebSocketMessageAction = {
      type: 'send-websocket-message',
      url: `ws://127.0.0.1:${unusedPort}`,
      message: 'test',
    };

    let error: unknown;
    try {
      await execute(action);
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).to.be.instanceOf(Error);
  });
});

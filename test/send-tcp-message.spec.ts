//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Bharat Kaurav <117659673+TheNetherWatcher@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { expect } from 'chai';
import net from 'net';

import { SendTCPMessageAction } from '../src/common';
import { WORKFLOW_ACTION_SCHEMA_V2 } from '../src/common/settings-schemata/menu-settings-v2';
import { execute } from '../src/main/actions/send-tcp-message';

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

describe('Send TCP Message action', function () {
  let server: net.Server;
  let port: number;
  let received: Promise<string>;

  beforeEach(async function () {
    received = new Promise<string>((resolve) => {
      server = net.createServer((socket) => {
        const chunks: Buffer[] = [];
        socket.on('data', (chunk) => chunks.push(chunk));
        socket.on('end', () => {
          resolve(Buffer.concat(chunks).toString());
          socket.end();
        });
      });
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

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
    const action: SendTCPMessageAction = {
      type: 'send-tcp-message',
      host: 'localhost',
      port: 23,
      message: 'power on',
      appendNewline: true,
    };

    expect(WORKFLOW_ACTION_SCHEMA_V2.parse(action)).to.deep.equal(action);
  });

  it('should default appendNewline to false', function () {
    const parsed = WORKFLOW_ACTION_SCHEMA_V2.parse({
      type: 'send-tcp-message',
      host: 'localhost',
      port: 23,
      message: 'power on',
    });

    expect(parsed).to.have.property('appendNewline', false);
  });

  it('should send the configured message to the configured server', async function () {
    const action: SendTCPMessageAction = {
      type: 'send-tcp-message',
      host: '127.0.0.1',
      port,
      message: 'power on',
      appendNewline: false,
    };

    await execute(action);

    expect(await received).to.equal('power on');
  });

  it('should append a CRLF line break if requested', async function () {
    const action: SendTCPMessageAction = {
      type: 'send-tcp-message',
      host: '127.0.0.1',
      port,
      message: 'power on',
      appendNewline: true,
    };

    await execute(action);

    expect(await received).to.equal('power on\r\n');
  });

  it('should reject when the server cannot be reached', async function () {
    const unusedPort = await getUnusedPort();
    const action: SendTCPMessageAction = {
      type: 'send-tcp-message',
      host: '127.0.0.1',
      port: unusedPort,
      message: 'test',
      appendNewline: false,
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

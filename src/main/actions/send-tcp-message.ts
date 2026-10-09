//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Bharat Kaurav <117659673+TheNetherWatcher@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import net from 'net';

import { SendTCPMessageAction } from '../../common';
import { DeepReadonly } from '../settings';

/** The maximum amount of time to wait for the connection to be established. */
const TCP_CONNECT_TIMEOUT = 5000;

/**
 * Connects to a TCP server, sends a message, and closes the connection.
 *
 * @param action The action for which the TCP message should be sent.
 * @returns A promise which resolves when the message has been written to the socket.
 */
export async function execute(action: DeepReadonly<SendTCPMessageAction>): Promise<void> {
  const payload = action.appendNewline ? action.message + '\r\n' : action.message;

  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const socket = net.createConnection({ host: action.host, port: action.port });
    socket.setTimeout(TCP_CONNECT_TIMEOUT);

    const handleError = (error: Error) => {
      socket.destroy();
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    socket.on('error', handleError);
    socket.on('timeout', () => {
      handleError(new Error(`Connection to ${action.host}:${action.port} timed out.`));
    });

    socket.once('connect', () => {
      // Half-close the connection once the payload has been flushed. If the server does
      // not close its side, the socket timeout above will clean it up eventually.
      socket.end(payload, () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      });
    });
  });
}

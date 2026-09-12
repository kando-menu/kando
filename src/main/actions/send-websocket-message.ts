//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: dvd233 <111864431+dvd233@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import WebSocket from 'ws';

import { SendWebSocketMessageAction } from '../../common';
import { DeepReadonly } from '../settings';

/** The maximum amount of time to wait for a WebSocket handshake. */
const WEBSOCKET_HANDSHAKE_TIMEOUT = 5000;

/**
 * Connects to a WebSocket server, sends a message, and closes the connection.
 *
 * @param action The action for which the WebSocket message should be sent.
 * @returns A promise which resolves when the message has been written to the socket.
 */
export async function execute(
  action: DeepReadonly<SendWebSocketMessageAction>
): Promise<void> {
  const socket = new WebSocket(action.url, {
    handshakeTimeout: WEBSOCKET_HANDSHAKE_TIMEOUT,
  });

  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const handleError = (error: Error) => {
      if (!settled) {
        settled = true;
        socket.close();
        reject(error);
      }
    };

    socket.once('error', handleError);
    socket.once('open', () => {
      if (settled) {
        return;
      }

      socket.send(action.message, (error) => {
        if (error) {
          handleError(error);
          return;
        }

        settled = true;
        socket.close();
        resolve();
      });
    });
  });
}

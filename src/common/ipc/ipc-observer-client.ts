//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';

import * as IPCTypes from './types';
import { TypedEventEmitter, MenuInteractionType } from '..';
import { createCrossWebSocket } from './cross-websocket';

/** These events are emitted by the IPC client when menu interactions occur. */
type IPCObserverClientEvents = {
  interaction: [type: MenuInteractionType, path: number[]];
  error: [error: IPCTypes.IPCErrorReason];
};

/**
 * IPCObserverClient provides a reference implementation for connecting to the Kando IPC
 * server via WebSockets in order to listen for menu interaction. This is useful in
 * scenarios where you want to respond to user actions in the menu, like for example
 * providing haptic feedback. This class is not used by Kando itself but can serve as a
 * template for plugin authors.
 *
 * Usage:
 *
 *     // Port and API version must match the one in ipc-info.json
 *     const client = new IPCObserverClient(12345, 1);
 *     await client.init();
 *     client.startObserving();
 *     client.on('interaction', (type, path) => { ... });
 *     client.stopObserving();
 */
export class IPCObserverClient extends (EventEmitter as new () => TypedEventEmitter<IPCObserverClientEvents>) {
  private ws: ReturnType<typeof createCrossWebSocket> | null = null;

  /**
   * This is the API version of the client. With Kando 3.0.0, the API changed in a
   * backwards-incompatible way, so it has been bumped to version 2.
   */
  private clientApiVersion = 2;

  /**
   * Constructs a new IPCObserverClient instance.
   *
   * @param serverPort The port used by the IPC server.
   * @param serverApiVersion The API version supported by the server, for compatibility
   *   checks.
   */
  constructor(
    private serverPort: number,
    private serverApiVersion: number
  ) {
    super();
  }

  /**
   * Initializes the IPC client by connecting to the WebSocket server. Resolves if the
   * connection is established, or rejects with the decline reason if it fails.
   *
   * @returns A promise resolving when the connection is established.
   */
  public async init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.clientApiVersion !== this.serverApiVersion) {
        reject(IPCTypes.IPCErrorReason.eVersionNotSupported);
        return;
      }

      this.ws = createCrossWebSocket(`ws://127.0.0.1:${this.serverPort}`);
      let connectionEstablished = false;

      this.ws.onopen = () => handleOpen();
      this.ws.onmessage = (event: { data: string }) => handleMessage(event.data);
      this.ws.onerror = () => handleError();

      const handleOpen = (): void => {
        connectionEstablished = true;
        resolve();
      };

      const handleMessage = (data: string): void => {
        const msg = JSON.parse(data);

        if (IPCTypes.MENU_INTERACTION_MESSAGE.safeParse(msg).success) {
          const { interaction, path } = msg as IPCTypes.MenuInteractionMessage;
          this.emit('interaction', interaction, path);
        } else if (IPCTypes.ERROR_MESSAGE.safeParse(msg).success) {
          const errorMsg = msg as IPCTypes.ErrorMessage;
          console.error(`IPC Error (${errorMsg.reason}): ${errorMsg.description}`);
          this.emit('error', errorMsg.reason);
        }
      };

      const handleError = (): void => {
        if (!connectionEstablished) {
          this.ws = null;
          reject(IPCTypes.IPCErrorReason.eConnectionFailed);
        } else {
          this.emit('error', IPCTypes.IPCErrorReason.eMalformedRequest);
        }
      };
    });
  }

  /** Sends a message to the server to start observing menu interactions. */
  public startObserving(): void {
    if (!this.ws) {
      this.emit('error', IPCTypes.IPCErrorReason.eNotConnected);
      return;
    }
    this.ws.send(JSON.stringify({ type: 'start-observing' }));
  }

  /** Sends a message to the server to stop observing menu interactions. */
  public stopObserving(): void {
    if (!this.ws) {
      this.emit('error', IPCTypes.IPCErrorReason.eNotConnected);
      return;
    }
    this.ws.send(JSON.stringify({ type: 'stop-observing' }));
  }

  /**
   * Closes the WebSocket connection, allowing tests and processes to exit cleanly. It is
   * not required to call `stopObserving()` before closing, as this will automatically be
   * handled by the server when the connection is closed.
   */
  public close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

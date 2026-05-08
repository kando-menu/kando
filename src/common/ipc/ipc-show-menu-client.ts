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
import { TypedEventEmitter, InteractionTarget, RootMenuItem } from '..';
import { createCrossWebSocket } from './cross-websocket';

/** These events are emitted by the IPC client when menu interactions occur. */
type IPCShowMenuClientEvents = {
  cancel: [];
  select: [target: InteractionTarget, path: number[]];
  hover: [target: InteractionTarget, path: number[]];
  error: [error: IPCTypes.IPCErrorReason];
};

/**
 * IPCShowMenuClient provides a reference implementation for connecting to the Kando IPC
 * server via WebSockets in order to open custom menus. It handles menu requests and event
 * emission for menu interactions. This class is used by Kando itself to show menus from
 * the settings renderer process and can serve as a template for plugin authors.
 *
 * Usage:
 *
 *     // Port and API version must match the one in ipc-info.json
 *     const client = new IPCShowMenuClient(12345, 1);
 *     await client.init();
 *     client.showMenu(menuItem);
 *     client.on('hover', (target, path) => { ... });
 *     client.on('select', (target, path) => { ... });
 *     client.on('cancel', () => { ... });
 */
export class IPCShowMenuClient extends (EventEmitter as new () => TypedEventEmitter<IPCShowMenuClientEvents>) {
  private ws: ReturnType<typeof createCrossWebSocket> | null = null;

  /**
   * This is the API version of the client. For now, there is only version 1, but this
   * allows for future compatibility checks if the protocol evolves.
   */
  private clientApiVersion = 1;

  /**
   * Constructs a new IPCShowMenuClient instance.
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

        if (IPCTypes.SELECT_ITEM_MESSAGE.safeParse(msg).success) {
          const { target, path } = msg as IPCTypes.SelectItemMessage;
          this.emit('select', target, path);
        } else if (IPCTypes.CANCEL_MENU_MESSAGE.safeParse(msg).success) {
          this.emit('cancel');
        } else if (IPCTypes.HOVER_ITEM_MESSAGE.safeParse(msg).success) {
          const { target, path } = msg as IPCTypes.HoverItemMessage;
          this.emit('hover', target, path);
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

  /**
   * Sends a show-menu request to the IPC server. The menu structure must conform to the
   * RootMenuItem type. Emits the 'error' event if the request is malformed or if the
   * client is not connected.
   *
   * @param menu The menu structure to show, as a RootMenuItem object.
   */
  public showMenu(menu: RootMenuItem): void {
    if (!this.ws) {
      this.emit('error', IPCTypes.IPCErrorReason.eNotConnected);
      return;
    }
    this.ws.send(JSON.stringify({ type: 'show-menu', menu }));
  }

  /** Closes the WebSocket connection, allowing tests and processes to exit cleanly. */
  public close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';
import WebSocket, { WebSocketServer } from 'ws';
import { AddressInfo } from 'net';
import fs from 'fs';
import path from 'path';
import * as IPCTypes from './types';

import { TypedEventEmitter, InteractionTarget, RootMenuItem } from '..';

/**
 * Callbacks that are provided to the IPC server event handlers to report menu
 * interactions back to the clients. When a client sends a show-menu request, the server
 * emits a 'show-menu' event with these callbacks. We should call these callbacks to
 * notify the client about menu interactions (selection, hover, cancel).
 */
export type IPCCallbacks = {
  onOpen: () => void;
  onCancel: () => void;
  onSelect: (target: InteractionTarget, path: number[]) => void;
  onHover: (target: InteractionTarget, path: number[]) => void;
};

/** These events are emitted by the IPC server when clients send requests. */
type IPCServerEvents = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'show-menu': [menu: RootMenuItem];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'start-observing': [observerID: number, callbacks: IPCCallbacks];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'stop-observing': [observerID: number];
};

/**
 * IPCServer listens for WebSocket connections on localhost and emits events when a
 * show-menu request is received. It allows reporting menu selections back to the client
 * via the WebSocket.
 *
 * This class is an event emitter that emits the following events:
 *
 * - 'show-menu': Emitted when a valid show-menu request is received from a client. The
 *   event handler receives the menu to show and callbacks for selection, hover, and close
 *   events.
 */
export class IPCServer extends (EventEmitter as new () => TypedEventEmitter<IPCServerEvents>) {
  /** The protocol version supported by this server. Clients must match this version. */
  private static readonly cAPIVersion = 1;

  /**
   * The WebSocket server instance. It is initialized in init() and closed in close(). It
   * is undefined when the server is not running.
   */
  private wss: WebSocketServer | undefined;

  /**
   * The port the server is listening on. It is assigned by the OS when the server starts
   * (port 0) and is written to ipc-info.json for clients to discover. It is undefined
   * until the server is initialized.
   */
  private port: number | undefined;

  /**
   * The path to the ipc-info.json file where the server writes its port and API version
   * for clients to discover. It is derived from the infoDir provided in the constructor.
   */
  private infoPath: string;

  /**
   * Whenever a client registers as an observer, it is assigned a unique observer ID. This
   * counter is used to generate those IDs.
   */
  private nextObserverID = 1;

  /**
   * Creates a new IPCServer. Call init() to start listening for connections.
   *
   * @param infoDir The directory where ipc-info.json with the port info will be stored.
   *   Usually, this is Kando's config directory.
   */
  constructor(private infoDir: string) {
    super();

    // Path to the file where the server writes its port for clients to discover.
    this.infoPath = path.join(this.infoDir, 'ipc-info.json');
  }

  /**
   * Initializes the WebSocket server and waits until it is listening.
   *
   * Writes the port to ipc-info.json for clients to discover. The port is chosen by the
   * OS (port 0), ensuring no conflicts. The server only listens on localhost for security
   * reasons.
   *
   * @returns A promise that resolves when the server is ready.
   */
  public async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Start a WebSocket server on localhost, random port.
      this.wss = new WebSocketServer({ host: '127.0.0.1', port: 0 });
      this.wss.on('connection', (ws) => this.handleConnection(ws));
      this.wss.on('listening', () => {
        // Retrieve the assigned port and write it to ipc-info.json.
        const address = this.wss.address() as AddressInfo;
        this.port = address.port;
        console.log(`Listening for show-menu requests on ws://127.0.0.1:${this.port}`);
        try {
          const info: IPCTypes.IPCInfo = {
            port: this.port,
            apiVersion: IPCServer.cAPIVersion,
          };
          fs.writeFileSync(this.infoPath, JSON.stringify(info, null, 2));
        } catch (err) {
          console.error(`IPCServer failed to write ${this.infoPath}:`, err);
        }
        resolve();
      });
      this.wss.on('error', (err) => {
        reject(err);
      });
    });
  }

  /** Closes the WebSocket server, allowing tests and processes to exit cleanly. */
  public close(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = undefined;
    }
  }

  /** Returns the port the server is listening on. */
  public getPort(): number {
    return this.port;
  }

  /** Returns the API version supported by this server. */
  public getApiVersion(): number {
    return IPCServer.cAPIVersion;
  }

  /**
   * Handles a new WebSocket connection and the full IPC protocol for that client.
   *
   * This method is responsible for:
   *
   * - Validating all incoming messages using zod schemas.
   * - Emitting 'show-menu' events for valid show-menu requests, with callbacks for menu
   *   selection, hover, and close events.
   * - Sending appropriate error messages for malformed requests.
   *
   * @param ws The connected WebSocket instance.
   */
  private handleConnection(ws: WebSocket) {
    let observerID = -1; // Will be assigned if the client registers as an observer.

    const stopObserving = () => {
      this.emit('stop-observing', observerID);
      observerID = -1;
    };

    const startObserving = (oneTime: boolean) => {
      if (oneTime) {
        // For one-time observers, we use an observer ID of 0.
        observerID = 0;
      } else {
        observerID = this.nextObserverID++;
      }

      this.emit('start-observing', observerID, {
        onOpen: () => {
          const openMsg: IPCTypes.OpenMenuMessage = { type: 'open-menu' };
          ws.send(JSON.stringify(openMsg));
        },
        onHover: (target: InteractionTarget, path: number[]) => {
          const hoverMsg: IPCTypes.HoverItemMessage = {
            type: 'hover-item',
            target,
            path,
          };
          ws.send(JSON.stringify(hoverMsg));
        },
        onSelect: (target: InteractionTarget, path: number[]) => {
          const selectMsg: IPCTypes.SelectItemMessage = {
            type: 'select-item',
            target,
            path,
          };
          ws.send(JSON.stringify(selectMsg));

          if (oneTime) {
            stopObserving();
          }
        },
        onCancel: () => {
          const cancelMsg: IPCTypes.CancelMenuMessage = { type: 'cancel-menu' };
          ws.send(JSON.stringify(cancelMsg));

          if (oneTime) {
            stopObserving();
          }
        },
      });
    };

    ws.on('message', (data) => {
      let msg: unknown;
      try {
        // Parse the incoming message as JSON.
        msg = JSON.parse(data.toString());
      } catch (e) {
        // If parsing fails, send an error message and return.
        const errorMsg: IPCTypes.ErrorMessage = {
          type: 'error',
          reason: IPCTypes.IPCErrorReason.eMalformedRequest,
          description: e.toString(),
        };
        ws.send(JSON.stringify(errorMsg));
        return;
      }

      // Handle 'show-menu' messages: client requests to show a menu.
      const showMenuParse = IPCTypes.SHOW_MENU_MESSAGE.safeParse(msg);
      if (showMenuParse.success) {
        const showMenuMsg = showMenuParse.data;
        this.emit('show-menu', showMenuMsg.menu);
        startObserving(true); // One-time observer for this menu interaction.
        return;
      }

      // Handle 'start-observing' messages: client wants to observe menu events.
      const startObservingParse = IPCTypes.START_OBSERVING_MESSAGE.safeParse(msg);
      if (startObservingParse.success) {
        // If the client is already an observer, send an error message and return.
        if (observerID !== -1) {
          const errorMsg: IPCTypes.ErrorMessage = {
            type: 'error',
            reason: IPCTypes.IPCErrorReason.eAlreadyObserving,
            description: 'Client is already registered as an observer',
          };
          ws.send(JSON.stringify(errorMsg));
          return;
        }

        // Register the client as an observer until it explicitly stops observing or
        // disconnects.
        startObserving(false);

        return;
      }

      // Handle 'stop-observing' messages: client wants to stop observing menu events.
      const stopObservingParse = IPCTypes.STOP_OBSERVING_MESSAGE.safeParse(msg);
      if (stopObservingParse.success) {
        // If the client is not currently an observer, send an error message and return.
        if (observerID === -1) {
          const errorMsg: IPCTypes.ErrorMessage = {
            type: 'error',
            reason: IPCTypes.IPCErrorReason.eNotObserving,
            description: 'Client is not registered as an observer',
          };
          ws.send(JSON.stringify(errorMsg));
          return;
        }

        stopObserving();

        return;
      }

      // If the message type is not recognized, send an error.
      const errorMsg: IPCTypes.ErrorMessage = {
        type: 'error',
        reason: IPCTypes.IPCErrorReason.eMalformedRequest,
        description: 'Unknown or malformed message',
      };
      ws.send(JSON.stringify(errorMsg));
    });

    // Stop observing if the client disconnects.
    ws.on('close', () => {
      if (observerID !== -1) {
        this.emit('stop-observing', observerID);
      }
    });
  }
}

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
import { IPCAuth } from './ipc-auth';
import * as IPCTypes from './types';

import { TypedEventEmitter, MenuItem } from '..';

/** These events are emitted by the IPC server when clients send requests. */
type IPCServerEvents = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'show-menu': [
    menu: MenuItem,
    callbacks: {
      onSelection: (path: number[]) => void;
      onHover: (path: number[]) => void;
      onClose: () => void;
    },
  ];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'auth-request': [
    clientName: string,
    permissions: IPCTypes.IPCPermission[],
    respond: (decision: 'accept' | 'decline' | 'cancel') => void,
  ];
};

/**
 * IPCServer listens for WebSocket connections on localhost and emits events when a
 * show-menu request is received. It allows reporting menu selections back to the client
 * via the WebSocket.
 *
 * This class is an event emitter that emits the following events:
 *
 * - 'show-menu': Emitted when a valid show-menu request is received from an authenticated
 *   client. The event handler receives the menu to show and callbacks for selection,
 *   hover, and close events.
 */
export class IPCServer extends (EventEmitter as new () => TypedEventEmitter<IPCServerEvents>) {
  /** The protocol version supported by this server. Clients must match this version. */
  private static readonly cAPIVersion = 1;

  private wss: WebSocketServer | undefined;
  private port: number | undefined;
  private auth: IPCAuth;
  private infoPath: string;

  /**
   * Creates a new IPCServer. Call init() to start listening for connections.
   *
   * @param infoDir The directory where ipc-info.json with the port info will be stored
   *   and where the ipc-tokens.json file will be created. Usually, this is Kando's config
   *   directory.
   */
  constructor(private infoDir: string) {
    super();

    // Path to the file where the server writes its port for clients to discover.
    this.infoPath = path.join(this.infoDir, 'ipc-info.json');

    // Handles authentication and token management for IPC clients.
    this.auth = new IPCAuth(this.infoDir);
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

  /** Returns the token for Kando's own IPC client. */
  public getKandoToken() {
    return this.auth.getKandoToken();
  }

  /** Returns the port the server is listening on. */
  public getPort(): number {
    return this.port;
  }

  /**
   * Handles a new WebSocket connection and the full IPC protocol for that client.
   *
   * This method is responsible for:
   *
   * - Authenticating the client using either an auth or auth-request message.
   * - Validating all incoming messages using zod schemas.
   * - Emitting 'show-menu' events for valid show-menu requests, with callbacks for menu
   *   selection, hover, and close events.
   * - Sending appropriate error messages for malformed or unauthorized requests.
   *
   * @param ws The connected WebSocket instance.
   */
  private handleConnection(ws: WebSocket) {
    let authenticated = false;
    let clientName: string | null = null;

    ws.on('message', (data) => {
      let msg: unknown;
      try {
        // Parse the incoming message as JSON.
        msg = JSON.parse(data.toString());
      } catch (e) {
        // If parsing fails, send an error message and return.
        const errorMsg: IPCTypes.ErrorMessage = { type: 'error', error: 'Invalid JSON' };
        ws.send(JSON.stringify(errorMsg));
        return;
      }

      // ----------------------
      // AUTHENTICATION
      // ----------------------
      // Handle 'auth' messages: client provides a token for authentication.
      const authParse = IPCTypes.AUTH_MESSAGE.safeParse(msg);
      if (authParse.success) {
        const authMsg = authParse.data;
        // Check protocol version compatibility.
        if (authMsg.apiVersion !== IPCServer.cAPIVersion) {
          const declined: IPCTypes.AuthDeclinedMessage = {
            type: 'auth-declined',
            reason: IPCTypes.IPCAuthDeclineReason.eVersionNotSupported,
          };
          ws.send(JSON.stringify(declined));
          return;
        }

        // Validate the provided token and client name.
        const authResult = this.auth.isClientAuthenticated(
          authMsg.clientName,
          authMsg.token
        );

        if (!authResult.authenticated) {
          const declined: IPCTypes.AuthDeclinedMessage = {
            type: 'auth-declined',
            reason: authResult.reason,
          };
          ws.send(JSON.stringify(declined));
          return;
        }

        // Authentication successful.
        authenticated = true;
        clientName = authMsg.clientName;
        const accepted: IPCTypes.AuthAcceptedMessage = {
          type: 'auth-accepted',
          token: authMsg.token,
          permissions: this.auth.getPermissions(clientName),
        };
        ws.send(JSON.stringify(accepted));
        return;
      }

      // ----------------------
      // AUTH REQUEST
      // ----------------------
      // Handle 'auth-request' messages: client requests a new token.
      const authReqParse = IPCTypes.AUTH_REQUEST_MESSAGE.safeParse(msg);
      if (authReqParse.success) {
        const authReqMsg = authReqParse.data;
        // Check protocol version compatibility.
        if (authReqMsg.apiVersion !== IPCServer.cAPIVersion) {
          const declined: IPCTypes.AuthDeclinedMessage = {
            type: 'auth-declined',
            reason: IPCTypes.IPCAuthDeclineReason.eVersionNotSupported,
          };
          ws.send(JSON.stringify(declined));
          return;
        }

        // Check if the client is blocked.
        if (this.auth.isClientBlocked(authReqMsg.clientName)) {
          const declined: IPCTypes.AuthDeclinedMessage = {
            type: 'auth-declined',
            reason: IPCTypes.IPCAuthDeclineReason.eClientBlocked,
          };
          ws.send(JSON.stringify(declined));
          return;
        }

        // Check if the client is already authenticated.
        if (this.auth.isKnownClient(authReqMsg.clientName)) {
          const declined: IPCTypes.AuthDeclinedMessage = {
            type: 'auth-declined',
            reason: IPCTypes.IPCAuthDeclineReason.eAlreadyAuthenticated,
          };
          ws.send(JSON.stringify(declined));
          return;
        }

        // Emit 'auth-request' event and wait for user decision
        this.emit(
          'auth-request',
          authReqMsg.clientName,
          authReqMsg.permissions,
          (decision: 'accept' | 'decline' | 'cancel') => {
            if (decision === 'accept') {
              const token = this.auth.acceptAuth(
                authReqMsg.clientName,
                authReqMsg.permissions
              );
              authenticated = true;
              clientName = authReqMsg.clientName;
              const accepted: IPCTypes.AuthAcceptedMessage = {
                type: 'auth-accepted',
                token,
                permissions: authReqMsg.permissions,
              };
              ws.send(JSON.stringify(accepted));
            } else if (decision === 'decline') {
              const declined: IPCTypes.AuthDeclinedMessage = {
                type: 'auth-declined',
                reason: IPCTypes.IPCAuthDeclineReason.eClientBlocked,
              };
              ws.send(JSON.stringify(declined));
            } else if (decision === 'cancel') {
              const declined: IPCTypes.AuthDeclinedMessage = {
                type: 'auth-declined',
                reason: IPCTypes.IPCAuthDeclineReason.eCanceled,
              };
              ws.send(JSON.stringify(declined));
            }
          }
        );
        return;
      }

      // ----------------------
      // ALL OTHER MESSAGES REQUIRE AUTHENTICATION
      // ----------------------
      // If the client is not authenticated, reject all other messages.
      if (!authenticated || !clientName) {
        const declined: IPCTypes.ErrorMessage = {
          type: 'error',
          error: 'Not authenticated',
        };
        ws.send(JSON.stringify(declined));
        return;
      }

      // ----------------------
      // SHOW MENU
      // ----------------------
      // Handle 'show-menu' messages: client requests to show a menu.
      const showMenuParse = IPCTypes.SHOW_MENU_MESSAGE.safeParse(msg);
      if (showMenuParse.success) {
        const showMenuMsg = showMenuParse.data;
        // Emit the 'show-menu' event with callbacks for menu interaction.
        this.emit('show-menu', showMenuMsg.menu, {
          onSelection: (path: number[]) => {
            const selectMsg: IPCTypes.SelectItemMessage = { type: 'select-item', path };
            ws.send(JSON.stringify(selectMsg));
          },
          onHover: (path: number[]) => {
            const hoverMsg: IPCTypes.HoverItemMessage = { type: 'hover-item', path };
            ws.send(JSON.stringify(hoverMsg));
          },
          onClose: () => {
            const closeMsg: IPCTypes.CloseMenuMessage = { type: 'close-menu' };
            ws.send(JSON.stringify(closeMsg));
          },
        });
        return;
      }

      // ----------------------
      // UNKNOWN OR MALFORMED MESSAGE
      // ----------------------
      // If the message type is not recognized, send an error.
      const errorMsg: IPCTypes.ErrorMessage = {
        type: 'error',
        error: 'Unknown or malformed message',
      };
      ws.send(JSON.stringify(errorMsg));
    });
  }
}

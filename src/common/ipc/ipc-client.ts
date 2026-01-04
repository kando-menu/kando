//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';

import * as IPCTypes from './types';
import { TypedEventEmitter, MenuItem } from '..';

/** These events are emitted by the IPC client when menu interactions occur. */
type IPCClientEvents = {
  select: [path: number[]];
  cancel: [];
  hover: [path: number[]];
};

/**
 * IPCClient provides a reference implementation for connecting to the Kando IPC server
 * via WebSockets. It handles authentication, menu requests, and event emission for menu
 * interactions. This class is used by Kando itself to show menus from the settings
 * renderer process and can serve as a template for plugin authors.
 *
 * Usage:
 *
 *     const client = new IPCClient('My Cool App', '/path/to/kando/config');
 *     await client.init();
 *     client.showMenu(menuItem);
 *     client.on('select', (path) => { ... });
 *     client.on('cancel', () => { ... });
 *     client.on('hover', (path) => { ... });
 */
export class IPCClient extends (EventEmitter as new () => TypedEventEmitter<IPCClientEvents>) {
  /** The protocol version supported by this server. Clients must match this version. */
  private static readonly cAPIVersion = 1;

  private ws: WebSocket | null = null;
  private ipcInfo: IPCTypes.IPCInfo | null = null;
  private authenticated = false;

  /**
   * Constructs a new IPCClient instance.
   *
   * @param clientName The name of the client. Used for authentication and identification.
   *   This will be shown to users when they approve or deny access.
   * @param infoDir The directory where the ipc-info.json file is stored (which contains
   *   the websocket port).
   * @param token Optional authentication token. If not provided, a new one will be
   *   requested. However, if the user has previously denied access, this will fail.
   */
  constructor(
    private clientName: string,
    private infoDir: string,
    private token?: string
  ) {
    super();
  }

  /**
   * Initializes the IPC client by reading the port from ipc-info.json, connecting to the
   * WebSocket server, and performing authentication. Resolves with the token and granted
   * permissions if authentication succeeds, or rejects with the decline reason if it
   * fails.
   *
   * @returns A promise resolving to an object containing the token and permissions.
   * @throws If the ipc-info.json file is missing, or authentication fails.
   */
  public async init(): Promise<{ token: string; permissions: IPCTypes.IPCPermission[] }> {
    const infoPath = path.join(this.infoDir, 'ipc-info.json');
    if (!fs.existsSync(infoPath)) {
      throw new Error('ipc-info.json not found');
    }

    const infoRaw = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
    const infoParsed = IPCTypes.IPC_INFO_SCHEMA.safeParse(infoRaw);
    if (infoParsed.success) {
      this.ipcInfo = infoParsed.data;

      if (this.ipcInfo.apiVersion !== IPCClient.cAPIVersion) {
        throw new Error(
          `IPC API version mismatch: Client supports ${IPCClient.cAPIVersion}, ` +
            `server supports ${this.ipcInfo.apiVersion}`
        );
      }

      this.ws = new WebSocket(`ws://127.0.0.1:${this.ipcInfo.port}`);
    } else {
      throw new Error('Invalid ipc-info.json format');
    }

    return new Promise<{ token: string; permissions: IPCTypes.IPCPermission[] }>(
      (resolve, reject) => {
        let authResolved = false;

        // Authenticate using the provided token or request a new one.
        this.ws.on('open', () => {
          if (this.token) {
            const authMsg: IPCTypes.AuthMessage = {
              type: 'auth',
              clientName: this.clientName,
              token: this.token,
              apiVersion: 1,
            };
            this.ws.send(JSON.stringify(authMsg));
          } else {
            const authReqMsg: IPCTypes.AuthRequestMessage = {
              type: 'auth-request',
              clientName: this.clientName,
              permissions: [IPCTypes.IPCPermission.eShowMenu],
              apiVersion: 1,
            };
            this.ws.send(JSON.stringify(authReqMsg));
          }
        });

        this.ws.on('message', (data) => {
          const msg = JSON.parse(data.toString());

          // Handle authentication responses.
          if (!this.authenticated && !authResolved) {
            const acceptedParse = IPCTypes.AUTH_ACCEPTED_MESSAGE.safeParse(msg);
            if (acceptedParse.success) {
              this.token = acceptedParse.data.token;
              this.authenticated = true;
              authResolved = true;
              resolve({ token: this.token, permissions: acceptedParse.data.permissions });
              return;
            }

            const declinedParse = IPCTypes.AUTH_DECLINED_MESSAGE.safeParse(msg);
            if (declinedParse.success) {
              authResolved = true;
              reject(declinedParse.data.reason);
              return;
            }
          }

          // Handle menu events (after authentication).
          if (this.authenticated) {
            if (IPCTypes.SELECT_ITEM_MESSAGE.safeParse(msg).success) {
              this.emit('select', (msg as IPCTypes.SelectItemMessage).path);
            } else if (IPCTypes.CLOSE_MENU_MESSAGE.safeParse(msg).success) {
              this.emit('cancel');
            } else if (IPCTypes.HOVER_ITEM_MESSAGE.safeParse(msg).success) {
              this.emit('hover', (msg as IPCTypes.HoverItemMessage).path);
            }
          }
        });

        this.ws.on('error', (err) => {
          if (!authResolved) {
            reject(err);
          }
        });
      }
    );
  }

  /**
   * Sends a show-menu request to the IPC server. The menu structure must conform to the
   * MenuItem type. Throws if not connected or authenticated.
   *
   * @param menu The menu structure to show, as a MenuItem object.
   */
  public showMenu(menu: MenuItem): void {
    if (!this.ws || !this.authenticated) {
      throw new Error('Not connected or authenticated');
    }
    const msg: IPCTypes.ShowMenuMessage = {
      type: 'show-menu',
      menu,
    };
    this.ws.send(JSON.stringify(msg));
  }

  /** Closes the WebSocket connection, allowing tests and processes to exit cleanly. */
  public close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

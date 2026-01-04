//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { IPCAuthDeclineReason, IPCPermission } from './types';

import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

type IPCClientInfo = {
  token?: string;
  permissions: IPCPermission[];
  blocked?: boolean;
};

export class IPCAuth {
  private clients: Record<string, IPCClientInfo> = {};
  private tokenPath: string;
  private ownClientName = 'kando';

  constructor(dir: string) {
    this.tokenPath = path.join(dir, 'ipc-tokens.json');
    this.load();
  }

  /**
   * Accepts any auth request, generates a random sha256 token, and stores the client by
   * name. Returns the generated token.
   */
  public acceptAuth(clientName: string, permissions: IPCPermission[]): string {
    const token = this.generateToken(clientName);
    this.clients[clientName] = { token, permissions };
    this.save();
    return token;
  }

  /** Blocks a client by clientName. */
  public blockClient(clientName: string) {
    if (this.clients[clientName]) {
      this.clients[clientName].blocked = true;
      this.save();
    } else {
      // If the client never authenticated, create a blocked entry.
      this.clients[clientName] = { permissions: [], blocked: true };
      this.save();
    }
  }

  /** Checks if a client tried to authenticate before. */
  public isKnownClient(clientName: string): boolean {
    return !!this.clients[clientName];
  }

  /**
   * Checks if a client is authenticated (not blocked) by clientName and token. Returns {
   * authenticated: boolean, reason?: IPCAuthDeclineReason }
   */
  public isClientAuthenticated(
    clientName: string,
    token: string
  ): { authenticated: boolean; reason?: IPCAuthDeclineReason } {
    const client = this.clients[clientName];
    if (!client) {
      return { authenticated: false, reason: IPCAuthDeclineReason.eUnknownClient };
    }
    if (client.blocked) {
      return { authenticated: false, reason: IPCAuthDeclineReason.eClientBlocked };
    }
    if (!token || token.length === 0 || client.token !== token) {
      return { authenticated: false, reason: IPCAuthDeclineReason.eInvalidToken };
    }
    return { authenticated: true };
  }

  /**
   * Checks if a client is blocked by clientName. Will return false if the client is not
   * known yet.
   */
  public isClientBlocked(clientName: string): boolean {
    return this.clients[clientName]?.blocked || false;
  }

  /** Gets the permissions for a given clientName, or an empty array if not found. */
  public getPermissions(clientName: string): IPCPermission[] {
    return this.clients[clientName]?.permissions || [];
  }

  /** Returns the token for Kando's own IPC client. */
  public getOwnToken(): { clientName: string; token: string } {
    return {
      clientName: this.ownClientName,
      token: this.clients[this.ownClientName].token,
    };
  }

  /** Loads the tokens.json file if it exists. */
  private load() {
    if (fs.existsSync(this.tokenPath)) {
      try {
        const data = fs.readFileSync(this.tokenPath, 'utf-8');
        this.clients = JSON.parse(data);
      } catch (e) {
        this.clients = {};
      }
    }

    // Ensure Kando itself can connect.
    const token = this.generateToken(this.ownClientName);
    this.clients[this.ownClientName] = {
      token,
      permissions: [IPCPermission.eShowMenu],
    };
  }

  /** Saves the current clients to the tokens.json file. */
  private save() {
    try {
      fs.writeFileSync(this.tokenPath, JSON.stringify(this.clients, null, 2));
    } catch (e) {
      // Ignore errors for now.
    }
  }

  /** Generates a sha256 token for a given client name. */
  private generateToken(clientName: string): string {
    return crypto
      .createHash('sha256')
      .update(Math.random().toString() + Date.now().toString() + clientName)
      .digest('hex');
  }
}

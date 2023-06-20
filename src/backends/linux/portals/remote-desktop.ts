//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import DBus from 'dbus-final';
import { DesktopPortal } from './desktop-portal';

export class RemoteDesktop extends DesktopPortal {
  private interface: DBus.ClientInterface;
  private session: { token: string; path: string };
  private connectPromise: Promise<void>;

  public async movePointer(dx: number, dy: number) {
    await this.connect();
    this.interface.NotifyPointerMotion(this.session.path, {}, dx, dy);
  }

  public async notifyKeyboardKeycode(keycode: number, down: boolean) {
    await this.connect();
    this.interface.NotifyKeyboardKeycode(
      this.session.path,
      {},
      keycode - 8,
      down ? 1 : 0
    );
  }

  private async connect() {
    if (!this.connectPromise) {
      this.connectPromise = this.connectImpl();
    }

    await this.connectPromise;
  }

  private async connectImpl() {
    await super.init();

    this.interface = this.portals.getInterface('org.freedesktop.portal.RemoteDesktop');
    this.session = this.generateToken('session');

    await this.createSession();
    await this.requestDevices();
    await this.start();
  }

  private async createSession() {
    return this.makeRequest((request) => {
      this.interface.CreateSession({
        handle_token: new DBus.Variant('s', request.token),
        session_handle_token: new DBus.Variant('s', this.session.token),
      });
    });
  }

  private async requestDevices() {
    return this.makeRequest((request) => {
      this.interface.SelectDevices(this.session.path, {
        handle_token: new DBus.Variant('s', request.token),
        types: new DBus.Variant('u', 1 | 2),
      });
    });
  }

  private async start() {
    return this.makeRequest((request) => {
      this.interface.Start(this.session.path, '', {
        handle_token: new DBus.Variant('s', request.token),
      });
    });
  }
}

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

/**
 * The remote desktop portal is used to simulate mouse and keyboard input by some of
 * Kando's backends. The connection to the portal is established lazily, i.e. when the
 * first method is called. This may lead to a dialog asking for permission.
 *
 * @see https://flatpak.github.io/xdg-desktop-portal/#gdbus-org.freedesktop.portal.RemoteDesktop
 */
export class RemoteDesktop extends DesktopPortal {
  // This is the proxy object for the org.freedesktop.portal.RemoteDesktop interface.
  private interface: DBus.ClientInterface;

  // This is the token which is used to identify the session. It is generated when the
  // first method is called.
  private session: { token: string; path: string };

  // As the connection to the portal is established lazily, we need to make sure that
  // only one connection is established at a time. This promise is used to achieve this.
  private connectPromise: Promise<void>;

  /**
   * Moves the pointer by the given relative amount. If called for the first time, this
   * method creates a new session which may lead to a dialog asking for permission.
   *
   * @param dx The relative horizontal movement.
   * @param dy The relative vertical movement.
   */
  public async movePointer(dx: number, dy: number) {
    await this.connect();
    this.interface.NotifyPointerMotion(this.session.path, {}, dx, dy);
  }

  /**
   * This method signals the backend that a key has been pressed or released. If called
   * for the first time, this method creates a new session which may lead to a dialog
   * asking for permission.
   *
   * @param keycode The X11 keycode to simulate.
   * @param down Whether the key should be pressed or released.
   */
  public async simulateKey(keycode: number, down: boolean) {
    await this.connect();

    // The keycode is offset by 8 to match the X11 keycode. This is pretty weird, but
    // it seems to be the proper way to do it. Here's the relevant code from mutter:
    // https://gitlab.gnome.org/GNOME/mutter/-/blob/main/src/backends/native/meta-xkb-utils.c#L61
    // https://gitlab.gnome.org/GNOME/mutter/-/blob/main/src/backends/native/meta-xkb-utils.c#L123
    // As this works on KDE, too, I assume that this is the correct way to do it.
    this.interface.NotifyKeyboardKeycode(
      this.session.path,
      {},
      keycode - 8,
      down ? 1 : 0
    );
  }

  /**
   * Connects to the portal if not already connected. It is safe to call this method
   * multiple times even if the connection is already being established.
   */
  private async connect() {
    if (!this.connectPromise) {
      this.connectPromise = this.connectImpl();
    }

    await this.connectPromise;
  }

  /**
   * This method establishes the connection to the portal. It is called by connect() and
   * should not be called directly.
   */
  private async connectImpl() {
    await super.init();

    this.interface = this.portals.getInterface('org.freedesktop.portal.RemoteDesktop');
    this.session = this.generateToken('session');

    await this.createSession();
    await this.requestDevices();
    await this.start();
  }

  /**
   * This method creates a new session. It is called by connectImpl() and should not be
   * called directly.
   *
   * @returns A promise which is resolved when the session is created.
   */
  private async createSession() {
    return this.makeRequest((request) => {
      this.interface.CreateSession({
        handle_token: new DBus.Variant('s', request.token),
        session_handle_token: new DBus.Variant('s', this.session.token),
      });
    });
  }

  /**
   * This method requests access to the pointer and keyboard. It is called by
   * connectImpl() and should not be called directly.
   *
   * @returns A promise which is resolved when the devices are requested.
   */
  private async requestDevices() {
    return this.makeRequest((request) => {
      this.interface.SelectDevices(this.session.path, {
        handle_token: new DBus.Variant('s', request.token),
        types: new DBus.Variant('u', 1 | 2),
      });
    });
  }

  /**
   * This method starts the session. It is called by connectImpl() and should not be
   * called directly.
   *
   * @returns A promise which is resolved when the session is started.
   */
  private async start() {
    return this.makeRequest((request) => {
      this.interface.Start(this.session.path, '', {
        handle_token: new DBus.Variant('s', request.token),
      });
    });
  }
}

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
import { Shortcut } from '../../backend';

/**
 * The global shortcuts portal is used register key bindings by some of Kando's backends.
 * The connection to the portal is established lazily, i.e. when the first method is
 * called. This may lead to a dialog asking for the keybindings.
 *
 * @see https://flatpak.github.io/xdg-desktop-portal/docs/#gdbus-org.freedesktop.portal.GlobalShortcuts
 */
export class GlobalShortcutsHyprland extends DesktopPortal {
  // This is the proxy object for the org.freedesktop.portal.GlobalShortcuts interface.
  private interface: DBus.ClientInterface;

  private shortcuts: Map<string, Shortcut> = new Map();

  // This is the token which is used to identify the session. It is generated when the
  // first method is called.
  private session: { token: string; path: string };

  // As the connection to the portal is established lazily, we need to make sure that
  // only one connection is established at a time. This promise is used to achieve this.
  private connectPromise: Promise<void>;

  public async bind(shortcut: Shortcut) {
    await this.connect();

    this.session = this.generateToken('session');

    this.shortcuts.set(shortcut.id, shortcut);

    const shortcuts = [...this.shortcuts.values()].map((s) => [
      s.id,
      {
        description: new DBus.Variant('s', s.description),
        app_id: new DBus.Variant('s', 'kando'),
      },
    ]);

    console.log('creating session');

    await this.makeRequest((request) => {
      this.interface.CreateSession({
        handle_token: new DBus.Variant('s', request.token),
        session_handle_token: new DBus.Variant('s', this.session.token),
        app_id: new DBus.Variant('s', 'kando'),
        shortcuts: new DBus.Variant('a(sa{sv})', shortcuts),
      });
    });

    console.log('binding shortcuts');

    await this.makeRequest((request) => {
      this.interface.BindShortcuts(this.session.path, shortcuts, 'kando', {
        handle_token: new DBus.Variant('s', request.token),
        app_id: new DBus.Variant('s', 'kando'),
      });
    });

    console.log('done');

    // Remove any previous listener.
    this.interface.removeAllListeners('Activated');

    this.interface.addListener('Activated', (handle, id: string) =>
      this.onShortcutActivated(id)
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

    this.interface = this.portals.getInterface('org.freedesktop.portal.GlobalShortcuts');
  }

  private onShortcutActivated(id: string) {
    console.log('onShortcutActivated', id);
    const shortcut = this.shortcuts.get(id);
    if (shortcut) {
      shortcut.action();
    }
  }
}

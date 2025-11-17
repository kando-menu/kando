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
 * The global shortcuts portal is used to bind os-level shortcuts to actions in Kando. We
 * could use the implementation in Electron / Chromium, but this is a bit limited as of
 * writing this code. Especially, it is not enabled when running under xwayland and it is
 * not possible to pass a description for the shortcuts. Hence we opted for our own
 * implementation.
 *
 * The connection to the portal is established lazily, i.e. when the first method is
 * called. Whenever a new set of shortcuts is requested, a dialog will pop up.
 *
 * Whenever one of the bound shortcuts is activated, the 'ShortcutActivated' event is
 * emitted. The event contains the id of the shortcut which was activated.
 *
 * @see https://flatpak.github.io/xdg-desktop-portal/docs/doc-org.freedesktop.portal.GlobalShortcuts.html
 */
export class GlobalShortcuts extends DesktopPortal {
  /** This is the proxy object for the org.freedesktop.portal.GlobalShortcuts interface. */
  private interface: DBus.ClientInterface;

  /**
   * This is the version of the global shortcuts portal. The ConfigureShortcuts method was
   * not yet available in version 1.
   */
  private version = 0;

  /**
   * This is the token which is used to identify the session. It is generated when the
   * first method is called.
   */
  private session: { token: string; path: string };

  /**
   * As the connection to the portal is established lazily, we need to make sure that only
   * one connection is established at a time. This promise is used to achieve this.
   */
  private connectPromise: Promise<void>;

  /**
   * This method tries to connect to the global shortcuts portal. If the connection is
   * successful, the interface is set and the session is created.
   *
   * @returns True if the global shortcuts portal is available, false otherwise.
   */
  public async isAvailable() {
    await this.connect();
    return !!this.interface;
  }

  /**
   * This method returns the version of the global shortcuts portal. The
   * ConfigureShortcuts method was not yet available in version 1, so you should check the
   * version before using it.
   *
   * @returns The version of the global shortcuts portal. Zero if the portal is not
   *   available.
   */
  public async getVersion(): Promise<number> {
    await this.connect();
    return this.version;
  }

  /** This method lists all registered shortcuts. */
  public async listShortcuts(): Promise<string[]> {
    await this.connect();

    if (this.interface) {
      const result = await this.makeRequest((request) => {
        this.interface.ListShortcuts(this.session.path, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          handle_token: new DBus.Variant('s', request.token),
        });
      });

      if (result.body?.length > 0) {
        const response = result.body[1];

        if (response.shortcuts?.value.length > 0) {
          return response.shortcuts.value.map((item: [string, unknown]) => item[0]);
        }
      }
    }

    return [];
  }

  /**
   * This method binds the given shortcuts to the global shortcuts portal. The shortcuts
   * are passed as an array of objects, each containing an id and a description. If the
   * list differs from the currently bound shortcuts, a dialog will pop up asking the user
   * to confirm the changes.
   *
   * @param shortcuts An array of objects, each containing an id and a description.
   */
  public async bindShortcuts(shortcuts: { id: string; description: string }[]) {
    await this.connect();

    if (this.interface) {
      await this.makeRequest((request) => {
        this.interface.BindShortcuts(
          this.session.path,
          shortcuts.map((shortcut) => [
            shortcut.id,
            { description: new DBus.Variant('s', shortcut.description) },
          ]),
          '',
          {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            handle_token: new DBus.Variant('s', request.token),
          }
        );
      });
    }
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
    try {
      await super.init();

      this.interface = this.portals.getInterface(
        'org.freedesktop.portal.GlobalShortcuts'
      );

      // Get the version of the global shortcuts portal.
      const properties = this.portals.getInterface('org.freedesktop.DBus.Properties');
      const result = await properties.Get(
        'org.freedesktop.portal.GlobalShortcuts',
        'version'
      );

      this.version = result.value;
      this.session = this.generateToken('session');
      await this.createSession();

      // Listen for shortcut activation events.
      this.interface.on('Activated', (handle, id) => {
        this.emit('ShortcutActivated', id);
      });
    } catch (e) {
      this.interface = undefined;
      this.session = undefined;

      console.error('Failed to connect to remote desktop portal:', e);
    }
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
        // eslint-disable-next-line @typescript-eslint/naming-convention
        handle_token: new DBus.Variant('s', request.token),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        session_handle_token: new DBus.Variant('s', this.session.token),
      });
    });
  }
}

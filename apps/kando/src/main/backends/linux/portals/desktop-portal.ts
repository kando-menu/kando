//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import DBus from 'dbus-final';
import { EventEmitter } from 'events';

/**
 * The type information of DBus.MessageBus does not expose the name of the bus, even if
 * the property is actually there. This type is used to fix this.
 */
type NamedMessageBus = {
  name: string;
} & DBus.MessageBus;

/**
 * This is the base class for all portals. It provides some common functionality like
 * generating tokens and making requests. It extends the EventEmitter class so that
 * derived classes can emit events.
 */
export class DesktopPortal extends EventEmitter {
  private bus = DBus.sessionBus() as NamedMessageBus;

  /**
   * This is the proxy object for the org.freedesktop.portal.Desktop interface. It should
   * be used by derived classes to retrieve the actual portal methods.
   */
  protected portals: DBus.ProxyObject;

  /**
   * This method initializes the portal. It must be called before any other method is
   * called.
   */
  protected async init() {
    this.portals = await this.bus.getProxyObject(
      'org.freedesktop.portal.Desktop',
      '/org/freedesktop/portal/desktop'
    );
  }

  /**
   * Most portal methods which return a value use the same pattern: A request is made and
   * a response is received. This method takes care of this pattern.
   *
   * @param method This will be called when the request is ready to be dispatched. A
   *   request token is given to this method, this is usually required for the options
   *   vardict of the actual request method.
   * @returns A promise which resolves when the request has been processed.
   * @see https://flatpak.github.io/xdg-desktop-portal/#idm9
   */
  protected async makeRequest(
    method: (request: { token: string; path: string }) => void
  ) {
    return new Promise<DBus.Message>((resolve, reject) => {
      const request = this.generateToken('request');

      const responseListener = (message: DBus.Message) => {
        if (message.path === request.path) {
          if (message.member !== 'Response') {
            reject(`Got unexpected portal response: ${message.member}`);
          }

          this.bus.removeListener('message', responseListener);
          resolve(message);
        }
      };

      this.bus.addListener('message', responseListener);

      method(request);
    });
  }

  /**
   * Generates a token and a path for a request or session. Request tokens are used by the
   * makeRequest method above, session can be used by derived classes.
   *
   * @param type The type of the token to generate, either 'request' or 'session'.
   * @returns A token and a path for the request.
   * @see https://flatpak.github.io/xdg-desktop-portal/#gdbus-org.freedesktop.portal.Request
   */
  protected generateToken(type: 'request' | 'session') {
    const token = 'kando_' + Math.floor(Math.random() * 0x100000000);
    const sender = this.bus.name.slice(1).replace(/\./g, '_');
    const path = `/org/freedesktop/portal/desktop/${type}/${sender}/${token}`;

    return { token, path };
  }
}

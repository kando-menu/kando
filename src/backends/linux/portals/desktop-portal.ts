//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import DBus from 'dbus-final';

interface NamedMessageBus extends DBus.MessageBus {
  name: string;
}

export class DesktopPortal {
  private bus = DBus.sessionBus() as NamedMessageBus;

  protected portals: DBus.ProxyObject;

  protected async init() {
    this.portals = await this.bus.getProxyObject(
      'org.freedesktop.portal.Desktop',
      '/org/freedesktop/portal/desktop'
    );
  }

  protected async makeRequest(
    method: (request: { token: string; path: string }) => void
  ) {
    return new Promise<void>((resolve, reject) => {
      const request = this.generateToken('request');

      const responseListener = (message: DBus.Message) => {
        if (message.path === request.path) {
          if (message.member !== 'Response') {
            reject(`Got unexpected portal response: ${message.member}`);
          }

          this.bus.removeListener('message', responseListener);
          resolve();
        }
      };

      this.bus.addListener('message', responseListener);

      method(request);
    });
  }

  protected generateToken(type: 'request' | 'session') {
    const token = 'kando_' + Math.floor(Math.random() * 0x100000000);
    const sender = this.bus.name.slice(1).replace(/\./g, '_');
    const path = `/org/freedesktop/portal/desktop/${type}/${sender}/${token}`;

    return { token, path };
  }
}

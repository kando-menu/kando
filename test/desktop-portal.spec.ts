// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

// D-Bus member names and portal dictionary keys follow the wire protocol.
/* eslint-disable @typescript-eslint/naming-convention */

import { expect } from 'chai';
import DBus from 'dbus-native';
import { DesktopPortal } from '../src/main/backends/linux/portals/desktop-portal';

class TestPortal extends DesktopPortal {
  public initialize() {
    return this.init();
  }

  public request(method: Parameters<DesktopPortal['makeRequest']>[0]) {
    return this.makeRequest(method);
  }
}

describe('Desktop portal D-Bus transport', function () {
  let broker: DBus.DBusBroker;
  let service: DBus.MessageBus;
  let portal: TestPortal;
  let previousAddress: string | undefined;
  let previousRegistration: Promise<void>;
  const desktopPath = '/org/freedesktop/portal/desktop';

  beforeEach(async function () {
    previousAddress = process.env.DBUS_SESSION_BUS_ADDRESS;
    previousRegistration = DesktopPortal.registrationPromise;
    DesktopPortal.registrationPromise = undefined;
    broker = DBus.createBroker();
    const address = await new Promise<string>((resolve, reject) => {
      broker.listen({ host: '127.0.0.1', port: 0 }, (error, address) => {
        if (error) {
          reject(error);
        } else {
          resolve(address);
        }
      });
    });
    process.env.DBUS_SESSION_BUS_ADDRESS = address;
    service = DBus.sessionBus();
    service.exportInterface({ Register() {} }, desktopPath, {
      name: 'org.freedesktop.host.portal.Registry',
      methods: { Register: ['sa{sv}', '', ['app_id', 'options'], []] },
    });
    await service.requestName('org.freedesktop.portal.Desktop', 0);
    portal = new TestPortal();
    await portal.initialize();
  });

  afterEach(async function () {
    if (previousAddress === undefined) {
      delete process.env.DBUS_SESSION_BUS_ADDRESS;
    } else {
      process.env.DBUS_SESSION_BUS_ADDRESS = previousAddress;
    }
    DesktopPortal.registrationPromise = previousRegistration;
    // Keep test-only connection cleanup out of the portal's public API.
    portal?.['bus'].connection.end();
    service?.connection.end();
    if (broker) {
      await new Promise<void>((resolve) => broker.close(resolve));
    }
  });

  it('receives an immediate directed Response and decodes variant dictionaries', async function () {
    const client = portal['bus'];
    const listenerCount = client.connection.listenerCount('message');
    service.exportInterface(
      {
        CreateSession(options: Record<string, string>) {
          const sender = client.name.slice(1).replace(/\./g, '_');
          const path = `${desktopPath}/request/${sender}/${options.handle_token}`;
          service.connection.message({
            type: DBus.messageType.signal,
            serial: service.serial++,
            destination: client.name,
            path,
            interface: 'org.freedesktop.portal.Request',
            member: 'Response',
            signature: 'ua{sv}',
            body: [
              0,
              {
                devices: new DBus.Variant('u', 3),
                restore_token: new DBus.Variant('s', 'saved-token'),
                shortcuts: new DBus.Variant('a(sa{sv})', [
                  [
                    'menu',
                    {
                      description: new DBus.Variant('s', 'Open menu'),
                    },
                  ],
                ]),
              },
            ],
          });
          return path;
        },
      },
      desktopPath,
      {
        name: 'org.freedesktop.portal.RemoteDesktop',
        methods: { CreateSession: ['a{sv}', 'o', ['options'], ['handle']] },
      }
    );
    const remote = await client
      .getService('org.freedesktop.portal.Desktop')
      .getInterface(desktopPath, 'org.freedesktop.portal.RemoteDesktop');
    const response = await portal.request(({ token }) =>
      remote.CreateSession({
        handle_token: new DBus.Variant('s', token),
      })
    );
    expect(response.body).to.deep.equal([
      0,
      {
        devices: 3,
        restore_token: 'saved-token',
        shortcuts: [['menu', { description: 'Open menu' }]],
      },
    ]);
    expect(client.connection.listenerCount('message')).to.equal(listenerCount);
  });

  it('rejects D-Bus method errors and removes the response listener', async function () {
    const client = portal['bus'];
    const listenerCount = client.connection.listenerCount('message');
    let failure: unknown;
    try {
      await portal.request(() =>
        client.invoke({
          destination: 'org.freedesktop.portal.Desktop',
          path: desktopPath,
          interface: 'org.freedesktop.host.portal.Registry',
          member: 'MissingMethod',
        })
      );
    } catch (error) {
      failure = error;
    }
    expect(failure).to.be.instanceOf(DBus.DBusError);
    expect(client.connection.listenerCount('message')).to.equal(listenerCount);
  });

  it('removes the response listener when dispatch throws synchronously', async function () {
    const client = portal['bus'];
    const listenerCount = client.connection.listenerCount('message');
    const failure = new Error('Failed to dispatch');
    let caught: unknown;
    try {
      await portal.request(() => {
        throw failure;
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).to.equal(failure);
    expect(client.connection.listenerCount('message')).to.equal(listenerCount);
  });
});

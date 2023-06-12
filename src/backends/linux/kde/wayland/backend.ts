//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import os from 'os';
import fs from 'fs';
import DBus from 'dbus-final';

import { X11Backend } from '../../x11/backend';
import { RemoteDesktop } from '../../../portals/remote-desktop';

class KWinScriptInterface extends DBus.interface.Interface {
  private callback: (
    windowName: string,
    windowClass: string,
    x: number,
    y: number
  ) => void;

  public SendInfo(windowName: string, windowClass: string, x: number, y: number) {
    this.callback(windowName, windowClass, x, y);
  }

  public setCallback(
    callback: (windowName: string, windowClass: string, x: number, y: number) => void
  ) {
    this.callback = callback;
  }
}

/**
 * This backend is used on KDE with X11.
 */
export class KDEWaylandBackend extends X11Backend {
  private portal: RemoteDesktop = new RemoteDesktop();

  private kwinScripting: DBus.ClientInterface;
  private scriptInterface: KWinScriptInterface;

  /**
   * On KDE, the 'toolbar' window type is used. The 'dock' window type makes the window
   * not receive any keyboard events.
   *
   * @returns 'toolbar'
   */
  public override getWindowType() {
    return 'toolbar';
  }

  public override async init() {
    await super.init();

    // Create the KWin script.
    const script = `
      callDBus('org.kandomenu.kando', '/org/kandomenu/kando', 
               'org.kandomenu.kando', 'SendInfo',
               workspace.activeClient.caption,
               workspace.activeClient.resourceClass,
               workspace.cursorPos.x, workspace.cursorPos.y,
               () => {
                 console.log('Kando: Successfully transmitted the data.');
               }
      );
      console.log('Kando: Received data request.');
    `;

    const tmpDir = os.tmpdir() + '/kando';
    fs.mkdirSync(tmpDir, { recursive: true });

    const scriptPath = tmpDir + '/waylandSupport.js';
    fs.writeFileSync(scriptPath, script);

    // Create the D-Bus interface for the script to communicate with.
    this.scriptInterface = new KWinScriptInterface('org.kandomenu.kando');
    KWinScriptInterface.configureMembers({
      methods: {
        SendInfo: { inSignature: 'ssii', outSignature: '', noReply: false },
      },
    });

    const bus = DBus.sessionBus();

    await bus.requestName('org.kandomenu.kando', 0);
    bus.export('/org/kandomenu/kando', this.scriptInterface);

    // Acquire the KWin scripting interface to run the script.
    const obj = await bus.getProxyObject('org.kde.KWin', '/Scripting');
    this.kwinScripting = obj.getInterface('org.kde.kwin.Scripting');
  }

  public override async getWMInfo(): Promise<{
    windowName: string;
    windowClass: string;
    pointerX: number;
    pointerY: number;
  }> {
    return new Promise((resolve, reject) => {
      this.scriptInterface.setCallback(
        (windowName: string, windowClass: string, pointerX: number, pointerY: number) => {
          resolve({
            windowName: windowName,
            windowClass: windowClass,
            pointerX: pointerX,
            pointerY: pointerY,
          });
        }
      );

      setTimeout(() => {
        reject('Did not receive an answer by the Kando KWin script.');
      }, 1000);

      const scriptPath = os.tmpdir() + '/kando/waylandSupport.js';
      this.kwinScripting.loadScript(scriptPath).then((id: number) => {
        DBus.sessionBus()
          .call(
            new DBus.Message({
              destination: 'org.kde.KWin',
              path: '/' + id,
              interface: 'org.kde.kwin.Script',
              member: 'run',
            })
          )
          .then(() => {
            DBus.sessionBus()
              .call(
                new DBus.Message({
                  destination: 'org.kde.KWin',
                  path: '/' + id,
                  interface: 'org.kde.kwin.Script',
                  member: 'stop',
                })
              )
              .catch((error) => {
                reject(error);
              });
          })
          .catch((error) => {
            reject(error);
          });
      });
    });
  }

  /**
   * Moves the pointer by the given amount.
   *
   * @param dx The amount of horizontal movement.
   * @param dy The amount of vertical movement.
   */
  public override async movePointer(dx: number, dy: number) {
    await this.portal.setPointer(dx, dy);
  }
}

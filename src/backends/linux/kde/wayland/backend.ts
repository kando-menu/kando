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

import { Backend, WMInfo } from '../../../backend';
import { RemoteDesktop } from '../../../portals/remote-desktop';

class KWinScriptInterface extends DBus.interface.Interface {
  private wmInfoCallback: (info: WMInfo) => void;
  private triggerCallback: () => void;

  public SendWMInfo(
    windowName: string,
    windowClass: string,
    pointerX: number,
    pointerY: number
  ) {
    this.wmInfoCallback({ windowName, windowClass, pointerX, pointerY });
  }

  public Trigger() {
    this.triggerCallback();
  }

  public setWMInfoCallback(callback: (info: WMInfo) => void) {
    this.wmInfoCallback = callback;
  }

  public setTriggerCallback(callback: () => void) {
    this.triggerCallback = callback;
  }
}

/**
 * This backend is used on KDE with X11.
 */
export class KDEWaylandBackend implements Backend {
  private portal: RemoteDesktop = new RemoteDesktop();

  private kwinScripting: DBus.ClientInterface;
  private scriptInterface: KWinScriptInterface;

  private wmInfoScriptPath: string;
  private tiggerScriptPath: string;
  private triggerScriptID: number;

  /**
   * On KDE, the 'toolbar' window type is used. The 'dock' window type makes the window
   * not receive any keyboard events.
   *
   * @returns 'toolbar'
   */
  public getWindowType() {
    return 'toolbar';
  }

  public async init() {
    // Create the KWin script.
    this.wmInfoScriptPath = this.storeScript(
      'sendWMInfo.js',
      `callDBus('org.kandomenu.kando', '/org/kandomenu/kando', 
               'org.kandomenu.kando', 'SendWMInfo',
               workspace.activeClient.caption,
               workspace.activeClient.resourceClass,
               workspace.cursorPos.x, workspace.cursorPos.y,
               () => {
                 console.log('Kando: Successfully transmitted the data.');
               }
      );
      console.log('Kando: Received data request.');
    `
    );

    // Create the KWin script.
    this.tiggerScriptPath = this.storeScript(
      'trigger.js',
      `const success = registerShortcut('Kando', 'Trigger Kando Prototype', 'Ctrl+Space', () => {
         console.log('Kando: Triggered.');
         callDBus('org.kandomenu.kando', '/org/kandomenu/kando', 
                  'org.kandomenu.kando', 'Trigger');
       });

       if (success) {
         console.log('Kando: Set up trigger.');
       } else {
          console.log('Kando: Failed to set up trigger.');
       }
    `
    );

    // Create the D-Bus interface for the script to communicate with.
    this.scriptInterface = new KWinScriptInterface('org.kandomenu.kando');
    KWinScriptInterface.configureMembers({
      methods: {
        SendWMInfo: { inSignature: 'ssii', outSignature: '', noReply: false },
        Trigger: { inSignature: '', outSignature: '', noReply: false },
      },
    });

    const bus = DBus.sessionBus();

    await bus.requestName('org.kandomenu.kando', 0);
    bus.export('/org/kandomenu/kando', this.scriptInterface);

    // Acquire the KWin scripting interface to run the scripts.
    const obj = await bus.getProxyObject('org.kde.KWin', '/Scripting');
    this.kwinScripting = obj.getInterface('org.kde.kwin.Scripting');

    this.triggerScriptID = await this.startScript(this.tiggerScriptPath);
  }

  public async getWMInfo(): Promise<{
    windowName: string;
    windowClass: string;
    pointerX: number;
    pointerY: number;
  }> {
    return new Promise((resolve, reject) => {
      this.scriptInterface.setWMInfoCallback(resolve);

      setTimeout(() => {
        reject('Did not receive an answer by the Kando KWin script.');
      }, 1000);

      this.startScript(this.wmInfoScriptPath).then((id) => {
        this.stopScript(id);
      });
    });
  }

  /**
   * Moves the pointer by the given amount.
   *
   * @param dx The amount of horizontal movement.
   * @param dy The amount of vertical movement.
   */
  public async movePointer(dx: number, dy: number) {
    await this.portal.movePointer(dx, dy);
  }

  public async simulateShortcut(shortcut: string): Promise<void> {
    // console.log('Control_L+X', native.convertShortcut('Control_L+X'));
    // console.log('F', native.convertShortcut('F'));
    // console.log('F+Alt_L', native.convertShortcut('F+Alt_L'));
    // console.log('Alt_L', native.convertShortcut('Alt_L'));
    // console.log('Alt_L+Shift_L+Q', native.convertShortcut('Alt_L+Shift_L+Q'));
    // console.log('+', native.convertShortcut('+'));
    // console.log('Alt_L++', native.convertShortcut('Alt_L++'));
    // console.log('Alt_L+++', native.convertShortcut('Alt_L+++'));
    // console.log('+++', native.convertShortcut('+++'));
  }

  /**
   * Binds a callback to a keyboard shortcut. The callback is called whenever the shortcut
   * is pressed.
   *
   * @param shortcut The shortcut to simulate.
   * @returns A promise which resolves when the shortcut has been simulated.
   * @todo: Add information about the string format of the shortcut.
   */
  public async bindShortcut(shortcut: string, callback: () => void) {
    this.scriptInterface.setTriggerCallback(callback);
  }

  public async unbindShortcut(shortcut: string) {
    this.scriptInterface.setTriggerCallback(() => {});
    this.stopScript(this.triggerScriptID);
  }

  public async unbindAllShortcuts() {
    this.scriptInterface.setTriggerCallback(() => {});
    this.stopScript(this.triggerScriptID);
  }

  private storeScript(name: string, script: string) {
    const tmpDir = os.tmpdir() + '/kando';
    fs.mkdirSync(tmpDir, { recursive: true });

    const scriptPath = tmpDir + '/' + name;
    fs.writeFileSync(scriptPath, script);

    return scriptPath;
  }

  private async startScript(scriptPath: string) {
    const id = await this.kwinScripting.loadScript(scriptPath);
    await DBus.sessionBus().call(
      new DBus.Message({
        destination: 'org.kde.KWin',
        path: '/' + id,
        interface: 'org.kde.kwin.Script',
        member: 'run',
      })
    );

    return id;
  }

  private async stopScript(scriptID: number) {
    await DBus.sessionBus().call(
      new DBus.Message({
        destination: 'org.kde.KWin',
        path: '/' + scriptID,
        interface: 'org.kde.kwin.Script',
        member: 'stop',
      })
    );
  }
}

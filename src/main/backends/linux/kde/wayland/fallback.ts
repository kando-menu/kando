//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { WMInfo } from '../../../../../common';

import { app } from 'electron';
import fs from 'fs';
import DBus from 'dbus-final';
import { exec } from 'child_process';
import { screen } from 'electron';

/**
 * This class provides a fallback implementation for the getWMInfo() method of the
 * KDEWaylandBackend class. It uses a KWin script to get the name and app of the currently
 * focused window as well as the current pointer position. This is only used if the KWin
 * plugin for Kando is not available (e.g. because it is not installed or because the user
 * is running an incompatible version of KWin).
 */
export class KDEWaylandFallback {
  /** Here we store the current KWin version as [major, minor, patch]. */
  private kwinVersion?: number[];

  /**
   * The KWin scripting interface is used to load custom JavaScript code into KWin. The
   * scripts will acquire the required information for Kando (mouse pointer position and
   * name and app of the currently focused window) and send it to Kando via D-Bus.
   */
  private scriptingInterface?: DBus.ClientInterface;

  /** This is the interface which is exposed by Kando for the KWin script to talk to. */
  private kandoInterface?: CustomInterface;

  /**
   * KWin can only load scripts from files. Hence, we need to store the script in a
   * temporary directory.
   */
  private wmInfoScriptPath?: string;

  /**
   * This initializes the backend. It will create and store the one or two KWin scripts in
   * a temporary directory and load the trigger-script into KWin in order to register the
   * global shortcuts if the global shortcuts portal is not available.
   *
   * In addition, it will set up the D-Bus interface which is used by the KWin scripts to
   * communicate with Kando.
   */
  public async init() {
    this.kwinVersion = await this.getKWinVersion();

    // Create the KWin script which will send information about the currently focused
    // window and the mouse pointer position to Kando.
    const property = this.kwinVersion[0] >= 6 ? 'activeWindow' : 'activeClient';
    this.wmInfoScriptPath = this.storeScript(
      'get-info.js',
      `callDBus('menu.kando.Kando', '/menu/kando/Kando',
               'menu.kando.Kando', 'sendWMInfo',
               workspace.${property} ? workspace.${property}.caption : "",
               workspace.${property} ? workspace.${property}.resourceClass : "",
               workspace.cursorPos.x, workspace.cursorPos.y,
               () => {
                 console.log('Kando: Successfully transmitted the data.');
               }
      );
      console.log('Kando: Received data request.');
    `
    );

    // Create the D-Bus interface for the KWin script to communicate with.
    this.kandoInterface = new CustomInterface('menu.kando.Kando');
    CustomInterface.configureMembers({
      methods: {
        sendWMInfo: { inSignature: 'ssii', outSignature: '', noReply: false },
      },
    });

    const bus = DBus.sessionBus();
    await bus.requestName('menu.kando.Kando', 0);
    bus.export('/menu/kando/Kando', this.kandoInterface);

    // Acquire the KWin scripting interface to run the scripts.
    const obj = await bus.getProxyObject('org.kde.KWin', '/Scripting');
    this.scriptingInterface = obj.getInterface('org.kde.kwin.Scripting');
  }

  /**
   * This uses a KWin script to get the name and app of the currently focused window as
   * well as the current pointer position.
   *
   * @returns The name and app of the currently focused window as well as the current
   *   pointer position.
   */
  public async getWMInfo(): Promise<{
    windowName: string;
    appName: string;
    pointerX: number;
    pointerY: number;
    workArea: Electron.Rectangle;
  }> {
    return new Promise((resolve, reject) => {
      this.kandoInterface!.wmInfoCallback = resolve;

      setTimeout(() => {
        reject('Did not receive an answer by the Kando KWin script.');
      }, 1000);

      // Run the script. We can stop the script again right after it completed.
      this.startScript(this.wmInfoScriptPath!).then((id) => {
        this.stopScript(id);
      });
    });
  }

  /**
   * Stores the given script in a temporary directory and returns the full path to it.
   *
   * @param name File name of the script, without directory.
   * @param script JavaScript code of the script.
   * @returns The full path to the script.
   */
  private storeScript(name: string, script: string) {
    const scriptDir = app.getPath('sessionData') + '/kwin_scripts';
    fs.mkdirSync(scriptDir, { recursive: true });

    const scriptPath = scriptDir + '/' + name;
    fs.writeFileSync(scriptPath, script);

    return scriptPath;
  }

  /**
   * Starts a KWin script.
   *
   * @param scriptPath Full path to a JavaScript file.
   * @returns An ID which can be used to stop the script.
   */
  private async startScript(scriptPath: string) {
    const scriptInterface = this.kwinVersion![0] >= 6 ? '/Scripting/Script' : '/';
    const id = await this.scriptingInterface!.loadScript(scriptPath);
    await DBus.sessionBus().call(
      new DBus.Message({
        destination: 'org.kde.KWin',
        path: scriptInterface + id,
        interface: 'org.kde.kwin.Script',
        member: 'run',
      })
    );

    return id;
  }

  /**
   * Stops a KWin script.
   *
   * @param scriptID The ID of the script to stop.
   */
  private async stopScript(scriptID: number) {
    const scriptInterface = this.kwinVersion![0] >= 6 ? '/Scripting/Script' : '/';
    await DBus.sessionBus().call(
      new DBus.Message({
        destination: 'org.kde.KWin',
        path: scriptInterface + scriptID,
        interface: 'org.kde.kwin.Script',
        member: 'stop',
      })
    );
  }

  /**
   * This uses kwin --version to get the version of KWin.
   *
   * @returns A promise which resolves to [major, minor, patch].
   */
  private async getKWinVersion(): Promise<number[]> {
    return new Promise((resolve, reject) => {
      let command = 'kwin_wayland --version';

      // If we are inside a flatpak container, we cannot execute commands directly on the host.
      // Instead we need to use flatpak-spawn.
      if (process.env.container && process.env.container === 'flatpak') {
        command = 'flatpak-spawn --host ' + command;
      }

      exec(command, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        // The output of kwin --version is something like "kwin 5.21.4". We extract the
        // version number.
        const version = stdout.split(' ')[1].split('.');

        resolve(version.map((v) => parseInt(v)));
      });
    });
  }
}

// This class is available via DBus in the KWin script.
class CustomInterface extends DBus.interface.Interface {
  // These callbacks are set by the KDEWaylandBackend class above.
  public wmInfoCallback?: (info: WMInfo) => void;

  // This is called by the get-info KWin script.
  public sendWMInfo(
    windowName: string,
    appName: string,
    pointerX: number,
    pointerY: number
  ) {
    if (this.wmInfoCallback) {
      this.wmInfoCallback({
        windowName,
        appName,
        pointerX,
        pointerY,
        workArea: screen.getDisplayNearestPoint({
          x: pointerX,
          y: pointerY,
        }).workArea,
      });
    }
  }
}

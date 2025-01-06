//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';
import { app } from 'electron';
import fs from 'fs';
import DBus from 'dbus-final';
import { exec } from 'child_process';

import { Backend, WMInfo, Shortcut } from '../../../backend';
import { RemoteDesktop } from '../../portals/remote-desktop';
import { IKeySequence } from '../../../../../common';
import { mapKeys } from '../../../../../common/key-codes';

/**
 * This backend is used on KDE with Wayland. It uses the KWin scripting interface to bind
 * global keyboard shortcuts and to get information about the currently focused window as
 * well as the current pointer position. Mouse and keyboard events are simulated using the
 * RemoteDesktop portal.
 *
 * Using the KWin scripting interface is a bit hacky, but for now it seems to be the only
 * way to get information on the focused window and the mouse pointer position! Also, the
 * scripting interface seems to be the only viable way to bind global keyboard shortcuts
 * for now. Here are alternative approaches which I considered:
 *
 * Getting the name and app of the focused window:
 *
 * - There is a request for a corresponding desktop portal:
 *   https://github.com/flatpak/xdg-desktop-portal/issues/304
 *
 * Binding global keyboard shortcuts:
 *
 * - We could omit automatic binding of global shortcuts on KDE Wayland and let the users
 *   configure their own key bindings in the system settings.
 * - There is a corresponding desktop portal, but it is very new and not yet available
 *   ubiquitously: https://github.com/flatpak/xdg-desktop-portal/issues/624. At some
 *   point, Electron will probably support it, so we could maybe wait a couple of months.
 *   https://github.com/electron/electron/issues/38288
 * - There is KGlobaAccel. Directly using the D-Bus interface is not possible, because it
 *   uses some serialized Qt types. The only approach would be a native module which links
 *   against Qt. While this could be possible, it would introduce a lot of complexity.
 */
export class KDEWaylandBackend implements Backend {
  /** Here we store the current KWin version as [major, minor, patch]. */
  private kwinVersion: number[];

  /** The remote desktop portal is used to simulate mouse and keyboard events. */
  private remoteDesktop = new RemoteDesktop();

  /**
   * The KWin scripting interface is used to load custom JavaScript code into KWin. The
   * scripts will acquire the required information for Kando (mouse pointer position and
   * name and app of the currently focused window) and send it to Kando via D-Bus.
   */
  private scriptingInterface: DBus.ClientInterface;

  /** This is the interface which is exposed by Kando for the KWin script to talk to. */
  private kandoInterface: CustomInterface;

  /**
   * KWin can only load scripts from files. Hence, we need to store the script in a
   * temporary directory.
   */
  private wmInfoScriptPath: string;

  /**
   * The trigger script is reloaded whenever a new shortcut is bound. We need to store the
   * script ID to be able to unload it.
   */
  private triggerScriptID = -1;

  /** Here we store all shortcuts which are currently bound. */
  private shortcuts: Shortcut[] = [];

  /**
   * On KDE, the 'toolbar' window type is used. The 'dock' window type makes the window
   * not receive any keyboard events.
   */
  public getBackendInfo() {
    return {
      name: 'KDE Wayland Backend',
      windowType: 'toolbar',
      supportsShortcuts: false,
      shortcutHint: i18next.t('backends.kde-wayland.shortcut-hint'),
    };
  }

  /**
   * This initializes the backend. It will create and store the two KWin scripts in a
   * temporary directory and load the trigger-script into KWin in order to register the
   * global shortcut.
   *
   * In addition, it will set up the D-Bus interface which is used by the KWin scripts to
   * communicate with Kando.
   */
  public async init() {
    // Get the KWin version.
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
        trigger: { inSignature: 's', outSignature: '', noReply: false },
      },
    });

    // Execute the trigger action whenever the KWin script sends a signal.
    this.kandoInterface.triggerCallback = (trigger: string) => {
      const shortcut = this.shortcuts.find((s) => s.trigger === trigger);
      if (shortcut) {
        shortcut.action();
      }
    };

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
  }> {
    return new Promise((resolve, reject) => {
      this.kandoInterface.wmInfoCallback = resolve;

      setTimeout(() => {
        reject('Did not receive an answer by the Kando KWin script.');
      }, 1000);

      // Run the script. We can stop the script again right after it completed.
      this.startScript(this.wmInfoScriptPath).then((id) => {
        this.stopScript(id);
      });
    });
  }

  /**
   * Moves the pointer by the given amount. This uses the remote desktop portal. As such,
   * it may present a dialog to the user, asking for permission to control the pointer.
   *
   * @param dx The amount of horizontal movement.
   * @param dy The amount of vertical movement.
   */
  public async movePointer(dx: number, dy: number) {
    await this.remoteDesktop.movePointer(dx, dy);
  }

  /**
   * Simulates a sequence of key presses using the remote desktop portal. If one of the
   * given keys in the sequence is not known, an exception will be thrown.
   *
   * @param shortcut The keys to simulate.
   */
  public async simulateKeys(keys: IKeySequence): Promise<void> {
    // We first need to convert the given DOM key names to X11 key codes. If a key code is
    // not found, this throws an error.
    const keyCodes = mapKeys(keys, 'linux');

    // Now simulate the key presses. We wait a couple of milliseconds if the key has a
    // delay specified.
    for (let i = 0; i < keyCodes.length; i++) {
      if (keys[i].delay > 0) {
        await new Promise((resolve) => {
          setTimeout(resolve, keys[i].delay);
        });
      }

      this.remoteDesktop.simulateKey(keyCodes[i], keys[i].down);
    }
  }

  /**
   * This binds a shortcut. The action callback of the shortcut is called when the
   * shortcut is pressed. On KDE Wayland, this uses a KWin script.
   *
   * @param shortcut The shortcut to simulate.
   * @returns A promise which resolves when the shortcut has been bound.
   */
  public async bindShortcut(shortcut: Shortcut) {
    this.shortcuts.push(shortcut);
    await this.updateShortcuts();
  }

  /**
   * Unbinds a keyboard shortcut. For now, this function stops the background KWIn script
   * which registered the shortcut. A new script is started which re-registers all
   * remaining shortcuts.
   *
   * @param trigger The trigger of a previously bound.
   */
  public async unbindShortcut(trigger: string) {
    this.shortcuts = this.shortcuts.filter((s) => s.trigger !== trigger);
    await this.updateShortcuts();
  }

  /**
   * Unbinds all keyboard shortcuts. This function stops the background KWIn script which
   * registered all the shortcut.
   */
  public async unbindAllShortcuts() {
    this.shortcuts = [];
    await this.updateShortcuts();
  }

  /**
   * Creates and runs a KWin script which registers all configured shortcuts. Any
   * previously registered shortcuts are unregistered.
   */
  private async updateShortcuts() {
    // First disable all shortcuts by stopping the script.
    if (this.triggerScriptID >= 0) {
      await this.stopScript(this.triggerScriptID);
      this.triggerScriptID = -1;
    }

    // If there are no shortcuts, we are done.
    if (this.shortcuts.length === 0) {
      return;
    }

    // Then create a new script which registers all shortcuts.
    const script = this.shortcuts
      .map((shortcut) => {
        // Escape any ' or \ in the ID or description.
        const id = this.escapeString(shortcut.trigger);

        return `
          if(registerShortcut('${id}', 'Kando - ${id}', '',
            () => {
              console.log('Kando: Triggered.');
              callDBus('menu.kando.Kando', '/menu/kando/Kando',
                       'menu.kando.Kando', 'trigger', '${id}',
                       () => console.log('Kando: Triggered.'));
            }
          )) {
            console.log('Kando: Registered shortcut ${id}');
          } else {
            console.log('Kando: Failed to registered shortcut ${id}');
          }
        `;
      })
      .join('\n');

    const scriptPath = this.storeScript('global-shortcuts.js', script);

    // Finally bind the global shortcut by running the trigger script.
    this.triggerScriptID = await this.startScript(scriptPath);
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
    const scriptInterface = this.kwinVersion[0] >= 6 ? '/Scripting/Script' : '/';
    const id = await this.scriptingInterface.loadScript(scriptPath);
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
    const scriptInterface = this.kwinVersion[0] >= 6 ? '/Scripting/Script' : '/';
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
   * Escapes a string so that it can be used in a JavaScript string.
   *
   * @param str The string to escape.
   * @returns The escaped string.
   */
  private escapeString(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
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
  public wmInfoCallback: (info: WMInfo) => void;
  public triggerCallback: (shortcutID: string) => void;

  // This is called by the get-info KWin script.
  public sendWMInfo(
    windowName: string,
    appName: string,
    pointerX: number,
    pointerY: number
  ) {
    if (this.wmInfoCallback) {
      this.wmInfoCallback({ windowName, appName, pointerX, pointerY });
    }
  }

  // This is called by the global-shortcut KWin script whenever the trigger shortcut is pressed.
  public trigger(shortcutID: string) {
    if (this.triggerCallback) {
      this.triggerCallback(shortcutID);
    }
  }
}

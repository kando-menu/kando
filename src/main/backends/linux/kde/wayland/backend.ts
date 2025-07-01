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

import { Backend } from '../../../backend';
import { RemoteDesktop } from '../../portals/remote-desktop';
import { GlobalShortcuts } from '../../portals/global-shortcuts';
import { IKeySequence, IWMInfo } from '../../../../../common';
import { mapKeys } from '../../../../../common/key-codes';
import { screen } from 'electron';

/**
 * This backend is used on KDE with Wayland. It uses the GlobalShortcuts desktop portal to
 * bind shortcuts. If this is not available, it falls back to a hacky KWin-scripting based
 * method. It also uses a KWin script to get information about the currently focused
 * window as well as the current pointer position. Mouse and keyboard events are simulated
 * using the RemoteDesktop portal.
 *
 * Using the KWin scripting interface is a bit hacky, but for now it seems to be the only
 * way to get information on the focused window and the mouse pointer position! Here is a
 * request for a corresponding desktop portal:
 * https://github.com/flatpak/xdg-desktop-portal/issues/304
 */
export class KDEWaylandBackend extends Backend {
  /** Here we store the current KWin version as [major, minor, patch]. */
  private kwinVersion: number[];

  /** The remote-desktop portal is used to simulate mouse and keyboard events. */
  private remoteDesktop = new RemoteDesktop();

  /** The global-shortcuts portal is used to bind os-level shortcuts if possible. */
  private globalShortcuts = new GlobalShortcuts();

  /** This indicates whether the global-shortcuts portal is available on the system. */
  private globalShortcutsAvailable = false;

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

  /**
   * On KDE, the 'toolbar' window type is used. The 'dock' window type makes the window
   * not receive any keyboard events.
   */
  public getBackendInfo() {
    return {
      name: 'KDE Wayland',
      menuWindowType: 'toolbar',
      supportsShortcuts: false,
      shortcutHint: i18next.t('backends.kde-wayland.shortcut-info'),
      shouldUseTransparentSettingsWindow: false,
    };
  }

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
    this.globalShortcutsAvailable = await this.globalShortcuts.isAvailable();

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

    // This is called if a shortcut is activated either via the global shortcuts portal
    // or via the KWin script. As this backend does not support inhibiting shortcuts by
    // unbinding them, we only prevent the action from being executed if the shortcut
    // is in the inhibitedShortcuts array.
    const onShortcutActivated = (shortcutID: string) => {
      if (!this.getInhibitedShortcuts().includes(shortcutID)) {
        this.onShortcutPressed(shortcutID);
      }
    };

    this.globalShortcuts.on('ShortcutActivated', onShortcutActivated);

    // Create the D-Bus interface for the KWin script to communicate with.
    this.kandoInterface = new CustomInterface('menu.kando.Kando');
    CustomInterface.configureMembers({
      methods: {
        sendWMInfo: { inSignature: 'ssii', outSignature: '', noReply: false },
        trigger: { inSignature: 's', outSignature: '', noReply: false },
      },
    });

    // Execute the shortcut action whenever the KWin script sends a signal.
    this.kandoInterface.triggerCallback = onShortcutActivated;

    const bus = DBus.sessionBus();
    await bus.requestName('menu.kando.Kando', 0);
    bus.export('/menu/kando/Kando', this.kandoInterface);

    // Acquire the KWin scripting interface to run the scripts.
    const obj = await bus.getProxyObject('org.kde.KWin', '/Scripting');
    this.scriptingInterface = obj.getInterface('org.kde.kwin.Scripting');
  }

  /**
   * We only unbind all shortcuts if we are using the KWin scripting interface for binding
   * shortcuts. Global shortcuts bound via the global shortcuts portal should stay bound
   * even if Kando is closed.
   */
  public async deinit(): Promise<void> {
    if (!this.globalShortcutsAvailable) {
      await this.bindShortcuts([]);
    }
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
   * This method binds the given global shortcuts. It tries to use the global shortcuts
   * portal if it is available. If it is not available, it falls back to a KWin script
   * which registers the shortcuts via the KWin scripting interface.
   *
   * @param shortcuts The shortcuts that should be bound now.
   * @param previouslyBound The shortcuts that were bound before this call.
   * @returns A promise which resolves when the shortcuts have been bound.
   */
  protected override async bindShortcutsImpl(
    shortcuts: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    previouslyBound: string[]
  ) {
    // If the global shortcuts portal is available, we use it to bind the shortcuts.
    if (this.globalShortcutsAvailable) {
      return this.bindShortcutsViaPortal(shortcuts);
    }

    // Otherwise, we use the KWin scripting interface to bind the shortcuts.
    return this.bindShortcutsViaKWin(shortcuts);
  }

  /**
   * On KDE Wayland, we cannot unbind shortcuts to inhibit them. If we did, the global
   * shortcuts portal would pop up all the time. So instead, we just check whether a
   * shortcut is in the inhibitedShortcuts array and do not emit the 'shortcutPressed' if
   * it is pressed. So we do not need to do anything here.
   *
   * @param shortcuts The shortcuts that should be inhibited now.
   * @param previouslyInhibited The shortcuts that were inhibited before this call.
   * @returns A promise which resolves when the shortcuts have been inhibited.
   */
  protected async inhibitShortcutsImpl(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    shortcuts: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    previouslyInhibited: string[]
  ) {}

  /**
   * This method binds the shortcuts via the global shortcuts portal. It first checks
   * which shortcuts are already bound and only triggers the portal if a new shortcut has
   * been added.
   *
   * @param shortcuts The shortcuts that should be bound now.
   * @returns A promise which resolves when the shortcuts have been bound.
   */
  private async bindShortcutsViaPortal(shortcuts: string[]) {
    if (shortcuts.length === 0) {
      return;
    }

    // Check if any of the shortcuts are new. If they are, we bind them via the portal.
    const oldShortcuts = await this.globalShortcuts.listShortcuts();
    const hasNewShortcut = shortcuts.some((shortcut) => !oldShortcuts.includes(shortcut));

    if (hasNewShortcut) {
      this.globalShortcuts.bindShortcuts(
        shortcuts.map((shortcut) => {
          return { id: shortcut, description: shortcut };
        })
      );
    }
  }

  /**
   * Creates and runs a KWin script which registers all configured shortcuts. Any
   * previously registered shortcuts are unregistered.
   *
   * @param shortcuts The shortcuts that should be bound now.
   * @returns A promise which resolves when the shortcuts have been bound.
   */
  private async bindShortcutsViaKWin(shortcuts: string[]) {
    // First disable all shortcuts by stopping the script.
    if (this.triggerScriptID >= 0) {
      await this.stopScript(this.triggerScriptID);
      this.triggerScriptID = -1;
    }

    // If there are no shortcuts, we are done.
    if (shortcuts.length === 0) {
      return;
    }

    // Then create a new script which registers all shortcuts.
    const script = shortcuts
      .map((shortcut) => {
        // Escape any ' or \ in the ID or description.
        const id = this.escapeString(shortcut);

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
  public wmInfoCallback: (info: IWMInfo) => void;
  public triggerCallback: (shortcutID: string) => void;

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

  // This is called by the global-shortcut KWin script whenever the trigger shortcut is pressed.
  public trigger(shortcutID: string) {
    if (this.triggerCallback) {
      this.triggerCallback(shortcutID);
    }
  }
}

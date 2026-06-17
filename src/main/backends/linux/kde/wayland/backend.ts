//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';
import DBus from 'dbus-final';
import lodash from 'lodash';

import { LinuxBackend } from '../../backend';
import { RemoteDesktop } from '../../portals/remote-desktop';
import { GlobalShortcuts } from '../../portals/global-shortcuts';
import { KeySequence, WindowDescription } from '../../../../../common';
import { mapKeys } from '../../../../../common/key-codes';

/**
 * This backend is used on KDE with Wayland. It uses the GlobalShortcuts desktop portal to
 * bind shortcuts. It talks to the Kando KWin Integration effect plugin to get information
 * about the currently focused window, the pointer position, and a few more things. Mouse
 * and keyboard events are simulated using the RemoteDesktop portal.
 *
 * Using the KWin scripting interface is a bit hacky, but for now it seems to be the only
 * way to get information on the focused window and the mouse pointer position! Here is a
 * request for a corresponding desktop portal:
 * https://github.com/flatpak/xdg-desktop-portal/issues/304
 */
export class KDEWaylandBackend extends LinuxBackend {
  /** The remote-desktop portal is used to simulate mouse and keyboard events. */
  private remoteDesktop = new RemoteDesktop();

  /** The global-shortcuts portal is used to bind os-level shortcuts if possible. */
  private globalShortcuts = new GlobalShortcuts();

  /** This indicates whether the global-shortcuts portal is available on the system. */
  private globalShortcutsAvailable = false;

  /** This is the DBus interface of the Kando KWin integration extension. */
  private interface: DBus.ClientInterface;

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
    if (this.interface) {
      return;
    }

    try {
      const bus = DBus.sessionBus();

      const obj = await bus.getProxyObject(
        'menu.kando.KWinIntegration',
        '/menu/kando/KWinIntegration'
      );

      this.interface = obj.getInterface('menu.kando.KWinIntegration1');
    } catch (e) {
      throw new Error(
        i18next.t('backends.kde.error', {
          link: 'https://github.com/kando-menu/kwin-integration',
          interpolation: { escapeValue: false },
        })
      );
    }

    this.globalShortcutsAvailable = await this.globalShortcuts.isAvailable();

    if (!this.globalShortcutsAvailable) {
      console.warn(
        'Global shortcuts portal is not available. Shortcuts will not work on KDE Wayland. Please install xdg-desktop-portal-kde to enable this feature.'
      );
    }

    // As this backend does not support inhibiting shortcuts by unbinding them,
    // we only prevent the action from being executed if the shortcut is in the
    // inhibitedShortcuts array.
    this.globalShortcuts.on('ShortcutActivated', (shortcutID: string) => {
      if (!this.isShortcutInhibited(shortcutID)) {
        this.onShortcutPressed(shortcutID);
      }
    });
  }

  /** Nothing to do here. */
  public async deinit(): Promise<void> {}

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
    const info = await this.interface.GetWMInfo();

    return {
      windowName: info.windowName.value,
      appName: info.appName.value,
      pointerX: info.pointerX.value,
      pointerY: info.pointerY.value,
      workArea: {
        x: info.workAreaX.value,
        y: info.workAreaY.value,
        width: info.workAreaWidth.value,
        height: info.workAreaHeight.value,
      },
    };
  }

  /**
   * Lists all currently open windows.
   *
   * @returns A promise which resolves to a list of all currently open windows, including
   *   their names and the apps they belong to.
   */
  public async getOpenWindows(): Promise<WindowDescription[]> {
    const windows = (await this.interface.GetOpenWindows()) as unknown[];

    return windows
      .map((entry) => {
        const pair = this.unwrapDBusValue(entry);
        if (!Array.isArray(pair) || pair.length < 2) {
          return null;
        }

        const windowName = this.unwrapDBusValue(pair[0]);
        const appName = this.unwrapDBusValue(pair[1]);

        if (typeof windowName !== 'string' || typeof appName !== 'string') {
          return null;
        }

        return { windowName, appName };
      })
      .filter((window): window is WindowDescription => window !== null);
  }

  /**
   * Focuses the given window.
   *
   * @param window The window to focus.
   * @returns A promise which resolves when the window has been focused.
   */
  public async focusWindow(window: WindowDescription): Promise<void> {
    const result = this.unwrapDBusValue(
      await this.interface.FocusWindow(window.windowName, window.appName)
    );

    if (result === false) {
      throw new Error(`Window not found: ${window.appName} - ${window.windowName}`);
    }
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
  protected override async simulateKeysImpl(keys: KeySequence) {
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
   * @param currentShortcuts The shortcuts that should be bound now. Some of these may be
   *   inhibited and should therefore not lead to emitting the 'shortcutPressed' event.
   * @param previousShortcuts The shortcuts that were bound before this call.
   * @returns A promise which resolves when the shortcuts have been updated.
   */
  protected override async onShortcutsChanged(
    currentShortcuts: string[],
    previousShortcuts: string[]
  ): Promise<void> {
    // No need to do anything if the shortcuts did not change.
    if (
      lodash.isEqual(currentShortcuts, previousShortcuts) ||
      !this.globalShortcutsAvailable
    ) {
      return;
    }

    if (currentShortcuts.length === 0) {
      return;
    }

    // Check if any of the currentShortcuts are new. If they are, we bind them via the portal.
    const oldShortcuts = await this.globalShortcuts.listShortcuts();
    const hasNewShortcut = currentShortcuts.some(
      (shortcut) => !oldShortcuts.includes(shortcut)
    );

    if (hasNewShortcut) {
      this.globalShortcuts.bindShortcuts(
        currentShortcuts.map((shortcut) => {
          return { id: shortcut, description: shortcut };
        })
      );
    }
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
   * Unwraps DBus values returned by dbus-final. Some values are plain JavaScript values,
   * while others are wrapped in an object containing a `value` property.
   */
  private unwrapDBusValue(value: unknown): unknown {
    if (typeof value === 'object' && value !== null && 'value' in value) {
      return (value as { value: unknown }).value;
    }

    return value;
  }
}

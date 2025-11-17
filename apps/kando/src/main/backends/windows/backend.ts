//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import os from 'node:os';
import { screen } from 'electron';
import { isexe } from 'isexe';

import { native } from './native';
import { Backend } from '../backend';
import { KeySequence, MenuItem, AppDescription } from '../../../common';
import { mapKeys } from '@kando/core/key-codes';
import { ItemTypeRegistry } from '../../../common/item-types/item-type-registry';

/**
 * This backend is used on Windows. It uses the native Win32 API to simulate key presses
 * and mouse movements. It also uses the Win32 API to get the currently focused window.
 */
export class WindowsBackend extends Backend {
  /**
   * This is a list of all installed applications on the system. Currently, this is
   * populated during the backend construction. We may want to update this list
   * dynamically in the future.
   */
  private installedApps: AppDescription[] = [];

  /**
   * This is a map of system icons. The key is the name of the corresponding app and the
   * value is the base64-encoded icon.
   */
  private systemIcons: Map<string, string> = new Map();

  /**
   * On Windows, the 'toolbar' window type is used. This is actually the only window type
   * supported by Electron on Windows.
   */
  public override getBackendInfo() {
    // Vibrancy is only supported on Windows 11 22H2 (build 22621) or higher.
    const release = os.release().split('.');
    const major = parseInt(release[0]);
    const minor = parseInt(release[1]);
    const build = parseInt(release[2]);

    const transparencySupported = major === 10 && minor === 0 && build >= 22621;

    return {
      name: 'Windows',
      menuWindowType: 'toolbar',
      supportsShortcuts: true,
      shouldUseTransparentSettingsWindow: transparencySupported,
    };
  }

  /** This is called when the backend is created. */
  public override async init() {
    native
      .listInstalledApplications()
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((app) => {
        this.installedApps.push({
          name: app.name,
          id: app.id,
          command: 'start "" "shell:AppsFolder\\' + app.id + '"',
          icon: app.name,
          iconTheme: 'system',
        });

        this.systemIcons.set(app.name, app.base64Icon);
      });
  }

  /** We only need to unbind all shortcuts when the backend is destroyed. */
  public override async deinit(): Promise<void> {
    await this.bindShortcuts([]);
  }

  /**
   * This uses the Win32 API to get the name and app of the currently focused window. In
   * addition, it uses Electron's screen module to get the current pointer position.
   *
   * @returns The name and app of the currently focused window as well as the current
   *   pointer position.
   */
  public override async getWMInfo() {
    const window = native.getActiveWindow();
    const pointer = screen.getCursorScreenPoint();

    // For some reason, this makes the method much faster. For now, I have no idea why.
    process.nextTick(() => {});

    return {
      windowName: window.name,
      appName: window.app,
      pointerX: pointer.x,
      pointerY: pointer.y,
      workArea: screen.getDisplayNearestPoint({
        x: pointer.x,
        y: pointer.y,
      }).workArea,
    };
  }

  /**
   * Each backend must provide a way to get a list of all installed applications. This is
   * used by the settings window to populate the list of available applications.
   */
  public override async getInstalledApps(): Promise<Array<AppDescription>> {
    return Array.from(this.installedApps.values());
  }

  /**
   * This returns the icons for installed applications.
   *
   * @returns A map of icon names to their CSS image sources.
   */
  public override async getSystemIcons(): Promise<Map<string, string>> {
    return this.systemIcons;
  }

  /**
   * We currently do not support dynamic icon theme changes on Windows. Kando needs to be
   * restarted for changes to take effect.
   */
  public override async systemIconsChanged(): Promise<boolean> {
    return false;
  }

  /**
   * On Windows, we create run-command menu items for dropped executable files. We also
   * assume that lnk files are executable. We also support dropping UWP app links dropped
   * from the start menu.
   *
   * @param name The name of the file that was dropped. This is usually the file name
   *   without the path.
   * @param path The full path to the file that was dropped. There are some edge-cases
   *   where the path cannot be determined (for instance, if something is dragged from the
   *   Windows start menu). In this case, the path will be an empty string.
   */
  public override async createItemForDroppedFile(
    name: string,
    path: string
  ): Promise<MenuItem | null> {
    const commandItemType = ItemTypeRegistry.getInstance().getType('command');

    // If an executable file was dropped, create a menu item for it. We will attempt to
    // find a matching application in the list of installed apps. If we find one, we can
    // use the icon and the name of the application. We simply assume that lnk files are
    // executable.
    if (path.endsWith('.lnk') || (await isexe(path, { ignoreErrors: true }))) {
      const appName = name.slice(0, name.lastIndexOf('.'));
      const app = this.installedApps.find((app) => app.name === appName);

      return {
        type: 'command',
        name: app ? app.name : commandItemType.defaultName,
        icon: app ? app.name : commandItemType.defaultIcon,
        iconTheme: app ? 'system' : commandItemType.defaultIconTheme,
        data: {
          command: '"' + path + '"',
        },
      };
    }

    // If the path does not refer to an executable file, it can still be an UWP app link.
    // These can for instance be dragged from the start menu. We check the name and the
    // path.
    const app = this.installedApps.find(
      (app) =>
        app.name === name || app.id === name || app.name === path || app.id === path
    );

    if (app) {
      return {
        type: 'command',
        name: app.name,
        icon: app.name,
        iconTheme: 'system',
        data: {
          command: app.command,
        },
      };
    }

    // For all other (non-executable) files, we create a simple file-item.
    return super.createItemForDroppedFile(name, path);
  }

  /**
   * Moves the pointer by the given amount using the Win32 API.
   *
   * @param dx The amount of horizontal movement.
   * @param dy The amount of vertical movement.
   */
  public override async movePointer(dx: number, dy: number) {
    native.movePointer(dx, dy);
  }

  /**
   * This simulates a key sequence using the Windows API. If one of the given keys in the
   * sequence is not known, an exception will be thrown.
   *
   * @param keys The keys to simulate.
   */
  public override async simulateKeys(keys: KeySequence) {
    // We first need to convert the given DOM key names to Win32 key codes. If a key code is
    // not found, this throws an error.
    const keyCodes = mapKeys(keys, 'windows');

    // Now simulate the key presses. We wait a couple of milliseconds if the key has a
    // delay specified.
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].delay > 0) {
        await new Promise((resolve) => {
          setTimeout(resolve, keys[i].delay);
        });
      }

      native.simulateKey(keyCodes[i], keys[i].down);
    }
  }

  /**
   * This fixes the acrylic effect on Windows after the window has been maximized. See
   * here: https://github.com/electron/electron/issues/42393
   *
   * @param hwnd The window handle.
   */
  public async fixAcrylicEffect(hwnd: number) {
    native.fixAcrylicEffect(hwnd);
  }
}

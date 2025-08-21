//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { screen, app } from 'electron';
import { isexe } from 'isexe';

import { native } from './native';
import { Backend } from '../backend';
import { KeySequence, AppDescription, MenuItem } from '../../../common';
import { mapKeys } from '../../../common/key-codes';
import { ItemTypeRegistry } from '../../../common/item-types/item-type-registry';

export class MacosBackend extends Backend {
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
   * On macOS, the window type is set to 'panel'. This makes sure that the window is
   * always on top of other windows and that it is shown on all workspaces.
   */
  public getBackendInfo() {
    return {
      name: 'macOS',
      menuWindowType: 'normal',
      supportsShortcuts: true,
      shouldUseTransparentSettingsWindow: true,
    };
  }

  /** On macOS, we use this to hide the dock icon. */
  public async init() {
    // Is there a way to hide the dock icon on macOS initially? If we hide it here, it
    // will be shown for a short moment when the app is started.
    app.dock.hide();

    // We can get a list of all installed applications on macOS.
    native
      .listInstalledApplications()
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((app) => {
        this.installedApps.push({
          id: app.id,
          name: app.name,
          command: 'open -a "' + app.id + '"',
          icon: app.name,
          iconTheme: 'system',
        });

        this.systemIcons.set(app.name, app.base64Icon);
      });
  }

  /** We only need to unbind all shortcuts when the backend is destroyed. */
  public async deinit(): Promise<void> {
    await this.bindShortcuts([]);
  }

  /**
   * @returns The name and class of the currently focused window as well as the current
   *   pointer position.
   */
  public async getWMInfo() {
    const pointer = screen.getCursorScreenPoint();
    const { name, app } = native.getActiveWindow();

    // For some reason, this makes the method much faster. For now, I have no idea why.
    process.nextTick(() => {});

    return {
      windowName: name,
      appName: app,
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
    return this.installedApps;
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
   * On macOS, we create run-command menu items for dropped executable files. If an app
   * bundle is dropped, we try to find it in our list of installed apps to get an icon and
   * the proper launch command.
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
    const appName = name.slice(0, name.lastIndexOf('.'));

    // If an executable file was dropped, create a menu item for it.
    if (await isexe(path, { ignoreErrors: true })) {
      return {
        type: 'command',
        name: appName,
        icon: commandItemType.defaultIcon,
        iconTheme: commandItemType.defaultIconTheme,
        data: {
          command: '"' + path + '"',
        },
      };
    }

    // If the path does not refer to an executable file, it can still be an app bundle
    // dragged from the Finder.ß
    const app = this.installedApps.find((app) => app.id === appName);

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
   * Moves the pointer by the given amount.
   *
   * @param dx The amount of horizontal movement.
   * @param dy The amount of vertical movement.
   */
  public async movePointer(dx: number, dy: number) {
    try {
      native.movePointer(dx, dy);
    } catch (e) {
      console.error('Failed to move mouse pointer: ' + e.message);
    }
  }

  /**
   * If one of the given keys in the sequence is not known, an exception will be thrown.
   *
   * @param shortcut The keys to simulate.
   */
  public async simulateKeys(keys: KeySequence) {
    // We first need to convert the given DOM key names to Apple key codes.  If a key code is
    // not found, this throws an error.
    const keyCodes = mapKeys(keys, 'macos');

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
}

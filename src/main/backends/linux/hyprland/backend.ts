//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { exec } from 'child_process';

import { WLRBackend } from '../wlroots/backend';
import { WMInfo, Shortcut } from '../../backend';

/**
 * This backend is used on Hyprland. It uses the generic wlroots backend and adds
 * pointer-location handling and shortcut handling using the hyprctl command line
 * utility.
 */
export class HyprBackend extends WLRBackend {
  /**
   * This uses the hyprctl commandline tool to get the current pointer position relative
   * to the currently focused monitor. The name and class of the currently focused window
   * are provided by the base class.
   *
   * @returns The name and class of the currently focused window as well as the current
   *   pointer position.
   */
  public override async getWMInfo(): Promise<WMInfo> {
    const [info, activeworkspace, monitors, cursorpos] = await Promise.all([
      super.getWMInfo(),
      this.hyprctl('activeworkspace'),
      this.hyprctl('monitors'),
      this.hyprctl('cursorpos'),
    ]);

    // Find the monitor which contains the cursor.
    const monitor = (monitors as Array<never>).find(
      (m) => m['id'] === activeworkspace['monitorID']
    );

    // Calculate the pointer position relative to the monitor.
    const x = cursorpos['x'] - monitor['x'];
    const y = cursorpos['y'] - monitor['y'];

    return { ...info, pointerX: x, pointerY: y };
  }

  /**
   * This binds a shortcut. The action callback is called when the shortcut is pressed. On
   * X11, this uses Electron's globalShortcut module.
   *
   * @param shortcut The shortcut to simulate.
   * @returns A promise which resolves when the shortcut has been simulated.
   */
  public override async bindShortcut(shortcut: Shortcut) {
    /*
    if (!globalShortcut.register(shortcut.accelerator, shortcut.action)) {
      throw new Error('Shortcut is already in use.');
    }
    */
  }

  /**
   * This unbinds a previously bound shortcut.
   *
   * @param shortcut The shortcut to unbind.
   */
  public override async unbindShortcut(shortcut: Shortcut) {
    // globalShortcut.unregister(shortcut.accelerator);
  }

  /** This unbinds all previously bound shortcuts. */
  public override async unbindAllShortcuts() {
    // globalShortcut.unregisterAll();
  }

  /**
   * This uses the hyprctl command line tool to execute a command and parse its JSON
   * output.
   *
   * @param command One of the hyprctl subcommands.
   * @returns A promise which resolves to the parsed JSON output of hyprctl.
   */
  private async hyprctl(command: string): Promise<never> {
    return new Promise((resolve, reject) => {
      exec(`hyprctl -j ${command}`, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(JSON.parse(stdout));
      });
    });
  }
}

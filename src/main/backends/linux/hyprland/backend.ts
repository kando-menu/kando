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
import { Shortcut } from '../../backend';
import { GlobalShortcutsHyprland } from '../portals/global-shortcuts-hyprland';

/**
 * This backend is used on Hyprland. It uses the generic wlroots backend and adds the
 * missing functionality using the hyprctl command line utility.
 *
 * Getting global shortcuts to work is pretty painful. In theory, we have at least three
 * options:
 *
 * - Rely on X11 global shortcuts and pass them through to the application using custom
 *   binding rules of Hyprland. However, this approach is not working as Kando does not
 *   have an open window when the hotkey is pressed.
 * - Use the xdg-desktop-portal to register global shortcuts. This should work, but
 *   Hyprland's portal implementation is very far from the standard. See:
 *   https://github.com/hyprwm/xdg-desktop-portal-hyprland/issues/56. Here you can see how
 *   the interface should look like:
 *   https://flatpak.github.io/xdg-desktop-portal/docs/#gdbus-org.freedesktop.portal.GlobalShortcuts
 *   And here is the Hyprland implementation:
 *   https://github.com/hyprwm/xdg-desktop-portal-hyprland/blob/master/src/portals/GlobalShortcuts.cpp#L199
 *   Besides, it also does not support the "preferred_trigger" property and hence the user
 *   would have to enter the shortcut in the Hyprland config.
 * - Hyprland comes with a custom Wayland protocol which allows to register global
 *   shortcuts. As this is at least well-defined, we use it here. See:
 *   https://github.com/hyprwm/hyprland-protocols/blob/main/protocols/hyprland-global-shortcuts-v1.xml
 *
 * As a consequence, there are some caveats:
 *
 * - Keybindings have to be set up manually. Like this:
 * - For now, the "turbo mode" does not work properly as the initial modifier-release seems
 *   not to be forwarded to the application.
 * - Some window rules need to be set up manually. Like this:
 *
 * @example
 *   ```
 *    windowrule = noblur, kando
 *    windowrule = size 100% 100%, kando
 *    windowrule = noborder, kando
 *    windowrule = noanim, kando
 *   ```;
 */
export class HyprBackend extends WLRBackend {
  private globalShortcuts = new GlobalShortcutsHyprland();

  /**
   * This is called when the backend is created. We use it to print a warning, as the user
   * still needs to set up some window rules and bind the shortcuts.
   */
  public async init() {
    console.log(
      `
The Hyprland backend is still a bit experimental!
You have to perform some manual steps to make Kando work properly.
See https://github.com/kando-menu/kando/issues/234#issuecomment-1789650666
for more information.
`
    );
  }

  /**
   * 'splash' seems to be a good choice for Hyprland. See:
   * https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions
   *
   * @returns 'splash'
   */
  public getWindowType() {
    return 'splash';
  }

  /**
   * This uses the hyprctl commandline tool to get the current pointer position relative
   * to the currently focused monitor. The name and class of the currently focused window
   * are provided by the base class.
   *
   * @returns The name and class of the currently focused window as well as the current
   *   pointer position.
   */
  public async getWMInfo() {
    const [activewindow, activeworkspace, monitors, cursorpos] = await Promise.all([
      this.hyprctl('activewindow'),
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

    return {
      windowName: activewindow['initialTitle'] || '',
      windowClass: activewindow['initialClass'] || '',
      pointerX: x,
      pointerY: y,
    };
  }

  /**
   * This binds a shortcut. The action callback of the shortcut is called when the
   * shortcut is pressed.
   *
   * @param shortcut The shortcut to simulate.
   * @returns A promise which resolves when the shortcut has been bound.
   */
  public async bindShortcut(shortcut: Shortcut) {
    await this.globalShortcuts.bind(shortcut);
  }

  /**
   * This unbinds a previously bound shortcut.
   *
   * @param shortcut The shortcut to unbind.
   */
  public async unbindShortcut(shortcut: Shortcut) {
    // native.unbindShortcut(shortcut);
  }

  /** This unbinds all previously bound shortcuts. */
  public async unbindAllShortcuts() {
    // native.unbindAllShortcuts();
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

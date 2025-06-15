//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';
import { exec } from 'child_process';
import { WLRBackend } from '../wlroots/backend';
import { native } from './native';

/**
 * This backend is used on Hyprland. It uses the generic wlroots backend and adds the
 * missing functionality using the hyprctl command line utility and the
 * hyprland-global-shortcuts-v1 Wayland protocol.
 */
export class HyprBackend extends WLRBackend {
  /**
   * This is called when the backend is created. We use it to print a warning, as the user
   * still needs to set up some window rules and bind the shortcuts.
   */
  public async init() {
    console.log(
      `
The Hyprland backend is still a bit experimental!
You have to perform some manual steps to make Kando work properly.
See https://kando.menu/installation-on-linux/#-hyprland
for more information.
`
    );
  }

  /** We only need to unbind all shortcuts when the backend is destroyed. */
  public async deinit(): Promise<void> {
    await this.bindShortcuts([]);
  }

  /**
   * 'splash' seems to be a good choice for Hyprland. See:
   * https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions
   */
  public getBackendInfo() {
    return {
      name: 'Hyprland',
      menuWindowType: 'splash',
      supportsShortcuts: false,
      shortcutHint: i18next.t('backends.hyprland.shortcut-info'),
      shouldUseTransparentSettingsWindow: true,
    };
  }

  /**
   * This uses the hyprctl commandline tool to get the current pointer position relative
   * to the currently focused monitor as well as name and app of the currently focused
   * window.
   *
   * @returns The name and app of the currently focused window as well as the current
   *   pointer position.
   */
  public async getWMInfo() {
    // We need to call hyprctl multiple times to get all the information we need.
    const [activewindow, cursorpos] = await Promise.all([
      this.hyprctl('activewindow'),
      this.hyprctl('cursorpos'),
    ]);

    return {
      windowName: activewindow['initialTitle'] || '',
      appName: activewindow['initialClass'] || '',
      pointerX: cursorpos['x'],
      pointerY: cursorpos['y'],
    };
  }

  /**
   * On GNOME Wayland, the globalShortcuts module from Electron does not work. Instead, we
   * use the DBus interface of the Kando GNOME Shell integration extension to bind and
   * unbind shortcuts.
   *
   * @param shortcuts The shortcuts that should be bound now.
   * @param previouslyBound The shortcuts that were bound before this call.
   * @returns A promise which resolves when the shortcuts have been bound.
   */
  protected override async bindShortcutsImpl(
    shortcuts: string[],
    previouslyBound: string[]
  ) {
    // Use a shortcut if we unbind all shortcuts :)
    if (shortcuts.length === 0) {
      native.unbindAllShortcuts();
      return;
    }

    const shortcutsToUnbind = previouslyBound.filter((s) => !shortcuts.includes(s));
    const shortcutsToBind = shortcuts.filter((s) => !previouslyBound.includes(s));

    // Unbind the obsolete shortcuts.
    for (const shortcut of shortcutsToUnbind) {
      native.unbindShortcut(shortcut);
    }

    // Bind the new shortcuts.
    for (const shortcut of shortcutsToBind) {
      native.bindShortcut({
        trigger: shortcut,
        action: () => {
          this.onShortcutPressed(shortcut);
        },
      });
    }
  }

  /**
   * This uses the hyprctl command line tool to execute a command and parse its JSON
   * output.
   *
   * @param subcommand One of the hyprctl subcommands.
   * @returns A promise which resolves to the parsed JSON output of hyprctl.
   */
  private async hyprctl(subcommand: string): Promise<never> {
    return new Promise((resolve, reject) => {
      let command = `hyprctl -j ${subcommand}`;

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

        resolve(JSON.parse(stdout));
      });
    });
  }
}

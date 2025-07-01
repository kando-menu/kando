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
import { GlobalShortcuts } from '../portals/global-shortcuts';
import { screen } from 'electron';

/**
 * This backend is used on Hyprland. It uses the generic wlroots backend and adds the
 * missing functionality using the hyprctl command line utility and the global-shortcuts
 * desktop protocol.
 */
export class HyprBackend extends WLRBackend {
  /** The global-shortcuts portal is used to bind os-level shortcuts. */
  private globalShortcuts = new GlobalShortcuts();

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

    // Emit the 'shortcutPressed' event when a shortcut is activated.
    this.globalShortcuts.on('ShortcutActivated', (shortcutID: string) => {
      if (!this.getInhibitedShortcuts().includes(shortcutID)) {
        this.onShortcutPressed(shortcutID);
      }
    });
  }

  /** Nothing to be done here. */
  public async deinit() {}

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
    try {
      const [activewindow, cursorpos] = await Promise.all([
        this.hyprctl('activewindow'),
        this.hyprctl('cursorpos'),
      ]);

      return {
        windowName: activewindow['initialTitle'] || '',
        appName: activewindow['initialClass'] || '',
        pointerX: cursorpos['x'],
        pointerY: cursorpos['y'],
        workArea: screen.getDisplayNearestPoint({
          x: cursorpos['x'],
          y: cursorpos['y'],
        }).workArea,
      };
    } catch (error) {
      console.error('Failed to get WM info from hyprctl:', error);
      return {
        windowName: '',
        appName: '',
        pointerX: 0,
        pointerY: 0,
        workArea: screen.getDisplayNearestPoint({
          x: 0,
          y: 0,
        }).workArea,
      };
    }
  }

  /**
   * This method binds the given global shortcuts. It uses the global-shortcuts desktop
   * portal.
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
    // Nothing to do if no shortcuts are given.
    if (shortcuts.length === 0) {
      return;
    }

    this.globalShortcuts.bindShortcuts(
      shortcuts.map((shortcut) => {
        return {
          id: shortcut,
          description: 'Open the Kando menu with ID "' + shortcut + '"',
        };
      })
    );
  }

  /**
   * On with the desktop portal, we cannot unbind shortcuts to inhibit them. So instead,
   * we just check whether a shortcut is in the inhibitedShortcuts array and do not emit
   * the 'shortcutPressed' if it is pressed. So we do not need to do anything here.
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

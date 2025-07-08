//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Louis Dalibard <ontake@ontake.dev>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';
import { exec } from 'child_process';

import { WLRBackend } from '../wlroots/backend';
import { GlobalShortcuts } from '../portals/global-shortcuts';
import { screen } from 'electron';

/**
 * This backend is used on Niri. It uses the generic wlroots backend and adds the missing
 * functionality using the niri msg command line utility and the global-shortcuts desktop
 * protocol.
 */
export class NiriBackend extends WLRBackend {
  /** The global-shortcuts portal is used to bind os-level shortcuts. */
  private globalShortcuts = new GlobalShortcuts();

  /**
   * This is called when the backend is created. We use it to print a warning, as the user
   * still needs to set up some window rules and bind the shortcuts.
   */
  public async init() {
    console.log(
      `
The Niri backend is still a bit experimental!
You have to perform some manual steps to make Kando work properly.
See https://kando.menu/installation-on-linux/#-niri
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
   * 'splash' seems to be a good choice for Niri (same as Hyprland). See:
   * https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions
   */
  public getBackendInfo() {
    return {
      name: 'Niri',
      menuWindowType: 'splash',
      supportsShortcuts: false,
      shortcutHint: i18next.t('backends.niri.shortcut-info'),
      shouldUseTransparentSettingsWindow: true,
    };
  }

  /**
   * The pointer position as well as the work-area size are retrieved via a native addon
   * which spawns a temporary wlr_layer_shell overlay surface. The niri msg command-line
   * tool is used for getting the name and app of the currently focused window.
   *
   * @returns The name and app of the currently focused window as well as the current
   *   pointer position and work area.
   */
  public async getWMInfo() {
    try {
      const activewindow = await this.nirimsg('focused-window');
      const { pointerX, pointerY, workAreaWidth, workAreaHeight } =
        this.getPointerPositionAndWorkAreaSize();
      const workArea = screen.getDisplayNearestPoint({
        x: pointerX,
        y: pointerY,
      }).workArea;
      workArea.width = workAreaWidth;
      workArea.height = workAreaHeight;

      return {
        pointerX,
        pointerY,
        windowName: activewindow['title'] || '',
        appName: activewindow['app_id'] || '',
        workArea,
      };
    } catch (error) {
      console.error('Failed to get WM info:', error);
      return {
        pointerX: 0,
        pointerY: 0,
        windowName: '',
        appName: '',
        workArea: screen.getDisplayNearestPoint({
          x: 0,
          y: 0,
        }).workArea, // fallback to Electron's default method
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
   * This uses the niri msg command line tool to execute a command and parse its JSON
   * output.
   *
   * @param subcommand One of the nirimsg subcommands.
   * @returns A promise which resolves to the parsed JSON output of nirimsg.
   */
  private async nirimsg(subcommand: string): Promise<never> {
    return new Promise((resolve, reject) => {
      let command = `niri msg -j ${subcommand}`;

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

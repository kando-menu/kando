//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Louis Dalibard <ontake@ontake.dev>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';
import lodash from 'lodash';

import { WLRBackend } from '../wlroots/backend';
import { GlobalShortcuts } from '../portals/global-shortcuts';
import { screen } from 'electron';

import { GeneralSettings } from '../../../../common';
import { Settings } from '../../../../main/settings';

/**
 * This backend is used on Niri. It uses the generic wlroots backend and adds the missing
 * functionality using the niri msg command line utility and the global-shortcuts desktop
 * protocol.
 */
export class NiriBackend extends WLRBackend {
  /** The global-shortcuts portal is used to bind os-level shortcuts. */
  private globalShortcuts = new GlobalShortcuts();

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
   * This is called when the backend is created. We use it to print a warning, as the user
   * still needs to set up some window rules and bind the shortcuts.
   */
  public async init(generalSettings: Settings<GeneralSettings>) {
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
      if (!this.isShortcutInhibited(shortcutID)) {
        this.onShortcutPressed(shortcutID);
      }
    });

    // Set timeout options
    this.generalSettings = generalSettings;
  }

  /** Nothing to be done here. */
  public async deinit() {}

  /**
   * The pointer position as well as the work-area size are retrieved via a native addon
   * which spawns a temporary wlr_layer_shell overlay surface. The currently focused
   * window is queried via the foreign-toplevel protocol.
   *
   * @returns The name and app of the currently focused window as well as the current
   *   pointer position and work area.
   */
  public async getWMInfo() {
    try {
      const focusedWindow = await this.getFocusedWindow();
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
        windowName: focusedWindow?.windowName || '',
        appName: focusedWindow?.appName || '',
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
    if (lodash.isEqual(currentShortcuts, previousShortcuts)) {
      return;
    }

    this.globalShortcuts.bindShortcuts(
      currentShortcuts.map((shortcut) => {
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
}

//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Louis Dalibard <ontake@ontake.dev>
// SPDX-FileCopyrightText: William Chuang <ponponli2000@gmail.com>
// SPDX-License-Identifier: MIT

import i18next from 'i18next';

import { WLRBackend } from '../wlroots/backend';
import { screen } from 'electron';

import { GeneralSettings } from '../../../../common';
import { Settings } from '../../../../main/settings';

/**
 * This backend is used on Umbriel. Umbriel supports all protocols required by the generic
 * wlroots backend. Global shortcuts are not bound by Kando; instead, users bind them in
 * Umbriel's keybinds.toml. When running in a Flatpak, Umbriel only exposes these
 * protocols to Kando if a matching security_context_rule allows them.
 */
export class UmbrielBackend extends WLRBackend {
  /**
   * 'splash' seems to be a good choice for Umbriel (same as Niri and Hyprland). See:
   * https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions
   */
  public getBackendInfo() {
    return {
      name: 'Umbriel',
      menuWindowType: 'splash',
      supportsListingWindows: true,
      supportsFocusingWindows: true,
      supportsShortcuts: false,
      shortcutHint: i18next.t('backends.umbriel.shortcut-info'),
      shouldUseTransparentSettingsWindow: true,
    };
  }

  /**
   * This is called when the backend is created. We use it to print a hint, as the user
   * still needs to bind the shortcuts and, in a Flatpak, allow the required protocols.
   */
  public async init(generalSettings: Settings<GeneralSettings>) {
    console.log(
      `
The Umbriel backend is still a bit experimental!
Bind your shortcuts in Umbriel's keybinds.toml with 'kando --menu "Menu Name"'.
When running in a Flatpak, add a security_context_rule to Umbriel's config.toml
which allows zwlr_layer_shell_v1, zwlr_virtual_pointer_manager_v1,
zwp_virtual_keyboard_manager_v1, zwlr_foreign_toplevel_manager_v1 and
zxdg_output_manager_v1 for menu.kando.Kando.
`
    );

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
   * Global shortcuts are bound in Umbriel's keybinds.toml, so there is nothing to be done
   * here. We still override this method to prevent the base class from trying to bind the
   * shortcuts via Electron's globalShortcut module.
   */
  protected override async onShortcutsChanged(): Promise<void> {}
}

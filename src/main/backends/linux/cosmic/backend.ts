//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Sam Ludford <samludford76@gmail.com>
// SPDX-License-Identifier: MIT

import fs from 'fs';
import os from 'os';
import path from 'path';
import { ChildProcess, spawn } from 'child_process';
import i18next from 'i18next';
import DBus from 'dbus-final';

import { LinuxBackend } from '../backend';
import { BackendInfo, KeySequence, WindowDescription, WMInfo } from '../../../../common';
import { mapKeys } from '../../../../common/key-codes';

/** DBus name, object path and interface served by kando-cosmic-helper. */
const BUS_NAME = 'menu.kando.CosmicIntegration';
const OBJECT_PATH = '/menu/kando/CosmicIntegration';
const INTERFACE = 'menu.kando.CosmicIntegration1';

/** How long to wait for a freshly spawned helper to show up on the bus. */
const HELPER_STARTUP_TIMEOUT = 5000;

/**
 * Cosmic-comp auto-tiles every new window unless there is a tiling exception for it.
 * There is no protocol to opt out, so the user has to add this rule once.
 */
const TILING_EXCEPTION_FILE =
  '.config/cosmic/com.system76.CosmicSettings.WindowRules/v1/tiling_exception_custom';
const TILING_EXCEPTION_RULE = `    (
        enabled: true,
        appid: "menu.kando.Kando",
        title: "^Kando Menu$",
    ),`;

/**
 * This backend is used on COSMIC (cosmic-comp) with Wayland. cosmic-comp exposes no
 * pointer query, no wlr-foreign-toplevel and no GlobalShortcuts portal, so this backend
 * talks to a small Rust daemon (kando-cosmic-helper, see ./helper) over DBus, in the same
 * shape as the GNOME backend talks to its shell extension. The helper uses
 * zwlr_layer_shell_v1 to read the pointer position, zcosmic_toplevel_info_v1 for windows,
 * zwp_virtual_keyboard_manager_v1 for key simulation and wp_pointer_warp_v1 to move the
 * pointer.
 *
 * Global shortcuts cannot be bound: users bind `kando --menu "Name"` to a custom shortcut
 * in COSMIC Settings.
 */
export class CosmicBackend extends LinuxBackend {
  /** The DBus interface of kando-cosmic-helper. */
  private interface?: DBus.ClientInterface;

  /** If we had to spawn the helper ourselves, this is its process. */
  private helperProcess?: ChildProcess;

  /**
   * 'splash' works best for the other non-GNOME Wayland compositors (Hyprland, Niri), so
   * we use it here as well.
   */
  public getBackendInfo(): BackendInfo {
    return {
      name: 'COSMIC',
      menuWindowType: 'splash',
      supportsListingWindows: true,
      supportsFocusingWindows: true,
      supportsShortcuts: false,
      shortcutHint: i18next.t('backends.cosmic.shortcut-info'),
      // cosmic-comp does not blur behind windows, so a transparent settings window
      // would just look broken.
      shouldUseTransparentSettingsWindow: false,
    };
  }

  /**
   * Connects to kando-cosmic-helper on the session bus. If it is not running, it is
   * spawned (and killed again in deinit()).
   */
  public async init() {
    if (this.interface) {
      return;
    }

    console.log(
      `
The COSMIC backend cannot bind global shortcuts. Bind a custom shortcut in
COSMIC Settings > Keyboard > Shortcuts which runs 'kando --menu "Menu Name"'.
`
    );

    const bus = DBus.sessionBus();

    this.interface = await this.connect(bus);

    if (!this.interface) {
      const binary = this.findHelperBinary();
      if (binary) {
        console.log(`Starting COSMIC helper: ${binary}`);
        this.helperProcess = spawn(binary, ['daemon', '--exit-with-parent'], {
          stdio: ['ignore', 'ignore', 'inherit'],
        });
        this.helperProcess.on('exit', (code) => {
          console.warn(`kando-cosmic-helper exited with code ${code}.`);
          this.helperProcess = undefined;
        });

        const deadline = Date.now() + HELPER_STARTUP_TIMEOUT;
        while (!this.interface && Date.now() < deadline && this.helperProcess) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          this.interface = await this.connect(bus);
        }
      }
    }

    this.checkTilingException();

    if (!this.interface) {
      throw new Error(
        i18next.t('backends.cosmic.error', {
          link: 'https://github.com/sam-ludford/kando-cosmic-integration',
          interpolation: { escapeValue: false },
        })
      );
    }
  }

  /** Stops the helper if we started it. */
  public async deinit(): Promise<void> {
    if (this.helperProcess) {
      this.helperProcess.kill();
      this.helperProcess = undefined;
    }
    this.interface = undefined;
  }

  /**
   * Asks the helper for the focused window and the pointer position. The work area is the
   * logical geometry of the output the pointer is on; cosmic-comp does not report the
   * panel-adjusted work area to clients.
   */
  public async getWMInfo(): Promise<WMInfo> {
    const [windowName, appName, pointerX, pointerY, x, y, width, height] =
      await this.interface!.GetWMInfo();

    return {
      windowName,
      appName,
      pointerX,
      pointerY,
      workArea: { x, y, width, height },
    };
  }

  /** Lists all open toplevels via zcosmic_toplevel_info_v1. */
  public async getOpenWindows(): Promise<WindowDescription[]> {
    const pairs: [string, string][] = await this.interface!.GetOpenWindows();
    return pairs.map(([windowName, appName]) => ({ windowName, appName }));
  }

  /** Activates the given toplevel via zcosmic_toplevel_manager_v1. */
  public async focusWindow(window: WindowDescription): Promise<void> {
    const found = await this.interface!.FocusWindow(window.windowName, window.appName);
    if (!found) {
      console.warn(`Window "${window.windowName}" (${window.appName}) not found.`);
    }
  }

  /** Moves the pointer via wp_pointer_warp_v1. */
  public async movePointer(dx: number, dy: number): Promise<void> {
    try {
      await this.interface!.MovePointer(dx, dy);
    } catch (e) {
      console.error('Failed to move mouse pointer: ' + e.message);
    }
  }

  /**
   * Simulates a key sequence via zwp_virtual_keyboard_manager_v1. Unknown key names
   * throw.
   */
  protected override async simulateKeysImpl(keys: KeySequence) {
    const keyCodes = mapKeys(keys, 'linux');
    const translatedKeys = keyCodes.map((code, i) => [code, keys[i].down, keys[i].delay]);
    await this.interface!.SimulateKeys(translatedKeys);
  }

  /**
   * There is no way to bind global shortcuts on COSMIC (no GlobalShortcuts portal), so
   * this does nothing. Electron's globalShortcut module does not work on Wayland either.
   */
  protected override async onShortcutsChanged(): Promise<void> {}

  /**
   * Warns if COSMIC has no floating-window exception for Kando. Without it, the
   * transparent menu window gets tiled into the layout.
   */
  private checkTilingException() {
    const file = path.join(os.homedir(), TILING_EXCEPTION_FILE);
    let content = '';
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      // Missing file is handled below.
    }

    if (!content.includes('menu.kando.Kando')) {
      console.warn(
        `
COSMIC will tile Kando's menu window unless you add a floating-window exception.
Create ${file} with this content (COSMIC picks it up without a restart):

[
${TILING_EXCEPTION_RULE}
]
`
      );
    }
  }

  /** Returns the helper's interface if it is on the bus, undefined otherwise. */
  private async connect(bus: DBus.MessageBus): Promise<DBus.ClientInterface | undefined> {
    try {
      const obj = await bus.getProxyObject(BUS_NAME, OBJECT_PATH);
      return obj.getInterface(INTERFACE);
    } catch {
      return undefined;
    }
  }

  /**
   * Locates kando-cosmic-helper: $KANDO_COSMIC_HELPER, next to the packaged app, or
   * $PATH.
   */
  private findHelperBinary(): string | undefined {
    const candidates: string[] = [];

    if (process.env.KANDO_COSMIC_HELPER) {
      candidates.push(process.env.KANDO_COSMIC_HELPER);
    }

    if (process.resourcesPath) {
      candidates.push(path.join(process.resourcesPath, 'kando-cosmic-helper'));
    }

    for (const dir of (process.env.PATH || '').split(path.delimiter)) {
      if (dir) {
        candidates.push(path.join(dir, 'kando-cosmic-helper'));
      }
    }

    return candidates.find((candidate) => {
      try {
        fs.accessSync(candidate, fs.constants.X_OK);
        return true;
      } catch {
        return false;
      }
    });
  }
}

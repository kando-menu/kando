//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import * as path from 'path';
import { BrowserWindow } from 'electron';

import { PluginManager } from '../plugins/plugin-manager';
import {
  IPluginManifest,
  getWindowConfigWithDefaults,
} from '../../common/plugin-manifest';

// Imports for Kando's types - adjust path as needed for your fork
// import { IMenuItem } from '../menu/menu-item';
// import { KandoApp } from '../kando-app';

/**
 * Data stored in plugin menu items.
 */
export interface IPluginItemData {
  pluginId: string;
}

/**
 * Executes plugins when a plugin menu item is triggered.
 * 
 * This action:
 * 1. Gets the plugin info from PluginManager
 * 2. Reads the manifest and user configuration
 * 3. Creates a new BrowserWindow with the manifest's window settings
 * 4. Injects the configuration via a preload script
 * 5. Loads the plugin's index.html
 * 6. Returns immediately (fire-and-forget)
 */
export class PluginItemAction {
  private pluginManager: PluginManager;

  constructor(pluginManager?: PluginManager) {
    this.pluginManager = pluginManager || PluginManager.getInstance();
  }

  /**
   * Plugins execute immediately (fire-and-forget), so no delayed execution needed.
   * @param _item The menu item (unused for plugins).
   * @returns false - plugins don't need delayed execution.
   */
  public delayedExecution(_item: unknown): boolean {
    return false;
  }

  /**
   * Executes the plugin action.
   * 
   * @param item The menu item containing plugin data.
   * @param _app The Kando application instance (unused).
   * @returns A promise that resolves when the plugin window is created.
   */
  public async execute(item: { data?: unknown }, _app?: unknown): Promise<void> {
    const data = item.data as IPluginItemData | undefined;
    const pluginId = data?.pluginId;

    if (!pluginId) {
      console.error('Plugin action: No plugin ID specified');
      return;
    }

    // Get plugin info
    const plugin = this.pluginManager.getPlugin(pluginId);
    if (!plugin) {
      console.error(`Plugin action: Plugin "${pluginId}" not found`);
      return;
    }

    // Get user configuration
    const config = this.pluginManager.getPluginConfig(pluginId);

    // Create and show the plugin window
    await this.createPluginWindow(plugin.manifest, plugin.path, config);
  }

  /**
   * Creates a BrowserWindow for the plugin.
   * 
   * @param manifest The plugin manifest.
   * @param pluginPath Absolute path to the plugin directory.
   * @param config User configuration for the plugin.
   */
  private async createPluginWindow(
    manifest: IPluginManifest,
    pluginPath: string,
    config: Record<string, unknown>
  ): Promise<BrowserWindow> {
    const windowConfig = getWindowConfigWithDefaults(manifest);

    // Determine preload script path
    let preloadPath: string | undefined;
    if (manifest.preload) {
      preloadPath = path.join(pluginPath, manifest.preload);
    }

    // Create the BrowserWindow
    const window = new BrowserWindow({
      width: windowConfig.width,
      height: windowConfig.height,
      minWidth: windowConfig.minWidth,
      minHeight: windowConfig.minHeight,
      frame: windowConfig.frame,
      titleBarStyle: windowConfig.titleBarStyle,
      alwaysOnTop: windowConfig.alwaysOnTop,
      show: false, // Don't show until ready
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: preloadPath,
        // Pass config through additional data (accessed in preload)
        additionalArguments: [
          `--plugin-config=${encodeURIComponent(JSON.stringify(config))}`,
          `--plugin-id=${manifest.id}`,
        ],
      },
    });

    // Load the plugin's index.html
    const indexPath = path.join(pluginPath, 'index.html');
    await window.loadFile(indexPath);

    // Show the window once it's ready
    window.once('ready-to-show', () => {
      window.show();
    });

    // Handle window close - clean up
    window.on('closed', () => {
      // Window is automatically garbage collected
      console.log(`Plugin window closed: ${manifest.id}`);
    });

    return window;
  }

  /**
   * Gets description text for the action.
   * Used in the Kando settings UI.
   * 
   * @param data The plugin item data.
   * @returns A human-readable description.
   */
  public getDescription(data: IPluginItemData): string {
    if (!data.pluginId) {
      return 'No plugin selected';
    }

    const manifest = this.pluginManager.getPluginManifest(data.pluginId);
    if (!manifest) {
      return `Plugin not found: ${data.pluginId}`;
    }

    return manifest.description || manifest.name;
  }
}

/**
 * Factory function to create a PluginItemAction.
 * Used when registering with Kando's action registry.
 */
export function createPluginItemAction(): PluginItemAction {
  return new PluginItemAction();
}

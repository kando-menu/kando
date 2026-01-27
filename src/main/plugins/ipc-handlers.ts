//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { ipcMain, dialog, BrowserWindow } from 'electron';
import { PluginManager } from './plugin-manager';

/**
 * Simplified plugin info returned to the renderer process.
 */
export interface IPluginListItem {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
}

/**
 * Registers all IPC handlers for the plugin system.
 * Call this function during app initialization after the PluginManager is ready.
 */
export function registerPluginIPCHandlers(): void {
  const pluginManager = PluginManager.getInstance();

  /**
   * Handler: Get list of all installed plugins.
   * Used by the settings UI to populate the plugin dropdown.
   */
  ipcMain.handle('plugins:get-list', async (): Promise<IPluginListItem[]> => {
    const plugins = pluginManager.getAllPlugins();
    return plugins.map((plugin) => ({
      id: plugin.id,
      name: plugin.manifest.name,
      description: plugin.manifest.description,
      version: plugin.manifest.version,
      author: plugin.manifest.author,
    }));
  });

  /**
   * Handler: Get a specific plugin's manifest by ID.
   */
  ipcMain.handle('plugins:get-manifest', async (_event, pluginId: string) => {
    return pluginManager.getPluginManifest(pluginId);
  });

  /**
   * Handler: Import a plugin from a ZIP file.
   * Opens a file dialog and imports the selected plugin.
   */
  ipcMain.handle('plugins:import', async (event) => {
    // Get the browser window from which the request originated
    const webContents = event.sender;
    const browserWindow = BrowserWindow.fromWebContents(webContents);

    const result = await dialog.showOpenDialog(browserWindow!, {
      title: 'Import Plugin',
      filters: [{ name: 'Plugin Archive', extensions: ['zip'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Import cancelled' };
    }

    const zipPath = result.filePaths[0];
    return await pluginManager.importPluginFromZip(zipPath);
  });

  /**
   * Handler: Remove an installed plugin.
   */
  ipcMain.handle('plugins:remove', async (_event, pluginId: string) => {
    const success = pluginManager.removePlugin(pluginId);
    return { success, pluginId };
  });

  /**
   * Handler: Get plugin configuration (user settings).
   */
  ipcMain.handle('plugins:get-config', async (_event, pluginId: string) => {
    return pluginManager.getPluginConfig(pluginId);
  });

  /**
   * Handler: Save plugin configuration.
   */
  ipcMain.handle(
    'plugins:save-config',
    async (_event, pluginId: string, config: Record<string, unknown>) => {
      pluginManager.savePluginConfig(pluginId, config);
      return { success: true };
    }
  );

  /**
   * Handler: Rescan plugins directory.
   * Useful after manually adding plugins.
   */
  ipcMain.handle('plugins:rescan', async () => {
    const plugins = pluginManager.scanPlugins();
    return plugins.map((plugin) => ({
      id: plugin.id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
    }));
  });

  console.log('[Kando] Plugin IPC handlers registered');
}

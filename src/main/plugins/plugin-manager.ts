//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { app } from 'electron';

import {
  IPluginManifest,
  validateManifest,
  IManifestValidationResult,
} from '../../common/plugin-manifest';
import { extractZip, validateZipContents } from './zip-handler';
import { PluginConfigStore } from './plugin-config-store';

/**
 * Information about an installed plugin, including its path and manifest.
 */
export interface IPluginInfo {
  /** Unique plugin ID from manifest */
  id: string;

  /** Absolute path to the plugin directory */
  path: string;

  /** Parsed and validated manifest */
  manifest: IPluginManifest;
}

/**
 * Result of a plugin import operation.
 */
export interface IPluginImportResult {
  success: boolean;
  pluginId?: string;
  error?: string;
}

/**
 * The PluginManager handles discovering, loading, and managing plugins.
 * Plugins are stored in a platform-specific directory and can be imported
 * from ZIP files.
 */
export class PluginManager {
  /** Singleton instance */
  private static instance: PluginManager | null = null;

  /** Cache of loaded plugins */
  private plugins: Map<string, IPluginInfo> = new Map();

  /** Config store for user settings */
  private configStore: PluginConfigStore;

  /**
   * Private constructor for singleton pattern.
   */
  private constructor() {
    this.configStore = new PluginConfigStore();
  }

  /**
   * Get the singleton instance of PluginManager.
   */
  public static getInstance(): PluginManager {
    if (PluginManager.instance === null) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * Returns the platform-specific plugins directory.
   * 
   * - Windows: %APPDATA%/kando/plugins/
   * - macOS: ~/Library/Application Support/kando/plugins/
   * - Linux: ~/.config/kando/plugins/
   */
  public getPluginsDirectory(): string {
    let baseDir: string;

    switch (process.platform) {
      case 'win32':
        baseDir = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
        break;
      case 'darwin':
        baseDir = path.join(os.homedir(), 'Library', 'Application Support');
        break;
      default: // Linux and others
        baseDir = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
        break;
    }

    return path.join(baseDir, 'kando', 'plugins');
  }

  /**
   * Ensures the plugins directory exists, creating it if necessary.
   */
  public ensurePluginsDirectory(): void {
    const dir = this.getPluginsDirectory();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Scans the plugins directory and returns a list of valid plugins.
   * Invalid plugins are logged but not included in the result.
   */
  public scanPlugins(): IPluginInfo[] {
    this.ensurePluginsDirectory();
    const pluginsDir = this.getPluginsDirectory();
    const plugins: IPluginInfo[] = [];

    try {
      const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const pluginPath = path.join(pluginsDir, entry.name);
        const validation = this.validatePlugin(pluginPath);

        if (validation.valid && validation.manifest) {
          const pluginInfo: IPluginInfo = {
            id: validation.manifest.id,
            path: pluginPath,
            manifest: validation.manifest,
          };

          plugins.push(pluginInfo);
          this.plugins.set(validation.manifest.id, pluginInfo);
        } else {
          console.warn(
            `Invalid plugin at ${pluginPath}:`,
            validation.errors.join(', ')
          );
        }
      }
    } catch (error) {
      console.error('Error scanning plugins directory:', error);
    }

    return plugins;
  }

  /**
   * Validates a plugin directory by checking for required files and
   * parsing the manifest.
   * 
   * @param pluginPath Absolute path to the plugin directory.
   * @returns Validation result with manifest or errors.
   */
  public validatePlugin(pluginPath: string): IManifestValidationResult {
    const manifestPath = path.join(pluginPath, 'kando-plugin.json');
    const indexPath = path.join(pluginPath, 'index.html');

    // Check required files exist
    if (!fs.existsSync(manifestPath)) {
      return {
        valid: false,
        errors: ['Missing kando-plugin.json manifest file'],
      };
    }

    if (!fs.existsSync(indexPath)) {
      return {
        valid: false,
        errors: ['Missing index.html entry point'],
      };
    }

    // Parse and validate manifest
    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      const json = JSON.parse(manifestContent);
      return validateManifest(json);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        valid: false,
        errors: [`Failed to parse manifest: ${message}`],
      };
    }
  }

  /**
   * Gets the manifest for a specific plugin by ID.
   * 
   * @param pluginId The unique plugin identifier.
   * @returns The plugin manifest or undefined if not found.
   */
  public getPluginManifest(pluginId: string): IPluginManifest | undefined {
    const plugin = this.plugins.get(pluginId);
    return plugin?.manifest;
  }

  /**
   * Gets full plugin info by ID.
   * 
   * @param pluginId The unique plugin identifier.
   * @returns The plugin info or undefined if not found.
   */
  public getPlugin(pluginId: string): IPluginInfo | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Gets all loaded plugins.
   * 
   * @returns Array of all plugin infos.
   */
  public getAllPlugins(): IPluginInfo[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Imports a plugin from a ZIP file. The ZIP is validated, extracted
   * to the plugins directory, and the manifest is parsed.
   * 
   * @param zipPath Absolute path to the ZIP file.
   * @returns Import result with success status or error message.
   */
  public async importPluginFromZip(zipPath: string): Promise<IPluginImportResult> {
    // Validate ZIP contents before extraction
    const zipValidation = await validateZipContents(zipPath);
    if (!zipValidation.valid) {
      return {
        success: false,
        error: zipValidation.error || 'Invalid plugin ZIP file',
      };
    }

    // Extract to a temporary directory first
    const pluginsDir = this.getPluginsDirectory();
    this.ensurePluginsDirectory();

    // Use the plugin ID from the manifest for the folder name
    const tempDir = path.join(pluginsDir, `_temp_${Date.now()}`);

    try {
      await extractZip(zipPath, tempDir);

      // Validate the extracted plugin
      const validation = this.validatePlugin(tempDir);
      if (!validation.valid || !validation.manifest) {
        // Clean up temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }

      // Move to final location using plugin ID
      const finalDir = path.join(pluginsDir, validation.manifest.id);

      // Remove existing plugin with same ID if present
      if (fs.existsSync(finalDir)) {
        fs.rmSync(finalDir, { recursive: true, force: true });
      }

      fs.renameSync(tempDir, finalDir);

      // Add to cache
      const pluginInfo: IPluginInfo = {
        id: validation.manifest.id,
        path: finalDir,
        manifest: validation.manifest,
      };
      this.plugins.set(validation.manifest.id, pluginInfo);

      return {
        success: true,
        pluginId: validation.manifest.id,
      };
    } catch (error) {
      // Clean up on error
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }

      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to import plugin: ${message}`,
      };
    }
  }

  /**
   * Removes an installed plugin.
   * 
   * @param pluginId The unique plugin identifier.
   * @returns True if the plugin was removed, false if not found.
   */
  public removePlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return false;
    }

    try {
      // Remove plugin directory
      if (fs.existsSync(plugin.path)) {
        fs.rmSync(plugin.path, { recursive: true, force: true });
      }

      // Remove from cache
      this.plugins.delete(pluginId);

      // Remove config
      this.configStore.deleteConfig(pluginId);

      return true;
    } catch (error) {
      console.error(`Failed to remove plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Gets the user configuration for a plugin.
   * 
   * @param pluginId The unique plugin identifier.
   * @returns The user's config values or an empty object.
   */
  public getPluginConfig(pluginId: string): Record<string, unknown> {
    return this.configStore.getConfig(pluginId);
  }

  /**
   * Saves user configuration for a plugin.
   * 
   * @param pluginId The unique plugin identifier.
   * @param config The configuration values to save.
   */
  public savePluginConfig(pluginId: string, config: Record<string, unknown>): void {
    this.configStore.saveConfig(pluginId, config);
  }
}

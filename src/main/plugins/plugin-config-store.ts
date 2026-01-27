//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\\ | |  \\ |  |    This file belongs to Kando, the cross-platform         //
//   | \\_ |  | | \\| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { IPluginManifest, IPluginParameter } from '../../common/plugin-manifest';

/**
 * Stores user-defined plugin configuration values.
 * 
 * Each plugin's configuration is stored in a separate JSON file at:
 * - Windows: %APPDATA%/kando/plugin-configs/{plugin-id}.json
 * - macOS: ~/Library/Application Support/kando/plugin-configs/{plugin-id}.json
 * - Linux: ~/.config/kando/plugin-configs/{plugin-id}.json
 * 
 * Configuration is separate from the manifest (user data vs plugin definition).
 */
export class PluginConfigStore {
  /** In-memory cache of configs */
  private configs: Map<string, Record<string, unknown>> = new Map();

  /**
   * Returns the platform-specific plugin configs directory.
   */
  public getConfigDirectory(): string {
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

    return path.join(baseDir, 'kando', 'plugin-configs');
  }

  /**
   * Ensures the config directory exists.
   */
  private ensureConfigDirectory(): void {
    const dir = this.getConfigDirectory();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Gets the config file path for a plugin.
   */
  private getConfigPath(pluginId: string): string {
    return path.join(this.getConfigDirectory(), `${pluginId}.json`);
  }

  /**
   * Gets the configuration for a plugin.
   * Returns cached config or loads from disk.
   * 
   * @param pluginId The unique plugin identifier.
   * @returns The configuration object (may be empty).
   */
  public getConfig(pluginId: string): Record<string, unknown> {
    // Check cache first
    if (this.configs.has(pluginId)) {
      return this.configs.get(pluginId)!;
    }

    // Try to load from disk
    const configPath = this.getConfigPath(pluginId);
    
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content);
        this.configs.set(pluginId, config);
        return config;
      }
    } catch (error) {
      console.error(`Failed to load config for plugin ${pluginId}:`, error);
    }

    // Return empty config
    const emptyConfig: Record<string, unknown> = {};
    this.configs.set(pluginId, emptyConfig);
    return emptyConfig;
  }

  /**
   * Saves configuration for a plugin.
   * 
   * @param pluginId The unique plugin identifier.
   * @param config The configuration to save.
   */
  public saveConfig(pluginId: string, config: Record<string, unknown>): void {
    this.ensureConfigDirectory();
    
    // Update cache
    this.configs.set(pluginId, config);

    // Write to disk
    const configPath = this.getConfigPath(pluginId);
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Failed to save config for plugin ${pluginId}:`, error);
    }
  }

  /**
   * Deletes configuration for a plugin.
   * 
   * @param pluginId The unique plugin identifier.
   */
  public deleteConfig(pluginId: string): void {
    // Remove from cache
    this.configs.delete(pluginId);

    // Delete from disk
    const configPath = this.getConfigPath(pluginId);
    try {
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
      }
    } catch (error) {
      console.error(`Failed to delete config for plugin ${pluginId}:`, error);
    }
  }

  /**
   * Gets the configuration for a plugin with default values applied
   * from the manifest's parameter definitions.
   * 
   * @param pluginId The unique plugin identifier.
   * @param manifest The plugin manifest containing parameter definitions.
   * @returns Config with defaults applied for any missing values.
   */
  public getConfigWithDefaults(
    pluginId: string,
    manifest: IPluginManifest
  ): Record<string, unknown> {
    const config = this.getConfig(pluginId);
    const result: Record<string, unknown> = { ...config };

    if (manifest.parameters) {
      for (const [key, param] of Object.entries(manifest.parameters)) {
        if (result[key] === undefined && 'default' in param) {
          result[key] = (param as IPluginParameter & { default?: unknown }).default;
        }
      }
    }

    return result;
  }

  /**
   * Validates configuration against a manifest's parameter schema.
   * Returns an array of validation error messages.
   * 
   * @param config The configuration to validate.
   * @param manifest The plugin manifest with parameter definitions.
   * @returns Array of error messages (empty if valid).
   */
  public validateConfig(
    config: Record<string, unknown>,
    manifest: IPluginManifest
  ): string[] {
    const errors: string[] = [];

    if (!manifest.parameters) {
      return errors;
    }

    for (const [key, param] of Object.entries(manifest.parameters)) {
      const value = config[key];

      // Check required fields
      if (param.required && (value === undefined || value === null || value === '')) {
        errors.push(`Parameter "${param.title}" is required`);
        continue;
      }

      // Skip validation for undefined optional fields
      if (value === undefined) continue;

      // Type-specific validation
      switch (param.type) {
        case 'string':
        case 'password':
          if (typeof value !== 'string') {
            errors.push(`Parameter "${param.title}" must be a string`);
          } else {
            if (param.type === 'string') {
              if (param.minLength !== undefined && value.length < param.minLength) {
                errors.push(`Parameter "${param.title}" must be at least ${param.minLength} characters`);
              }
              if (param.maxLength !== undefined && value.length > param.maxLength) {
                errors.push(`Parameter "${param.title}" must be at most ${param.maxLength} characters`);
              }
              if (param.pattern !== undefined && !new RegExp(param.pattern).test(value)) {
                errors.push(`Parameter "${param.title}" does not match required pattern`);
              }
            }
          }
          break;

        case 'number':
          if (typeof value !== 'number') {
            errors.push(`Parameter "${param.title}" must be a number`);
          } else {
            if (param.min !== undefined && value < param.min) {
              errors.push(`Parameter "${param.title}" must be at least ${param.min}`);
            }
            if (param.max !== undefined && value > param.max) {
              errors.push(`Parameter "${param.title}" must be at most ${param.max}`);
            }
          }
          break;

        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Parameter "${param.title}" must be a boolean`);
          }
          break;

        case 'select':
          if (typeof value !== 'string' || !param.options.includes(value)) {
            errors.push(`Parameter "${param.title}" must be one of: ${param.options.join(', ')}`);
          }
          break;

        case 'file':
        case 'folder':
          if (typeof value !== 'string') {
            errors.push(`Parameter "${param.title}" must be a valid path`);
          }
          break;
      }
    }

    return errors;
  }

  /**
   * Migrates configuration when a plugin is updated and parameters change.
   * Removes values for parameters that no longer exist and adds defaults
   * for new parameters.
   * 
   * @param pluginId The unique plugin identifier.
   * @param manifest The updated plugin manifest.
   */
  public migrateConfig(pluginId: string, manifest: IPluginManifest): void {
    const config = this.getConfig(pluginId);
    const newConfig: Record<string, unknown> = {};

    if (manifest.parameters) {
      for (const [key, param] of Object.entries(manifest.parameters)) {
        if (config[key] !== undefined) {
          // Keep existing value
          newConfig[key] = config[key];
        } else if ('default' in param) {
          // Use default for new parameter
          newConfig[key] = (param as IPluginParameter & { default?: unknown }).default;
        }
      }
    }

    this.saveConfig(pluginId, newConfig);
  }
}

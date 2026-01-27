//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * Configuration for the plugin's BrowserWindow. These settings are used when
 * Kando creates a window to host the plugin.
 */
export interface IPluginWindowConfig {
  /** Width of the window in pixels. Default: 460 */
  width?: number;

  /** Height of the window in pixels. Default: 600 */
  height?: number;

  /** Minimum width of the window in pixels. Default: 360 */
  minWidth?: number;

  /** Minimum height of the window in pixels. Default: 450 */
  minHeight?: number;

  /** Whether the window has a frame. Default: false */
  frame?: boolean;

  /** Title bar style. Default: 'hidden' */
  titleBarStyle?: 'default' | 'hidden' | 'hiddenInset';

  /** Whether the window is always on top. Default: true */
  alwaysOnTop?: boolean;
}

/**
 * Base interface for plugin parameters. All parameter types extend this.
 */
export interface IPluginParameterBase {
  /** The display title for this parameter */
  title: string;

  /** A description explaining what this parameter does */
  description?: string;

  /** Whether this parameter is required. Default: false */
  required?: boolean;
}

/**
 * String parameter type - for text input fields.
 */
export interface IPluginParameterString extends IPluginParameterBase {
  type: 'string';
  default?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

/**
 * Number parameter type - for numeric input fields.
 */
export interface IPluginParameterNumber extends IPluginParameterBase {
  type: 'number';
  default?: number;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Boolean parameter type - for toggle switches.
 */
export interface IPluginParameterBoolean extends IPluginParameterBase {
  type: 'boolean';
  default?: boolean;
}

/**
 * Select parameter type - for dropdown menus.
 */
export interface IPluginParameterSelect extends IPluginParameterBase {
  type: 'select';
  options: string[];
  default?: string;
}

/**
 * File parameter type - for file path pickers.
 */
export interface IPluginParameterFile extends IPluginParameterBase {
  type: 'file';
  default?: string;
  fileTypes?: string[];
}

/**
 * Folder parameter type - for folder path pickers.
 */
export interface IPluginParameterFolder extends IPluginParameterBase {
  type: 'folder';
  default?: string;
}

/**
 * Password parameter type - for masked text input fields.
 * Values are stored securely.
 */
export interface IPluginParameterPassword extends IPluginParameterBase {
  type: 'password';
  default?: string;
}

/**
 * Union type for all parameter types.
 */
export type IPluginParameter =
  | IPluginParameterString
  | IPluginParameterNumber
  | IPluginParameterBoolean
  | IPluginParameterSelect
  | IPluginParameterFile
  | IPluginParameterFolder
  | IPluginParameterPassword;

/**
 * The plugin manifest schema. This is read from the kando-plugin.json file
 * in each plugin's directory.
 */
export interface IPluginManifest {
  /** Unique identifier for the plugin. Should be kebab-case. */
  id: string;

  /** Human-readable name of the plugin. */
  name: string;

  /** Semantic version string (e.g., "1.0.0"). */
  version: string;

  /** Short description of what the plugin does. */
  description?: string;

  /** Author name or organization. */
  author?: string;

  /** Path to the plugin icon file (relative to plugin directory). */
  icon?: string;

  /** Window configuration for the plugin. */
  window?: IPluginWindowConfig;

  /** Path to the Electron preload script (relative to plugin directory). */
  preload?: string;

  /** 
   * Parameters that can be configured by the user. 
   * Keys are parameter IDs, values are parameter definitions.
   */
  parameters?: Record<string, IPluginParameter>;
}

/**
 * Default window configuration applied when manifest doesn't specify values.
 */
export const DEFAULT_WINDOW_CONFIG: Required<IPluginWindowConfig> = {
  width: 460,
  height: 600,
  minWidth: 360,
  minHeight: 450,
  frame: false,
  titleBarStyle: 'hidden',
  alwaysOnTop: true,
};

/**
 * Result of validating a plugin manifest.
 */
export interface IManifestValidationResult {
  valid: boolean;
  errors: string[];
  manifest?: IPluginManifest;
}

/**
 * Validates a parsed JSON object as a plugin manifest.
 * 
 * @param json The parsed JSON object to validate.
 * @returns A validation result containing the manifest or errors.
 */
export function validateManifest(json: unknown): IManifestValidationResult {
  const errors: string[] = [];

  if (!json || typeof json !== 'object') {
    return { valid: false, errors: ['Manifest must be a valid JSON object'] };
  }

  const manifest = json as Record<string, unknown>;

  // Required fields
  if (!manifest.id || typeof manifest.id !== 'string') {
    errors.push('Missing or invalid "id" field (required, must be a string)');
  }

  if (!manifest.name || typeof manifest.name !== 'string') {
    errors.push('Missing or invalid "name" field (required, must be a string)');
  }

  if (!manifest.version || typeof manifest.version !== 'string') {
    errors.push('Missing or invalid "version" field (required, must be a string)');
  }

  // Optional string fields
  const optionalStrings = ['description', 'author', 'icon', 'preload'];
  for (const field of optionalStrings) {
    if (manifest[field] !== undefined && typeof manifest[field] !== 'string') {
      errors.push(`Invalid "${field}" field (must be a string if provided)`);
    }
  }

  // Validate window config if provided
  if (manifest.window !== undefined) {
    if (typeof manifest.window !== 'object' || manifest.window === null) {
      errors.push('Invalid "window" field (must be an object if provided)');
    } else {
      const windowErrors = validateWindowConfig(manifest.window as Record<string, unknown>);
      errors.push(...windowErrors);
    }
  }

  // Validate parameters if provided
  if (manifest.parameters !== undefined) {
    if (typeof manifest.parameters !== 'object' || manifest.parameters === null) {
      errors.push('Invalid "parameters" field (must be an object if provided)');
    } else {
      const params = manifest.parameters as Record<string, unknown>;
      for (const [key, param] of Object.entries(params)) {
        const paramErrors = validateParameter(key, param);
        errors.push(...paramErrors);
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], manifest: json as IPluginManifest };
}

/**
 * Validates window configuration.
 */
function validateWindowConfig(config: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const numericFields = ['width', 'height', 'minWidth', 'minHeight'];

  for (const field of numericFields) {
    if (config[field] !== undefined && typeof config[field] !== 'number') {
      errors.push(`Invalid window.${field} (must be a number if provided)`);
    }
  }

  if (config.frame !== undefined && typeof config.frame !== 'boolean') {
    errors.push('Invalid window.frame (must be a boolean if provided)');
  }

  if (config.alwaysOnTop !== undefined && typeof config.alwaysOnTop !== 'boolean') {
    errors.push('Invalid window.alwaysOnTop (must be a boolean if provided)');
  }

  if (config.titleBarStyle !== undefined) {
    const validStyles = ['default', 'hidden', 'hiddenInset'];
    if (!validStyles.includes(config.titleBarStyle as string)) {
      errors.push(`Invalid window.titleBarStyle (must be one of: ${validStyles.join(', ')})`);
    }
  }

  return errors;
}

/**
 * Validates a parameter definition.
 */
function validateParameter(key: string, param: unknown): string[] {
  const errors: string[] = [];

  if (!param || typeof param !== 'object') {
    errors.push(`Parameter "${key}": must be an object`);
    return errors;
  }

  const p = param as Record<string, unknown>;

  if (!p.type || typeof p.type !== 'string') {
    errors.push(`Parameter "${key}": missing or invalid "type" field`);
    return errors;
  }

  if (!p.title || typeof p.title !== 'string') {
    errors.push(`Parameter "${key}": missing or invalid "title" field`);
  }

  const validTypes = ['string', 'number', 'boolean', 'select', 'file', 'folder', 'password'];
  if (!validTypes.includes(p.type as string)) {
    errors.push(`Parameter "${key}": invalid type "${p.type}" (must be one of: ${validTypes.join(', ')})`);
  }

  // Type-specific validation
  if (p.type === 'select') {
    if (!Array.isArray(p.options) || p.options.length === 0) {
      errors.push(`Parameter "${key}": select type requires non-empty "options" array`);
    }
  }

  return errors;
}

/**
 * Applies default values to a manifest's window configuration.
 * 
 * @param manifest The plugin manifest.
 * @returns Complete window configuration with defaults applied.
 */
export function getWindowConfigWithDefaults(manifest: IPluginManifest): Required<IPluginWindowConfig> {
  return {
    ...DEFAULT_WINDOW_CONFIG,
    ...manifest.window,
  };
}

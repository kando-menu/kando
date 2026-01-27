//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * Plugin system exports for the main process.
 */

export { PluginManager } from './plugin-manager';
export type { IPluginInfo, IPluginImportResult } from './plugin-manager';
export { PluginConfigStore } from './plugin-config-store';
export {
  extractZip,
  validateZipContents,
  listZipContents,
  readFileFromZip,
} from './zip-handler';
export type { IZipValidationResult } from './zip-handler';

export { registerPluginIPCHandlers } from './ipc-handlers';
export type { IPluginListItem } from './ipc-handlers';

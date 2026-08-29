//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

export * from './general-settings';
export * from './menu-settings';
export * from './settings';
export * from './settings-window-state';

import { app } from 'electron';
import fs from 'fs-extra';
import path from 'path';

/**
 * The directory where the settings files are stored. Initialized by the first call to
 * `getConfigDirectory()`.
 */
let configDirectory: string | null = null;

/** Name of the json file that enables portable mode. */
export const portableJsonFileName: string = 'portableMode.json';

/**
 * Gets the directory where the settings files are stored. Usually, this is electron's
 * app.getPath('userData') directory. However, Kando allows for a portable mode where this
 * directory can be set by the user by placing a 'portableMode.json' file next to the
 * executable.
 *
 * @returns The directory where the settings files and all other config files are stored.
 */
export function getConfigDirectory(): string {
  if (configDirectory === null) {
    const execDir = path.dirname(process.execPath);
    console.log('Looking for', portableJsonFileName, 'in', execDir);

    const portableConfigPath = path.join(execDir, portableJsonFileName);

    if (fs.existsSync(portableConfigPath)) {
      try {
        const portableMode = fs.readJSONSync(portableConfigPath);
        if (portableMode.configDirectory) {
          configDirectory = portableMode.configDirectory;

          // Make sure the directory exists and that it is an absolute path.
          configDirectory = path.resolve(execDir, configDirectory);
          fs.mkdirSync(configDirectory, { recursive: true });
          console.log(`Using portable mode. Settings directory: ${configDirectory}`);
        } else {
          throw new Error('"configDirectory" field is missing or empty');
        }
      } catch (error) {
        console.error(
          'Error reading portableMode.json:',
          error instanceof Error ? error.message : error
        );
      }
    }

    if (configDirectory === null) {
      configDirectory = app.getPath('userData');
      console.log(`Not using portable mode. Settings directory: ${configDirectory}`);
    }
  }

  return configDirectory;
}

/**
 * Creates the custom config directory, if needed. Then assigns the given config directory
 * to the configDirectory variable.
 */
export function assignCustomConfigDirectory(portableConfigFolder: string) {
  console.log('Enabling custom config directory');

  try {
    portableConfigFolder = path.resolve(
      path.dirname(process.execPath),
      portableConfigFolder
    );

    if (!fs.existsSync(portableConfigFolder)) {
      fs.mkdirSync(portableConfigFolder, { recursive: true });
    }

    configDirectory = portableConfigFolder;
    console.log(`Custom config directory: ${configDirectory}`);
  } catch (error) {
    console.error('Error creating custom config directory:', error);
  }
}

/** Resets the config directory for testing purposes. Should only be used for unit tests. */
export function resetConfigDirectoryForTesting() {
  configDirectory = null;
}

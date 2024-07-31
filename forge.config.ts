// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    // https://electron.github.io/packager/main/interfaces/Options.html
    icon: 'assets/icons/icon',
    name: 'Kando',

    // This makes sure that the app is not shown in the dock on macOS.
    extendInfo: {
      LSUIElement: true,
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      // https://js.electronforge.io/interfaces/_electron_forge_maker_squirrel.InternalOptions.SquirrelWindowsOptions.html
    }),
    new MakerZIP({
      // https://js.electronforge.io/interfaces/_electron_forge_maker_zip.MakerZIPConfig.html
    }),
    new MakerDMG({
      // https://js.electronforge.io/interfaces/_electron_forge_maker_dmg.MakerDMGConfig.html
    }),
    new MakerRpm({
      // https://js.electronforge.io/interfaces/_electron_forge_maker_rpm.InternalOptions.MakerRpmConfigOptions.html
      options: {
        productName: 'Kando',
        genericName: 'Pie Menu',
        icon: 'assets/icons/icon.svg',
        homepage: 'https://github.com/kando-menu/kando',
        requires: ['libXtst'],
        categories: ['Utility'],
      },
    }),
    new MakerDeb({
      // https://js.electronforge.io/interfaces/_electron_forge_maker_deb.InternalOptions.MakerDebConfigOptions.html
      options: {
        productName: 'Kando',
        genericName: 'Pie Menu',
        icon: 'assets/icons/icon.svg',
        homepage: 'https://github.com/kando-menu/kando',
        depends: ['libxtst6'],
        categories: ['Utility'],
      },
    }),
  ],
  plugins: [
    new WebpackPlugin({
      // We add "'self' file: data:" to the default-src directive for images and CSS files
      // to allow loading images from the file system and data URLs. This is only
      // necessary for the development build. In the production build, webpack will serve
      // the app from a file instead of a server in which case electron will not enforce
      // the Content Security Policy.
      devContentSecurityPolicy:
        "default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data:; img-src 'self' file: data:; style-src-elem 'self' 'unsafe-inline' file: data:",
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/renderer/index.html',
            js: './src/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/renderer/preload.ts',
            },
          },
        ],
      },
      devServer: {
        client: {
          overlay: false,
          logging: 'warn',
        },
      },
    }),
  ],
};

// If the environment variable KANDO_OSX_SIGN is set, we sign the macOS app. This requires
// certivicates to be installed on the build machine.
if (process.env.KANDO_OSX_SIGN === 'true') {
  if (config.packagerConfig) {
    config.packagerConfig.osxSign = {};
  }
}

// If the environment variable KANDO_OSX_NOTARIZE is set, we notarize the macOS app. This
// requires your Apple Developer Account ID and an app specific password to be set for
// your account.
if (process.env.KANDO_OSX_NOTARIZE === 'true') {
  if (config.packagerConfig) {
    config.packagerConfig.osxNotarize = {
      appleId: process.env.OSX_APP_SPECIFIC_ID || '',
      appleIdPassword: process.env.OSX_APP_SPECIFIC_PASSWORD || '',
      teamId: process.env.OSX_TEAM_ID || '',
    };
  }
}

// On Windows and Linux, we need to set the executable name to "kando".
if (process.platform !== 'darwin') {
  if (config.packagerConfig) {
    config.packagerConfig.executableName = 'kando';
  }
}

export default config;

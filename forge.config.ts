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

// This is used to create the Windows installer. See the link below for the available options.
// https://js.electronforge.io/interfaces/_electron_forge_maker_squirrel.InternalOptions.SquirrelWindowsOptions.html
const makerSquirrel = new MakerSquirrel({
  loadingGif: 'assets/installer/loading.gif',
  setupIcon: 'assets/icons/icon.ico',
  iconUrl:
    'https://raw.githubusercontent.com/kando-menu/kando/main/assets/icons/icon.ico',
});

// This is used on all platforms to create a ZIP archive of the app. See the link below for the
// available options.
// https://js.electronforge.io/interfaces/_electron_forge_maker_zip.MakerZIPConfig.html
const makerZIP = new MakerZIP({});

// This is used to create the macOS DMG file. See the link below for the available options.
// https://js.electronforge.io/interfaces/_electron_forge_maker_dmg.MakerDMGConfig.html
const makerDMG = new MakerDMG({});

// This is used to create the DEB package for Linux. See the link below for the available options.
// https://js.electronforge.io/interfaces/_electron_forge_maker_deb.InternalOptions.MakerDebConfigOptions.html
const makerDeb = new MakerDeb({
  options: {
    productName: 'Kando',
    genericName: 'Pie Menu',
    icon: 'assets/icons/icon.svg',
    homepage: 'https://github.com/kando-menu/kando',
    depends: ['libxtst6'],
    categories: ['Utility'],
  },
});

// This is used to create the RPM package for Linux. See the link below for the available options.
// https://js.electronforge.io/interfaces/_electron_forge_maker_rpm.InternalOptions.MakerRpmConfigOptions.html
const makerRPM = new MakerRpm({
  options: {
    productName: 'Kando',
    genericName: 'Pie Menu',
    icon: 'assets/icons/icon.svg',
    homepage: 'https://github.com/kando-menu/kando',
    requires: ['libXtst'],
    categories: ['Utility'],
  },
});

// Below comes an evil hack to fix this issue: https://github.com/kando-menu/kando/issues/502
// For some reason, there seems to be no way to disable the build_id_links feature in the
// electron-installer-redhat package which is used by electron-forge to create RPM packages.
// The rpmbuild command is issued here: https://github.com/electron-userland/electron-installer-redhat/blob/main/src/installer.js#L66
// And we need to pass the "--define _build_id_links none" argument to it. Hence we override the
// createPackage method of the RedhatInstaller class to add this argument. This is a dirty hack
// and will most likely break in the future... Does anyone have a better solution?
if (makerRPM.isSupportedOnCurrentPlatform()) {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { Installer: RedhatInstaller } = require('electron-installer-redhat');
  const { spawn } = require('@malept/cross-spawn-promise');
  RedhatInstaller.prototype.createPackage = async function () {
    this.options.logger(
      "+++ Running patched createPackage method! See Kando's forge.config.ts for details. +++"
    );
    this.options.logger(`Creating package at ${this.stagingDir}`);
    const output = await spawn(
      'rpmbuild',
      [
        '-bb',
        this.specPath,
        '--target',
        `${this.options.arch}-${this.options.vendor}-${this.options.platform}`,
        '--define',
        `_topdir ${this.stagingDir}`,
        '--define', // Here is the important part:
        '_build_id_links none', // This is the argument we need to add.
      ],
      this.options.logger
    );
    this.options.logger(`rpmbuild output: ${output}`);
  };
}

const config: ForgeConfig = {
  packagerConfig: {
    // https://electron.github.io/packager/main/interfaces/Options.html
    icon: 'assets/icons/icon',
    name: 'Kando',

    // This makes sure that the app is not shown in the dock on macOS.
    extendInfo: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      LSUIElement: true,
    },

    // This is used to set the app name in the menu bar on macOS.
    protocols: [
      {
        name: 'Kando',
        schemes: ['kando'],
      },
    ],
  },
  rebuildConfig: {},
  makers: [makerSquirrel, makerZIP, makerDMG, makerDeb, makerRPM],
  plugins: [
    new WebpackPlugin({
      // We add "'self' file: data:" to the default-src directive for images and CSS files
      // to allow loading images from the file system and data URLs. This is only
      // necessary for the development build. In the production build, webpack will serve
      // the app from a file instead of a server in which case electron will not enforce
      // the Content Security Policy.
      devContentSecurityPolicy:
        "default-src 'self' 'unsafe-inline' data:; " +
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' data:; " +
        "img-src 'self' file: data: https:; " +
        "font-src 'self' file: data:; " +
        "style-src-elem 'self' 'unsafe-inline' file: data:; " +
        "media-src 'self' file: data:; " +
        "connect-src 'self' file:; ",

      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/menu-renderer/index.html',
            js: './src/menu-renderer/index.ts',
            name: 'menu_window',
            preload: {
              js: './src/menu-renderer/preload.ts',
            },
          },
          {
            html: './src/settings-renderer/index.html',
            js: './src/settings-renderer/index.tsx',
            name: 'settings_window',
            preload: {
              js: './src/settings-renderer/preload.ts',
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

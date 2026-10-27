// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerRpm, MakerRpmConfigOptions } from '@electron-forge/maker-rpm';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';

import { mainConfig } from './packaging/webpack/webpack.main.config';
import { rendererConfig } from './packaging/webpack/webpack.renderer.config';

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
// The "specTemplate" option is passed through to electron-installer-redhat but is not part of
// the MakerRpmConfigOptions type. Hence, we use a plain object intersected with the type here.
const rpmOptions: MakerRpmConfigOptions & { specTemplate: string } = {
  productName: 'Kando',
  genericName: 'Pie Menu',
  icon: 'assets/icons/icon.svg',
  homepage: 'https://github.com/kando-menu/kando',
  requires: ['libXtst'],
  categories: ['Utility'],

  // Disables build_id_links (https://github.com/kando-menu/kando/issues/502) and fixes the
  // name of the desktop file and the %install step. See the template for details.
  specTemplate: 'packaging/rpm/kando.spec.ejs',
};

const makerRPM = new MakerRpm({ options: rpmOptions });

// The Linux makers create desktop files named after the package "name" option. We patch the
// shared installer to support a dedicated desktop file base name so that we can keep the
// executable name as "kando" while generating "menu.kando.Kando.desktop".
if (makerDeb.isSupportedOnCurrentPlatform() || makerRPM.isSupportedOnCurrentPlatform()) {
  const { ElectronInstaller: electronInstaller } = require('electron-installer-common');
  const path = require('node:path');

  electronInstaller.prototype.createDesktopFile = async function () {
    this.options.logger(
      "+++ Running patched createDesktopFile method! See Kando's forge.config.ts for details. +++"
    );

    const templatePath = this.options.desktopTemplate || this.defaultDesktopTemplatePath;
    const baseDir = path.join(this.stagingDir, this.baseAppDir, 'share', 'applications');

    const desktopPath = path.join(baseDir, 'menu.kando.Kando.desktop');
    await this.createTemplatedFile(templatePath, desktopPath, 0o644);

    this.options.logger(`Desktop file created at ${desktopPath}`);
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
        "connect-src 'self' file: ws:; ",

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

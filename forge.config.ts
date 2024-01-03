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
    icon: 'assets/icons/icon',

    // This makes sure that the app is not shown in the dock on macOS.
    extendInfo: {
      LSUIElement: true,
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}),
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
    }),
  ],
};

export default config;

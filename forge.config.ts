// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

import type { ForgeConfig } from '@electron-forge/shared-types';
// import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    icon: 'src/assets/icons/icon',
  },
  rebuildConfig: {},
  makers: [
    //new MakerSquirrel({}),
    new MakerZIP({}),
    new MakerRpm({
      // https://js.electronforge.io/interfaces/_electron_forge_maker_rpm.InternalOptions.MakerRpmConfigOptions.html
      options: {
        productName: 'Kando',
        icon: 'src/assets/icons/icon.svg',
        homepage: 'https://github.com/kando-menu/kando',
        requires: ['xdotool'],
        categories: ['Utility'],
      },
    }),
    new MakerDeb({
      // https://js.electronforge.io/interfaces/_electron_forge_maker_deb.InternalOptions.MakerDebConfigOptions.html
      options: {
        productName: 'Kando',
        icon: 'src/assets/icons/icon.svg',
        homepage: 'https://github.com/kando-menu/kando',
        depends: ['xdotool'],
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
            html: './src/index.html',
            js: './src/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          },
        ],
      },
    }),
  ],
};

export default config;

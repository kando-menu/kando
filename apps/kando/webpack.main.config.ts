// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

import type { Configuration } from 'webpack';
import path from 'path';

import { rules } from './webpack.rules';
import { ignores } from './webpack.ignores';
import { plugins } from './webpack.plugins';

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file that runs in
   * the main process.
   */
  entry: './src/main/index.ts',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins,
  externals: ignores,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    alias: (() => {
      const alias: Record<string, string> = {};
      // Use source alias only in dev/serve; for production let Node resolve the built package
      if (process.env.WEBPACK_SERVE || process.env.NODE_ENV === 'development') {
        alias['@kando/core'] = path.resolve(__dirname, '../..', 'packages/core/src');
      }
      return alias;
    })(),
  },
};

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { ignores } from './webpack.ignores';

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
  externals: ignores,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
};
